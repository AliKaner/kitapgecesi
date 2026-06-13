import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { checkAndAwardBadges } from "./badges";

export const donate = mutation({
  args: {
    userId: v.id("users"),
    organizationName: v.string(),
    yaprakAmount: v.number(),
  },
  handler: async (ctx, { userId, organizationName, yaprakAmount }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("Kullanıcı bulunamadı.");
    if (user.yaprak < yaprakAmount)
      throw new Error("Yetersiz yaprak bakiyesi.");

    await ctx.db.patch(userId, { yaprak: user.yaprak - yaprakAmount });
    await ctx.db.insert("donations", {
      userId,
      organizationName,
      yaprakSpent: yaprakAmount,
      createdAt: Date.now(),
    });

    await checkAndAwardBadges(ctx, userId);
  },
});

export const getDonationHistory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("donations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getTotalDonated = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const all = await ctx.db
      .query("donations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return all.reduce((sum, d) => sum + d.yaprakSpent, 0);
  },
});
