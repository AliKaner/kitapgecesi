import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { checkAndAwardBadges } from "./badges";

async function enrichPost(ctx: QueryCtx, post: Doc<"posts">) {
  const author = await ctx.db.get(post.authorId);
  const books = post.bookIds
    ? await Promise.all(post.bookIds.map((id) => ctx.db.get(id)))
    : [];
  const likeCount = await ctx.db
    .query("likes")
    .withIndex("by_target", (q) => q.eq("targetType", "post").eq("targetId", post._id))
    .collect()
    .then((r) => r.length);
  const commentCount = await ctx.db
    .query("comments")
    .withIndex("by_post", (q) => q.eq("postId", post._id))
    .collect()
    .then((r) => r.length);
  const repostCount = await ctx.db
    .query("posts")
    .withIndex("by_repostId", (q) => q.eq("repostId", post._id))
    .collect()
    .then((r) => r.length);

  const repostedPost = post.repostId
    ? await (async (repostId: Id<"posts">) => {
        const original = await ctx.db.get(repostId);
        if (!original) return null;
        const originalAuthor = await ctx.db.get(original.authorId);
        const originalBooks = original.bookIds
          ? await Promise.all(original.bookIds.map((id) => ctx.db.get(id)))
          : [];
        return {
          ...original,
          author: originalAuthor,
          books: originalBooks.filter(Boolean),
        };
      })(post.repostId)
    : null;

  return {
    ...post,
    author,
    books: books.filter(Boolean),
    likeCount,
    commentCount,
    repostCount,
    repostedPost,
  };
}

const POST_XP = 10;
const POST_YAPRAK = 5;
const DAILY_POST_LIMIT = 3;
const DAILY_LIKE_XP_LIMIT = 50;

export const getFeed = query({
  args: {
    limit: v.number(),
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { limit, cursor: _cursor }) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_createdAt")
      .filter((q) => q.eq(q.field("isSilent"), false))
      .order("desc")
      .take(limit);

    return Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        const books = post.bookIds
          ? await Promise.all(post.bookIds.map((id) => ctx.db.get(id)))
          : [];
        const likeCount = await ctx.db
          .query("likes")
          .withIndex("by_target", (q) =>
            q.eq("targetType", "post").eq("targetId", post._id)
          )
          .collect()
          .then((r) => r.length);
        const commentCount = await ctx.db
          .query("comments")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect()
          .then((r) => r.length);

        const repostedPost = post.repostId
          ? await (async (repostId: Id<"posts">) => {
              const original = await ctx.db.get(repostId);
              if (!original) return null;
              const originalAuthor = await ctx.db.get(original.authorId);
              const originalBooks = original.bookIds
                ? await Promise.all(original.bookIds.map((id) => ctx.db.get(id)))
                : [];
              return {
                ...original,
                author: originalAuthor,
                books: originalBooks.filter(Boolean),
              };
            })(post.repostId)
          : null;

        const repostCount = await ctx.db
          .query("posts")
          .withIndex("by_repostId", (q) => q.eq("repostId", post._id))
          .collect()
          .then((r) => r.length);

        return {
          ...post,
          author,
          books: books.filter(Boolean),
          likeCount,
          commentCount,
          repostCount,
          repostedPost,
        };
      })
    );
  },
});

export const getUserPosts = query({
  args: { authorId: v.id("users"), limit: v.number() },
  handler: async (ctx, { authorId, limit }) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", authorId))
      .filter((q) => q.eq(q.field("isSilent"), false))
      .order("desc")
      .take(limit);

    return Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        const books = post.bookIds
          ? await Promise.all(post.bookIds.map((id) => ctx.db.get(id)))
          : [];
        const likeCount = await ctx.db
          .query("likes")
          .withIndex("by_target", (q) =>
            q.eq("targetType", "post").eq("targetId", post._id)
          )
          .collect()
          .then((r) => r.length);
        const commentCount = await ctx.db
          .query("comments")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect()
          .then((r) => r.length);
        const repostCount = await ctx.db
          .query("posts")
          .withIndex("by_repostId", (q) => q.eq("repostId", post._id))
          .collect()
          .then((r) => r.length);

        const repostedPost = post.repostId
          ? await (async (repostId: Id<"posts">) => {
              const original = await ctx.db.get(repostId);
              if (!original) return null;
              const originalAuthor = await ctx.db.get(original.authorId);
              const originalBooks = original.bookIds
                ? await Promise.all(original.bookIds.map((id) => ctx.db.get(id)))
                : [];
              return {
                ...original,
                author: originalAuthor,
                books: originalBooks.filter(Boolean),
              };
            })(post.repostId)
          : null;

        return {
          ...post,
          author,
          books: books.filter(Boolean),
          likeCount,
          commentCount,
          repostCount,
          repostedPost,
        };
      })
    );
  },
});

