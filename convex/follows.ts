import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const toggleFollow = mutation({
  args: {
    followerId: v.id("users"),
    followingId: v.id("users"),
  },
  handler: async (ctx, { followerId, followingId }) => {
    if (followerId === followingId) throw new Error("Kendinizi takip edemezsiniz.");

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", followerId).eq("followingId", followingId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { following: false };
    }

    await ctx.db.insert("follows", {
      followerId,
      followingId,
      createdAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId: followingId,
      senderId: followerId,
      type: "follow",
      isRead: false,
      createdAt: Date.now(),
    });

    return { following: true };
  },
});

export const isFollowing = query({
  args: {
    followerId: v.id("users"),
    followingId: v.id("users"),
  },
  handler: async (ctx, { followerId, followingId }) => {
    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", followerId).eq("followingId", followingId)
      )
      .unique();
    return !!existing;
  },
});

export const getFollowers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", userId))
      .collect();
    return Promise.all(
      follows.map(async (f) => {
        const user = await ctx.db.get(f.followerId);
        return { ...f, user };
      })
    );
  },
});

export const getFollowing = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .collect();
    return Promise.all(
      follows.map(async (f) => {
        const user = await ctx.db.get(f.followingId);
        return { ...f, user };
      })
    );
  },
});
