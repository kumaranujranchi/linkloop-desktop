import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ========== USERS ==========
  users: defineTable({
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    company: v.optional(v.string()),
    role: v.union(v.literal("free"), v.literal("pro"), v.literal("agency"), v.literal("admin")),
    reputationScore: v.number(),       // 0-100
    completedExchanges: v.number(),
    responseRate: v.number(),          // percentage
    trustBadges: v.array(v.string()),
    publicKey: v.optional(v.string()), // ECDH public key JWK for E2E encryption
    createdAt: v.number(),             // timestamp
    passwordHash: v.optional(v.string()),
    passwordSalt: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // ========== WEBSITES ==========
  websites: defineTable({
    ownerId: v.id("users"),
    domain: v.string(),
    logoUrl: v.optional(v.string()),
    niche: v.string(),
    country: v.string(),
    language: v.string(),
    domainAuthority: v.number(),       // DA score
    spamScore: v.number(),             // 0-100%
    trafficEstimate: v.number(),       // monthly
    referringDomains: v.number(),
    dofollowLinks: v.number(),
    nofollowLinks: v.number(),
    exchangeSuccessRate: v.number(),   // percentage
    verified: v.boolean(),
    verificationCode: v.optional(v.string()),  // unique code for DNS/meta-tag ownership verification
    verificationMethod: v.optional(v.union(v.literal("dns"), v.literal("metatag"))),
    status: v.union(v.literal("active"), v.literal("pending"), v.literal("rejected"), v.literal("suspended")),
    metricsUpdatedAt: v.number(),      // timestamp: when Moz/Ahrefs API refreshed
    lastCheckedAt: v.number(),         // timestamp: when LinkBuild verified backlinks
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_domain", ["domain"])
    .index("by_da", ["domainAuthority"])
    .index("by_niche", ["niche"])
    .index("by_status", ["status"]),

  // ========== EXCHANGE REQUESTS ==========
  exchangeRequests: defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    fromWebsiteId: v.id("websites"),
    toWebsiteId: v.id("websites"),
    fromAnchorText: v.string(),
    toAnchorText: v.optional(v.string()),
    fromTargetUrl: v.string(),
    toTargetUrl: v.optional(v.string()),
    status: v.union(
      v.literal("new"),
      v.literal("negotiating"),
      v.literal("accepted"),
      v.literal("completed"),
      v.literal("rejected")
    ),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_from_user", ["fromUserId"])
    .index("by_to_user", ["toUserId"])
    .index("by_status", ["status"])
    .index("by_from_website", ["fromWebsiteId"]),

  // ========== MESSAGES ==========
  messages: defineTable({
    exchangeId: v.optional(v.id("exchangeRequests")),
    senderId: v.id("users"),
    receiverId: v.id("users"),
    text: v.string(),
    encrypted: v.optional(v.boolean()), // Whether the message is E2E encrypted
    attachmentUrl: v.optional(v.string()),
    websiteRef: v.optional(v.id("websites")),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_exchange", ["exchangeId"])
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"]),

  // ========== CONVERSATIONS (denormalized for list view) ==========
  conversations: defineTable({
    participantIds: v.array(v.id("users")),
    lastMessage: v.string(),
    lastMessageAt: v.number(),
    lastSenderId: v.id("users"),
    exchangeId: v.optional(v.id("exchangeRequests")),
  })
    .index("by_participant", ["participantIds"]),

  // ========== BACKLINKS ==========
  backlinks: defineTable({
    sourceUrl: v.string(),
    targetUrl: v.string(),
    anchorText: v.string(),
    linkType: v.union(v.literal("dofollow"), v.literal("nofollow")),
    websiteId: v.id("websites"),
    exchangeId: v.optional(v.id("exchangeRequests")),
    status: v.union(v.literal("healthy"), v.literal("needs_review"), v.literal("removed")),
    healthScore: v.number(),           // 0-100
    lastCheckedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_website", ["websiteId"])
    .index("by_status", ["status"])
    .index("by_exchange", ["exchangeId"]),

  // ========== NOTIFICATIONS ==========
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("exchange_request"),
      v.literal("exchange_accepted"),
      v.literal("exchange_completed"),
      v.literal("exchange_rejected"),
      v.literal("new_message"),
      v.literal("backlink_health"),
      v.literal("link_removed"),
      v.literal("reputation_change"),
      v.literal("account_activity")
    ),
    title: v.string(),
    body: v.string(),
    read: v.boolean(),
    linkId: v.optional(v.id("exchangeRequests")),
    websiteId: v.optional(v.id("websites")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"]),

  // ========== REVIEWS ==========
  reviews: defineTable({
    websiteId: v.id("websites"),
    reviewerId: v.id("users"),
    rating: v.number(),                // 1-5
    comment: v.string(),
    createdAt: v.number(),
  })
    .index("by_website", ["websiteId"]),

  // ========== SUBSCRIPTIONS ==========
  subscriptions: defineTable({
    userId: v.id("users"),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("agency")),
    status: v.union(v.literal("active"), v.literal("canceled"), v.literal("past_due")),
    websitesLimit: v.number(),
    exchangesLimit: v.number(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // ========== ANALYTICS EVENTS (for charts) ==========
  analyticsEvents: defineTable({
    type: v.union(
      v.literal("exchange_created"),
      v.literal("exchange_completed"),
      v.literal("backlink_verified"),
      v.literal("backlink_lost"),
      v.literal("user_signup"),
      v.literal("website_added")
    ),
    userId: v.optional(v.id("users")),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_type_date", ["type", "createdAt"]),

  // ========== SESSIONS ==========
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  // ========== FEEDBACK & FEATURES ==========
  feedbacks: defineTable({
    name: v.string(),
    email: v.string(),
    note: v.string(),
    status: v.union(v.literal("new"), v.literal("reviewed")),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_email", ["email"]),
});
