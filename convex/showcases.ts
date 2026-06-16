import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getUserShowcases = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("showcases")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isEnabled"), true))
      .collect()
      .then((rows) => rows.sort((a, b) => a.order - b.order));
  },
});

export const getAllShowcases = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("showcases")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()
      .then((rows) => rows.sort((a, b) => a.order - b.order));
  },
});

export const ensureDefaultShowcases = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const existing = await ctx.db
      .query("showcases")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const existingTypes = new Set(existing.map((s) => s.widgetType));
    let nextOrder = existing.reduce((max, s) => Math.max(max, s.order), -1) + 1;

    const defaults = ["favorites", "author"] as const;
    for (const widgetType of defaults) {
      if (existingTypes.has(widgetType)) continue;
      await ctx.db.insert("showcases", {
        userId,
        widgetType,
        order: nextOrder++,
        isEnabled: true,
        config: "{}",
      });
    }
  },
});

const MAX_SHOWCASES = 12;

export const addShowcase = mutation({
  args: {
    userId: v.id("users"),
    widgetType: v.union(
      v.literal("idCard"),
      v.literal("favorites"),
      v.literal("quote"),
      v.literal("review"),
      v.literal("list"),
      v.literal("favoriteClub"),
      v.literal("target"),
      v.literal("author")
    ),
  },
  handler: async (ctx, { userId, widgetType }) => {
    const existing = await ctx.db
      .query("showcases")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (existing.length >= MAX_SHOWCASES) throw new Error("En fazla bileşen sayısına ulaştınız.");
    const nextOrder = existing.reduce((max, s) => Math.max(max, s.order), -1) + 1;
    return ctx.db.insert("showcases", {
      userId,
      widgetType,
      order: nextOrder,
      isEnabled: true,
      config: "{}",
    });
  },
});

export const removeShowcase = mutation({
  args: { userId: v.id("users"), showcaseId: v.id("showcases") },
  handler: async (ctx, { userId, showcaseId }) => {
    const showcase = await ctx.db.get(showcaseId);
    if (!showcase || showcase.userId !== userId) return;
    await ctx.db.delete(showcaseId);
  },
});

export const updateShowcaseLayout = mutation({
  args: {
    userId: v.id("users"),
    layouts: v.array(
      v.object({
        id: v.id("showcases"),
        order: v.number(),
        isEnabled: v.boolean(),
        config: v.string(),
      })
    ),
  },
  handler: async (ctx, { userId, layouts }) => {
    for (const layout of layouts) {
      const showcase = await ctx.db.get(layout.id);
      if (!showcase || showcase.userId !== userId) continue;
      await ctx.db.patch(layout.id, {
        order: layout.order,
        isEnabled: layout.isEnabled,
        config: layout.config,
      });
    }
  },
});