export const getPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId);
    if (!post) return null;
    return enrichPost(ctx, post);
  },
});

export const getClubFeed = query({
  args: { clubId: v.id("clubs"), limit: v.number() },
  handler: async (ctx, { clubId, limit }) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_club", (q) => q.eq("clubId", clubId))
      .order("desc")
      .take(limit);

    return Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        const books = post.bookIds
          ? await Promise.all(post.bookIds.map((id) => ctx.db.get(id)))
          : [];
        const likeCount = await ctx.db
          .query("likes")
          .withIndex("by_target", (q) =>
            q.eq("targetType", "post").eq("targetId", post._id)
          )
          .collect()
          .then((r) => r.length);
        const commentCount = await ctx.db
          .query("comments")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect()
          .then((r) => r.length);
        const repostCount = await ctx.db
          .query("posts")
          .withIndex("by_repostId", (q) => q.eq("repostId", post._id))
          .collect()
          .then((r) => r.length);

        const repostedPost = post.repostId
          ? await (async (repostId: Id<"posts">) => {
              const original = await ctx.db.get(repostId);
              if (!original) return null;
              const originalAuthor = await ctx.db.get(original.authorId);
              const originalBooks = original.bookIds
                ? await Promise.all(original.bookIds.map((id) => ctx.db.get(id)))
                : [];
              return {
                ...original,
                author: originalAuthor,
                books: originalBooks.filter(Boolean),
              };
            })(post.repostId)
          : null;

        return {
          ...post,
          author,
          books: books.filter(Boolean),
          likeCount,
          commentCount,
          repostCount,
          repostedPost,
        };
      })
    );
  },
});

export const createPost = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const postId = await ctx.db.insert("posts", {
      ...args,
      createdAt: Date.now(),
    });

    if (!args.isSilent) {
      const dayStart = Date.now() - 24 * 60 * 60 * 1000;
      const todayPosts = await ctx.db
        .query("posts")
        .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
        .filter((q) =>
          q.and(
            q.eq(q.field("isSilent"), false),
            q.gte(q.field("createdAt"), dayStart)
          )
        )
        .collect();

      if (todayPosts.length <= DAILY_POST_LIMIT) {
        const user = await ctx.db.get(args.authorId);
        if (user) {
          const newXp = user.xp + POST_XP;
          const newLevel = Math.floor(newXp / 100) + 1;
          const leveledUp = newLevel > user.level;
          await ctx.db.patch(args.authorId, {
            xp: newXp,
            yaprak: user.yaprak + POST_YAPRAK,
            level: newLevel,
          });

          if (leveledUp) {
            await ctx.db.insert("notifications", {
              userId: args.authorId,
              senderId: args.authorId,
              type: "level_up",
              isRead: false,
              createdAt: Date.now(),
            });
          }
        }
      }
    }

    if (!args.isSilent) {
      await checkAndAwardBadges(ctx, args.authorId);
    }

    return postId;
  },
});

export const likeTarget = mutation({
  args: {
    userId: v.id("users"),
    targetType: v.union(
      v.literal("post"),
      v.literal("comment"),
      v.literal("list")
    ),
    targetId: v.string(),
  },
  handler: async (ctx, { userId, targetType, targetId }) => {
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_user_target", (q) =>
        q
          .eq("userId", userId)
          .eq("targetType", targetType)
          .eq("targetId", targetId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { liked: false };
    }

    await ctx.db.insert("likes", {
      userId,
      targetType,
      targetId,
      createdAt: Date.now(),
    });

    // Post beğenisi ise post sahibine XP ver
    if (targetType === "post") {
      const post = await ctx.db.get(targetId as Id<"posts">);
      if (post && post.authorId !== userId) {
        const dayStart = Date.now() - 24 * 60 * 60 * 1000;
        const todayLikeXp = await ctx.db
          .query("likes")
          .withIndex("by_target", (q) =>
            q.eq("targetType", "post").eq("targetId", post.authorId)
          )
          .filter((q) => q.gte(q.field("createdAt"), dayStart))
          .collect()
          .then((r) => r.length);

        if (todayLikeXp < DAILY_LIKE_XP_LIMIT) {
          const author = await ctx.db.get(post.authorId);
          if (author) {
            const newXp = author.xp + 1;
            const newLevel = Math.floor(newXp / 100) + 1;
            await ctx.db.patch(post.authorId, { xp: newXp, level: newLevel });
          }
        }

        await ctx.db.insert("notifications", {
          userId: post.authorId,
          senderId: userId,
          type: "like",
          targetPostId: post._id,
          isRead: false,
          createdAt: Date.now(),
        });

        await checkAndAwardBadges(ctx, post.authorId);
      }
    }

    return { liked: true };
  },
});

