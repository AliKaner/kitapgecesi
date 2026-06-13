import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const setStatus = mutation({
  args: {
    userId: v.id("users"),
    bookId: v.id("books"),
    status: v.union(v.literal("want"), v.literal("reading"), v.literal("read")),
  },
  handler: async (ctx, { userId, bookId, status }) => {
    const existing = await ctx.db
      .query("userBooks")
      .withIndex("by_user_book", (q) => q.eq("userId", userId).eq("bookId", bookId))
      .unique();

    const now = Date.now();
    const patch: { status: typeof status; startedAt?: number; finishedAt?: number } = { status };
    if (status === "reading" && !existing?.startedAt) patch.startedAt = now;
    if (status === "read") patch.finishedAt = now;

    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("userBooks", {
        userId,
        bookId,
        status,
        startedAt: patch.startedAt,
        finishedAt: patch.finishedAt,
        createdAt: now,
      });
    }
  },
});

export const getUserBook = query({
  args: { userId: v.id("users"), bookId: v.id("books") },
  handler: async (ctx, { userId, bookId }) => {
    return ctx.db
      .query("userBooks")
      .withIndex("by_user_book", (q) => q.eq("userId", userId).eq("bookId", bookId))
      .unique();
  },
});

export const getUserLibrary = query({
  args: {
    userId: v.id("users"),
    status: v.optional(v.union(v.literal("want"), v.literal("reading"), v.literal("read"))),
  },
  handler: async (ctx, { userId, status }) => {
    const entries = status
      ? await ctx.db
          .query("userBooks")
          .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", status))
          .collect()
      : await ctx.db
          .query("userBooks")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect();

    return Promise.all(
      entries.map(async (entry) => ({
        ...entry,
        book: await ctx.db.get(entry.bookId),
      }))
    );
  },
});
