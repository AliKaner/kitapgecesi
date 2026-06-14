import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const TARGET_TYPE = v.union(v.literal("book"), v.literal("author"));

export const getLikeInfo = query({
  args: {
    targetType: TARGET_TYPE,
    targetId: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, { targetType, targetId, userId }) => {
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_target", (q) => q.eq("targetType", targetType).eq("targetId", targetId))
      .collect();

    return {
      count: likes.length,
      likedByMe: userId ? likes.some((l) => l.userId === userId) : false,
    };
  },
});

export const toggleLike = mutation({
  args: {
    userId: v.id("users"),
    targetType: TARGET_TYPE,
    targetId: v.string(),
  },
  handler: async (ctx, { userId, targetType, targetId }) => {
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_user_target", (q) => q.eq("userId", userId).eq("targetType", targetType).eq("targetId", targetId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { liked: false };
    }

    await ctx.db.insert("likes", { userId, targetType, targetId, createdAt: Date.now() });
    return { liked: true };
  },
});
