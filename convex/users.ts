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

export const setReadingGoal = mutation({
  args: {
    userId: v.id("users"),
    readingGoal: v.optional(v.number()),
  },
  handler: async (ctx, { userId, readingGoal }) => {
    await ctx.db.patch(userId, { readingGoal });
  },
});

export const getReadingGoalStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user || !user.readingGoal) return null;

    const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();

    const userBooks = await ctx.db
      .query("userBooks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const done = userBooks.filter((b) => b.status === "read" && (b.finishedAt ?? 0) >= yearStart).length;

    const journalEntries = await ctx.db
      .query("journalEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const pages = journalEntries
      .filter((e) => e.createdAt >= yearStart)
      .reduce((sum, e) => sum + (e.pagesRead ?? 0), 0);

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .collect();
    const yearPosts = posts.filter((p) => p.createdAt >= yearStart);
    const reviews = yearPosts.filter((p) => p.type === "okuma").length;
    const quotes = yearPosts.filter((p) => p.type === "alinti").length;

    const target = user.readingGoal;
    const pct = Math.min(100, Math.round((done / target) * 100));

    return {
      target,
      done,
      pages,
      reviews,
      quotes,
      pct,
      year: new Date().getFullYear(),
    };
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