export const addComment = mutation({
  args: {
    postId: v.id("posts"),
    authorId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const commentId = await ctx.db.insert("comments", {
      ...args,
      createdAt: Date.now(),
    });

    const post = await ctx.db.get(args.postId);
    if (post && post.authorId !== args.authorId) {
      await ctx.db.insert("notifications", {
        userId: post.authorId,
        senderId: args.authorId,
        type: "reply",
        targetPostId: args.postId,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return commentId;
  },
});

export const getComments = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .order("asc")
      .collect();

    return Promise.all(
      comments.map(async (c) => {
        const author = await ctx.db.get(c.authorId);
        return { ...c, author };
      })
    );
  },
});

export const deletePost = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("posts"),
  },
  handler: async (ctx, { userId, postId }) => {
    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Gönderi bulunamadı.");
    if (post.authorId !== userId) throw new Error("Bu gönderiyi silme yetkiniz yok.");

    // Cascade: yorumlar
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .collect();
    await Promise.all(comments.map((c) => ctx.db.delete(c._id)));

    // Cascade: beğeniler
    const postLikes = await ctx.db
      .query("likes")
      .withIndex("by_target", (q) =>
        q.eq("targetType", "post").eq("targetId", postId)
      )
      .collect();
    await Promise.all(postLikes.map((l) => ctx.db.delete(l._id)));

    await ctx.db.delete(postId);
  },
});

export const createRepost = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("posts"),
    content: v.optional(v.string()),
  },
  handler: async (ctx, { userId, postId, content }) => {
    const existing = await ctx.db
      .query("posts")
      .withIndex("by_repostId", (q) => q.eq("repostId", postId))
      .filter((q) => q.eq(q.field("authorId"), userId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { reposted: false };
    }

    const target = await ctx.db.get(postId);
    if (target?.type === "repost") {
      throw new Error("Bir repostu yeniden paylaşamazsınız.");
    }

    const repostId = await ctx.db.insert("posts", {
      authorId: userId,
      type: "repost",
      content,
      repostId: postId,
      isSilent: false,
      createdAt: Date.now(),
    });

    const original = await ctx.db.get(postId);
    if (original && original.authorId !== userId) {
      await ctx.db.insert("notifications", {
        userId: original.authorId,
        senderId: userId,
        type: "repost",
        targetPostId: postId,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return { reposted: true, repostId };
  },
});

export const updatePost = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, { postId, userId, content }) => {
    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Gönderi bulunamadı.");
    if (post.authorId !== userId) throw new Error("Bu gönderiyi düzenleme yetkiniz yok.");
    await ctx.db.patch(postId, { content });
  },
});

export const recordView = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId);
    if (!post) return;
    await ctx.db.patch(postId, { viewCount: (post.viewCount ?? 0) + 1 });
  },
});

export const getIsReposted = query({
  args: { userId: v.id("users"), postId: v.id("posts") },
  handler: async (ctx, { userId, postId }) => {
    const existing = await ctx.db
      .query("posts")
      .withIndex("by_repostId", (q) => q.eq("repostId", postId))
      .filter((q) => q.eq(q.field("authorId"), userId))
      .unique();
    return !!existing;
  },
});

export const getIsLiked = query({
  args: {
    userId: v.id("users"),
    targetType: v.union(
      v.literal("post"),
      v.literal("comment"),
      v.literal("list")
    ),
    targetId: v.string(),
  },
  handler: async (ctx, { userId, targetType, targetId }) => {
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_user_target", (q) =>
        q
          .eq("userId", userId)
          .eq("targetType", targetType)
          .eq("targetId", targetId)
      )
      .unique();
    return !!existing;
  },
});
