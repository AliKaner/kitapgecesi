import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // KULLANICI
  users: defineTable({
    name: v.string(),
    username: v.string(),
    email: v.string(),
    profileImageUrl: v.string(),
    bannerUrl: v.optional(v.string()),
    externalId: v.string(),
    xp: v.number(),
    yaprak: v.number(),
    level: v.number(),
    trustScore: v.number(),
    invitedById: v.optional(v.id("users")),
    passwordHash: v.string(),
    passwordSalt: v.string(),
    bio: v.optional(v.string()),
    themeColor: v.optional(v.string()),
    locale: v.optional(v.union(v.literal("tr"), v.literal("en"))),
    readingGoal: v.optional(v.number()),
    roleBadges: v.optional(
      v.array(v.union(v.literal("founder"), v.literal("vip"), v.literal("admin"), v.literal("yazar")))
    ),
    createdAt: v.number(),
  })
    .index("by_username", ["username"])
    .index("by_externalId", ["externalId"]),

  // OTURUMLAR
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  // YAZARLAR
  authors: defineTable({
    name: v.string(),
    bio: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    viewCount: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_name", ["name"]),

  // KİTAP KATALOĞU
  books: defineTable({
    title: v.string(),
    author: v.string(),
    authorId: v.optional(v.id("authors")),
    genres: v.optional(v.array(v.string())),
    totalPages: v.number(),
    coverUrl: v.string(),
    isbn: v.optional(v.string()),
    isVerified: v.boolean(),
    externalId: v.optional(v.string()),
    viewCount: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_isbn", ["isbn"])
    .index("by_externalId", ["externalId"])
    .index("by_authorId", ["authorId"]),

  // DEĞERLENDİRMELER
  ratings: defineTable({
    userId: v.id("users"),
    targetType: v.union(v.literal("book"), v.literal("author")),
    targetId: v.string(),
    value: v.number(),
    createdAt: v.number(),
  })
    .index("by_user_target", ["userId", "targetType", "targetId"])
    .index("by_target", ["targetType", "targetId"]),

  // KİŞİSEL KİTAPLIK
  userBooks: defineTable({
    userId: v.id("users"),
    bookId: v.id("books"),
    status: v.union(v.literal("want"), v.literal("reading"), v.literal("read")),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_book", ["userId", "bookId"])
    .index("by_user_status", ["userId", "status"]),

  // GÜNLÜK
  journalEntries: defineTable({
    userId: v.id("users"),
    bookId: v.optional(v.id("books")),
    content: v.string(),
    pagesRead: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // ROZETLER
  userBadges: defineTable({
    userId: v.id("users"),
    badgeKey: v.string(),
    earnedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_badge", ["userId", "badgeKey"]),

  // GÖNDERİLER
  posts: defineTable({
    authorId: v.id("users"),
    type: v.union(
      v.literal("okuma"),
      v.literal("alinti"),
      v.literal("direkt"),
      v.literal("kitap_alma"),
      v.literal("repost"),
      v.literal("club_davet")
    ),
    content: v.optional(v.string()),
    mediaUrls: v.optional(v.array(v.string())),
    bookIds: v.optional(v.array(v.id("books"))),
    pageNumber: v.optional(v.number()),
    repostId: v.optional(v.id("posts")),
    clubId: v.optional(v.id("clubs")),
    isSilent: v.boolean(),
    viewCount: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_club", ["clubId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_repostId", ["repostId"]),

  // YORUMLAR
  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_post", ["postId"]),

  // BEĞENİLER
  likes: defineTable({
    userId: v.id("users"),
    targetType: v.union(
      v.literal("post"),
      v.literal("comment"),
      v.literal("list"),
      v.literal("book"),
      v.literal("author")
    ),
    targetId: v.string(),
    createdAt: v.number(),
  })
    .index("by_user_target", ["userId", "targetType", "targetId"])
    .index("by_target", ["targetType", "targetId"]),

  // TAKİP
  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_follower_following", ["followerId", "followingId"]),

  // PROFİL VİTRİN
  showcases: defineTable({
    userId: v.id("users"),
    widgetType: v.union(
      v.literal("target"),
      v.literal("time"),
      v.literal("bookshelf"),
      v.literal("favorites"),
      v.literal("author"),
      v.literal("quote"),
      v.literal("list")
    ),
    order: v.number(),
    isEnabled: v.boolean(),
    config: v.string(),
  }).index("by_user", ["userId"]),

  // KİTAP KULÜPLERİ
  clubs: defineTable({
    name: v.string(),
    description: v.string(),
    avatarUrl: v.optional(v.string()),
    bannerUrl: v.string(),
    leaderId: v.id("users"),
    privacyMode: v.union(
      v.literal("public"),
      v.literal("restricted"),
      v.literal("private")
    ),
    activeBookId: v.optional(v.id("books")),
    createdAt: v.number(),
  }),

  clubMembers: defineTable({
    clubId: v.id("clubs"),
    userId: v.id("users"),
    role: v.union(
      v.literal("leader"),
      v.literal("moderator"),
      v.literal("member")
    ),
    status: v.union(
      v.literal("active"),
      v.literal("pending")
    ),
    joinedAt: v.number(),
  })
    .index("by_club", ["clubId"])
    .index("by_user", ["userId"])
    .index("by_club_user", ["clubId", "userId"]),

  clubArchive: defineTable({
    clubId: v.id("clubs"),
    bookId: v.id("books"),
    startedAt: v.number(),
    finishedAt: v.number(),
  }).index("by_club", ["clubId"]),

  // LİSTELER
  lists: defineTable({
    title: v.string(),
    description: v.string(),
    creatorId: v.id("users"),
    isPrivate: v.boolean(),
    isRanked: v.boolean(),
    clonedFromListId: v.optional(v.id("lists")),
    collaborators: v.array(v.id("users")),
    createdAt: v.number(),
  }).index("by_creator", ["creatorId"]),

  listBooks: defineTable({
    listId: v.id("lists"),
    bookId: v.id("books"),
    order: v.number(),
  })
    .index("by_list", ["listId"])
    .index("by_list_book", ["listId", "bookId"]),

  // YORUM (LİSTE)
  listComments: defineTable({
    listId: v.id("lists"),
    authorId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_list", ["listId"]),

  // DAVETİYELER
  inviteCodes: defineTable({
    code: v.string(),
    creatorId: v.optional(v.id("users")),
    isInfinite: v.boolean(),
    usedCount: v.number(),
    maxUses: v.number(),
    isRevoked: v.boolean(),
    createdAt: v.number(),
  }).index("by_code", ["code"]),

  // BİLDİRİMLER
  notifications: defineTable({
    userId: v.id("users"),
    senderId: v.id("users"),
    type: v.union(
      v.literal("like"),
      v.literal("reply"),
      v.literal("repost"),
      v.literal("follow"),
      v.literal("club_invite"),
      v.literal("level_up"),
      v.literal("badge")
    ),
    targetPostId: v.optional(v.id("posts")),
    targetClubId: v.optional(v.id("clubs")),
    badgeKey: v.optional(v.string()),
    isRead: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // BAĞIŞ GEÇMİŞİ
  donations: defineTable({
    userId: v.id("users"),
    organizationName: v.string(),
    yaprakSpent: v.number(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
