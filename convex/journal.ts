import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const RANGE_MS: Record<string, number> = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
};

export const addEntry = mutation({
  args: {
    userId: v.id("users"),
    bookId: v.optional(v.id("books")),
    content: v.string(),
    pagesRead: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("journalEntries", { ...args, createdAt: Date.now() });
  },
});

export const getEntries = query({
  args: {
    userId: v.id("users"),
    range: v.union(v.literal("day"), v.literal("week"), v.literal("month"), v.literal("year")),
  },
  handler: async (ctx, { userId, range }) => {
    const since = Date.now() - RANGE_MS[range];
    const entries = await ctx.db
      .query("journalEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    const filtered = entries.filter((e) => e.createdAt >= since);

    return Promise.all(
      filtered.map(async (e) => ({
        ...e,
        book: e.bookId ? await ctx.db.get(e.bookId) : null,
      }))
    );
  },
});
