import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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

    // Enrich with participant info
    const enriched = await Promise.all(
      userConvs.map(async (conv) => {
        const otherUserId = conv.participantIds.find((id) => id !== args.userId);
        const otherUser = otherUserId ? await ctx.db.get(otherUserId) : null;
        const lastSender = await ctx.db.get(conv.lastSenderId);
        return {
          ...conv,
          otherUser: otherUser
            ? { _id: otherUser._id, name: otherUser.name, email: otherUser.email }
            : null,
          lastSenderName: lastSender?.name || "Unknown",
        };
      })
    );

    // Sort by most recent message
    enriched.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    return enriched;
  },
});

// Get messages for a conversation
export const listMessages = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return [];

    // Get all messages between the two participants
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_exchange", (q) =>
        q.eq("exchangeId", conversation.exchangeId!)
      )
      .order("asc")
      .collect();

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

    return enriched.slice(-(args.limit || 50));
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

// ========== MUTATIONS ==========

// Send a message
export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    receiverId: v.id("users"),
    text: v.string(),
    attachmentUrl: v.optional(v.string()),
    websiteRef: v.optional(v.id("websites")),
    exchangeId: v.optional(v.id("exchangeRequests")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    const now = Date.now();

    // Insert message
    const messageId = await ctx.db.insert("messages", {
      exchangeId: args.exchangeId,
      senderId: user._id,
      receiverId: args.receiverId,
      text: args.text,
      attachmentUrl: args.attachmentUrl,
      websiteRef: args.websiteRef,
      read: false,
      createdAt: now,
    });

    // Update conversation
    await ctx.db.patch(args.conversationId, {
      lastMessage: args.text.slice(0, 100),
      lastMessageAt: now,
      lastSenderId: user._id,
    });

    // Create notification
    await ctx.db.insert("notifications", {
      userId: args.receiverId,
      type: "new_message",
      title: `New message from ${user.name}`,
      body: args.text.slice(0, 150),
      read: false,
      createdAt: now,
    });

    return messageId;
  },
});

// Create or get conversation between two users
export const getOrCreateConversation = mutation({
  args: {
    otherUserId: v.id("users"),
    exchangeId: v.optional(v.id("exchangeRequests")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    // Check for existing conversation
    const existing = await ctx.db.query("conversations").collect();
    const found = existing.find(
      (c) =>
        c.participantIds.includes(user._id) &&
        c.participantIds.includes(args.otherUserId) &&
        c.exchangeId === args.exchangeId
    );

    if (found) return found._id;

    // Create new conversation
    const now = Date.now();
    return await ctx.db.insert("conversations", {
      participantIds: [user._id, args.otherUserId],
      lastMessage: "",
      lastMessageAt: now,
      lastSenderId: user._id,
      exchangeId: args.exchangeId,
    });
  },
});

// Mark messages as read
export const markRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;

    // Mark all messages from other participant as read
    const otherParticipant = conversation.participantIds.find(
      (id) => id !== user._id
    );
    if (!otherParticipant) return;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_sender", (q) => q.eq("senderId", otherParticipant))
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    for (const msg of messages) {
      await ctx.db.patch(msg._id, { read: true });
    }
  },
});
