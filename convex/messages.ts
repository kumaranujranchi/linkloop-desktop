import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getUserIdFromToken } from "./auth_helpers";
import { internal } from "./_generated/api";

// ========== QUERIES ==========

// Get all conversations for a user
export const listConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .collect();

    // Filter conversations where user is a participant
    const userConvs = conversations.filter((c) =>
      c.participantIds.some((id) => id === args.userId)
    );

    // Enrich with participant info and unread count
    const enriched = await Promise.all(
      userConvs.map(async (conv) => {
        const otherUserId = conv.participantIds.find((id) => id !== args.userId);
        const otherUser = otherUserId ? await ctx.db.get(otherUserId) : null;
        const lastSender = await ctx.db.get(conv.lastSenderId);

        // Count unread messages sent to this user
        const unreadMsgs = await ctx.db
          .query("messages")
          .withIndex("by_receiver", (q) => q.eq("receiverId", args.userId))
          .filter((q) => q.eq(q.field("read"), false))
          .collect();

        // Filter to this conversation's messages
        const convUnread = unreadMsgs.filter((m) =>
          conv.participantIds.includes(m.senderId) &&
          (conv.exchangeId ? m.exchangeId === conv.exchangeId : !m.exchangeId || m.senderId === otherUserId)
        );

        return {
          ...conv,
          otherUser: otherUser
            ? { _id: otherUser._id, name: otherUser.name, email: otherUser.email }
            : null,
          lastSenderName: lastSender?.name || "Unknown",
          unreadCount: convUnread.length,
        };
      })
    );

    // Sort by most recent message
    enriched.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    return enriched;
  },
});

// Get messages for a conversation (works with or without exchangeId)
export const listMessages = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return [];

    const [p1, p2] = conversation.participantIds;

    let messages;

    if (conversation.exchangeId) {
      // If conversation is tied to an exchange, query by exchangeId
      messages = await ctx.db
        .query("messages")
        .withIndex("by_exchange", (q) =>
          q.eq("exchangeId", conversation.exchangeId!)
        )
        .order("asc")
        .collect();
    } else {
      // General DM: get messages between the two participants
      const sentByP1 = await ctx.db
        .query("messages")
        .withIndex("by_sender", (q) => q.eq("senderId", p1))
        .filter((q) => q.eq(q.field("receiverId"), p2))
        .collect();

      const sentByP2 = await ctx.db
        .query("messages")
        .withIndex("by_sender", (q) => q.eq("senderId", p2))
        .filter((q) => q.eq(q.field("receiverId"), p1))
        .collect();

      messages = [...sentByP1, ...sentByP2].sort((a, b) => a.createdAt - b.createdAt);
    }

    // Enrich with sender info
    const enriched = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return {
          ...msg,
          senderName: sender?.name || "Unknown",
        };
      })
    );

    return enriched.slice(-(args.limit || 100));
  },
});

// Get messages for an exchange
export const listByExchange = query({
  args: { exchangeId: v.id("exchangeRequests") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_exchange", (q) => q.eq("exchangeId", args.exchangeId))
      .order("asc")
      .collect();

    const enriched = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return {
          ...msg,
          senderName: sender?.name || "Unknown",
        };
      })
    );

    return enriched;
  },
});

// Get unread message count for a user
export const unreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("messages")
      .withIndex("by_receiver", (q) => q.eq("receiverId", args.userId))
      .filter((q) => q.eq(q.field("read"), false))
      .collect();
    return unread.length;
  },
});

// ========== MUTATIONS ==========

// Send a message
export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    receiverId: v.id("users"),
    text: v.string(),
    encrypted: v.optional(v.boolean()),
    attachmentUrl: v.optional(v.string()),
    websiteRef: v.optional(v.id("websites")),
    exchangeId: v.optional(v.id("exchangeRequests")),
    senderId: v.optional(v.id("users")),
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let userId = args.senderId;

    if (!userId && args.token) {
      const fromToken = await getUserIdFromToken(ctx.db, args.token);
      if (fromToken) userId = fromToken;
    }

    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Not authenticated — please login first");

      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();

      if (!user) throw new Error("User not found");
      userId = user._id;
    }

    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const now = Date.now();

    // Insert message
    const messageId = await ctx.db.insert("messages", {
      exchangeId: args.exchangeId,
      senderId: userId,
      receiverId: args.receiverId,
      text: args.text,
      encrypted: args.encrypted || false,
      attachmentUrl: args.attachmentUrl,
      read: false,
      createdAt: now,
    });

    // Update conversation
    await ctx.db.patch(args.conversationId, {
      lastMessage: args.text.slice(0, 100),
      lastMessageAt: now,
      lastSenderId: userId,
    });

    // Create notification
    const notificationBody = args.encrypted
      ? `🔒 Encrypted message from ${user.name}`
      : args.text.slice(0, 150);
    await ctx.db.insert("notifications", {
      userId: args.receiverId,
      type: "new_message",
      title: `New message from ${user.name}`,
      body: notificationBody,
      read: false,
      createdAt: now,
    });

    // Send email notification to receiver
    const receiver = await ctx.db.get(args.receiverId);
    if (receiver && receiver.email) {
      await ctx.scheduler.runAfter(0, internal.email.sendNewMessageEmail, {
        email: receiver.email,
        receiverName: receiver.name,
        senderName: user.name,
        messageText: args.encrypted ? "🔒 Encrypted message" : args.text,
      });
    }

    return messageId;
  },
});

// Create or get conversation between two users
export const getOrCreateConversation = mutation({
  args: {
    otherUserId: v.id("users"),
    exchangeId: v.optional(v.id("exchangeRequests")),
    userId: v.optional(v.id("users")),
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let userId = args.userId;

    if (!userId && args.token) {
      const fromToken = await getUserIdFromToken(ctx.db, args.token);
      if (fromToken) userId = fromToken;
    }

    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Not authenticated — please login first");

      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();

      if (!user) throw new Error("User not found");
      userId = user._id;
    }

    if (!userId) throw new Error("Not authenticated");

    // Check for existing conversation
    const existing = await ctx.db.query("conversations").collect();
    const found = existing.find(
      (c) =>
        c.participantIds.includes(userId!) &&
        c.participantIds.includes(args.otherUserId) &&
        (args.exchangeId ? c.exchangeId === args.exchangeId : true)
    );

    if (found) return found._id;

    // Create new conversation
    const now = Date.now();
    return await ctx.db.insert("conversations", {
      participantIds: [userId!, args.otherUserId],
      lastMessage: "",
      lastMessageAt: now,
      lastSenderId: userId!,
      exchangeId: args.exchangeId,
    });
  },
});

// Mark messages as read
export const markRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    token: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let userId = args.userId || null;

    if (!userId && args.token) {
      userId = await getUserIdFromToken(ctx.db, args.token);
    }

    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (identity) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", identity.email!))
          .first();
        if (user) userId = user._id;
      }
    }

    if (!userId) return; // silently fail if not authenticated

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;

    // Mark all unread messages received by this user in this conversation as read
    const unread = await ctx.db
      .query("messages")
      .withIndex("by_receiver", (q) => q.eq("receiverId", userId!))
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    // Filter to messages in this conversation
    const otherParticipant = conversation.participantIds.find((id) => id !== userId);
    const toMark = unread.filter(
      (m) => m.senderId === otherParticipant &&
             (conversation.exchangeId ? m.exchangeId === conversation.exchangeId : true)
    );

    for (const msg of toMark) {
      await ctx.db.patch(msg._id, { read: true });
    }
  },
});
