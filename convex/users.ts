import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const LEVEL_XP = 100;
const INVITE_QUOTA = [2, 4, 6, 8, 10]; // seviye 1-5+ için kota

function xpToLevel(xp: number) {
  return Math.floor(xp / LEVEL_XP) + 1;
}

function inviteQuota(level: number) {
  if (level >= INVITE_QUOTA.length) return Infinity;
  return INVITE_QUOTA[level - 1] ?? 2;
}

export const getUserByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    return ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();
  },
});

export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    return ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
  },
});

export const getUserProfile = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    if (!user) return null;

    const [followers, following] = await Promise.all([
      ctx.db
        .query("follows")
        .withIndex("by_following", (q) => q.eq("followingId", user._id))
        .collect(),
      ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", user._id))
        .collect(),
    ]);

    return { ...user, followerCount: followers.length, followingCount: following.length };
  },
});

export const updateLocale = mutation({
  args: {
    userId: v.id("users"),
    locale: v.union(v.literal("tr"), v.literal("en")),
  },
  handler: async (ctx, { userId, locale }) => {
    await ctx.db.patch(userId, { locale });
  },
});

export const updateThemeColor = mutation({
  args: {
    userId: v.id("users"),
    themeColor: v.string(),
  },
  handler: async (ctx, { userId, themeColor }) => {
    await ctx.db.patch(userId, { themeColor });
  },
});

export const updateProfileImages = mutation({
  args: {
    userId: v.id("users"),
    profileImageUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
  },
  handler: async (ctx, { userId, profileImageUrl, bannerUrl }) => {
    const patch: { profileImageUrl?: string; bannerUrl?: string } = {};
    if (profileImageUrl !== undefined) patch.profileImageUrl = profileImageUrl;
    if (bannerUrl !== undefined) patch.bannerUrl = bannerUrl;
    await ctx.db.patch(userId, patch);
  },
});

export const spendYaprak = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    action: v.string(),
  },
  handler: async (ctx, { userId, amount, action: _action }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("Kullanıcı bulunamadı.");
    if (user.yaprak < amount) throw new Error("Yetersiz yaprak bakiyesi.");
    await ctx.db.patch(userId, { yaprak: user.yaprak - amount });
  },
});

export const addXpAndYaprak = mutation({
  args: {
    userId: v.id("users"),
    xp: v.number(),
    yaprak: v.number(),
  },
  handler: async (ctx, { userId, xp, yaprak }) => {
    const user = await ctx.db.get(userId);
    if (!user) return;
    const newXp = user.xp + xp;
    const newLevel = xpToLevel(newXp);
    await ctx.db.patch(userId, {
      xp: newXp,
      yaprak: user.yaprak + yaprak,
      level: newLevel,
    });
    return { leveledUp: newLevel > user.level, newLevel };
  },
});

export const getInviteQuotaInfo = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const quota = inviteQuota(user.level);
    const myCodes = await ctx.db
      .query("inviteCodes")
      .filter((q) => q.eq(q.field("creatorId"), userId))
      .collect();
    return { quota, used: myCodes.length, isUnlimited: quota === Infinity };
  },
});
