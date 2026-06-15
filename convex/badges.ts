import { query } from "./_generated/server";
import { v } from "convex/values";
import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { BADGE_DEFS } from "../src/lib/badges";

export { BADGE_DEFS };

export async function checkAndAwardBadges(ctx: MutationCtx, userId: Id<"users">) {
  const earned = await ctx.db
    .query("userBadges")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  const earnedKeys = new Set(earned.map((e) => e.badgeKey));

  const userPosts = await ctx.db
    .query("posts")
    .withIndex("by_author", (q) => q.eq("authorId", userId))
    .filter((q) => q.eq(q.field("isSilent"), false))
    .collect();

  let likesReceived = 0;
  for (const p of userPosts) {
    likesReceived += await ctx.db
      .query("likes")
      .withIndex("by_target", (q) => q.eq("targetType", "post").eq("targetId", p._id))
      .collect()
      .then((r) => r.length);
  }

  const donationCount = await ctx.db
    .query("donations")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect()
    .then((r) => r.length);

  const booksRead = await ctx.db
    .query("userBooks")
    .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "read"))
    .collect()
    .then((r) => r.length);

  const followerCount = await ctx.db
    .query("follows")
    .withIndex("by_following", (q) => q.eq("followingId", userId))
    .collect()
    .then((r) => r.length);

  const followingCount = await ctx.db
    .query("follows")
    .withIndex("by_follower", (q) => q.eq("followerId", userId))
    .collect()
    .then((r) => r.length);

  const listCount = await ctx.db
    .query("lists")
    .withIndex("by_creator", (q) => q.eq("creatorId", userId))
    .collect()
    .then((r) => r.length);

  const journalCount = await ctx.db
    .query("journalEntries")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect()
    .then((r) => r.length);

  const clubCount = await ctx.db
    .query("clubMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect()
    .then((r) => r.length);

  const metrics: Record<string, number> = {
    posts: userPosts.length,
    likes: likesReceived,
    books: booksRead,
    followers: followerCount,
    following: followingCount,
    donations: donationCount,
    lists: listCount,
    journal: journalCount,
    clubs: clubCount,
  };

  for (const def of BADGE_DEFS) {
    if (earnedKeys.has(def.key)) continue;
    if ((metrics[def.metric] ?? 0) >= def.threshold) {
      await ctx.db.insert("userBadges", { userId, badgeKey: def.key, earnedAt: Date.now() });
      await ctx.db.insert("notifications", {
        userId,
        senderId: userId,
        type: "badge",
        badgeKey: def.key,
        isRead: false,
        createdAt: Date.now(),
      });
    }
  }
}

export const getUserBadges = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const earned = await ctx.db
      .query("userBadges")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const earnedMap = new Map(earned.map((e) => [e.badgeKey, e]));

    return BADGE_DEFS.map((def) => ({
      ...def,
      earned: earnedMap.has(def.key),
      earnedAt: earnedMap.get(def.key)?.earnedAt ?? null,
    }));
  },
});
