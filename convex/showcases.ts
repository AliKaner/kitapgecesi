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
