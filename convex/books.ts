import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const searchLocalBooks = query({
  args: { query: v.string() },
  handler: async (ctx, { query: q }) => {
    const lower = q.toLowerCase();
    const all = await ctx.db.query("books").collect();
    return all
      .filter(
        (b) =>
          b.title.toLowerCase().includes(lower) ||
          b.author.toLowerCase().includes(lower)
      )
      .slice(0, 20);
  },
});

export const listBooksWithRatings = query({
  args: {},
  handler: async (ctx) => {
    const books = await ctx.db.query("books").collect();
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_target", (q) => q.eq("targetType", "book"))
      .collect();

    const sums = new Map<string, { sum: number; count: number }>();
    for (const r of ratings) {
      const cur = sums.get(r.targetId) ?? { sum: 0, count: 0 };
      cur.sum += r.value;
      cur.count += 1;
      sums.set(r.targetId, cur);
    }

    return books.map((b) => {
      const m = sums.get(b._id);
      return { ...b, avgRating: m ? m.sum / m.count : 0, ratingCount: m?.count ?? 0 };
    });
  },
});

export const getBook = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    return ctx.db.get(bookId);
  },
});

export const searchExternalBooks = action({
  args: { query: v.string() },
  handler: async (_ctx, { query: q }) => {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=10&langRestrict=tr`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Google Books API hatası.");
    const data = await res.json();

    type GoogleBookItem = {
      id: string;
      volumeInfo?: {
        title?: string;
        authors?: string[];
        pageCount?: number;
        imageLinks?: { thumbnail?: string };
        industryIdentifiers?: { type: string; identifier: string }[];
      };
    };

    return (data.items ?? []).map((item: GoogleBookItem) => {
      const info = item.volumeInfo ?? {};
      return {
        title: info.title ?? "Bilinmeyen",
        author: (info.authors ?? []).join(", "),
        totalPages: info.pageCount ?? 0,
        coverUrl: info.imageLinks?.thumbnail ?? "",
        externalId: item.id,
        isbn:
          (info.industryIdentifiers ?? []).find(
            (i) => i.type === "ISBN_13"
          )?.identifier ?? undefined,
      };
    });
  },
});

export const importOrGetBook = mutation({
  args: {
    title: v.string(),
    author: v.string(),
    totalPages: v.number(),
    coverUrl: v.string(),
    externalId: v.optional(v.string()),
    isbn: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.externalId) {
      const existing = await ctx.db
        .query("books")
        .withIndex("by_externalId", (q) =>
          q.eq("externalId", args.externalId!)
        )
        .unique();
      if (existing) return existing._id;
    }

    if (args.isbn) {
      const existing = await ctx.db
        .query("books")
        .withIndex("by_isbn", (q) => q.eq("isbn", args.isbn!))
        .unique();
      if (existing) return existing._id;
    }

    return ctx.db.insert("books", {
      ...args,
      isVerified: true,
      createdAt: Date.now(),
    });
  },
});

export const createUGCBook = mutation({
  args: {
    title: v.string(),
    author: v.string(),
    totalPages: v.number(),
    coverUrl: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("books", {
      ...args,
      isVerified: false,
      createdAt: Date.now(),
    });
  },
});

export const rateTarget = mutation({
  args: {
    userId: v.id("users"),
    targetType: v.union(v.literal("book"), v.literal("author")),
    targetId: v.string(),
    value: v.number(),
  },
  handler: async (ctx, { userId, targetType, targetId, value }) => {
    const existing = await ctx.db
      .query("ratings")
      .withIndex("by_user_target", (q) =>
        q.eq("userId", userId).eq("targetType", targetType).eq("targetId", targetId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { value });
    } else {
      await ctx.db.insert("ratings", {
        userId,
        targetType,
        targetId,
        value,
        createdAt: Date.now(),
      });
    }
  },
});

export const getRatingSummary = query({
  args: {
    targetType: v.union(v.literal("book"), v.literal("author")),
    targetId: v.string(),
  },
  handler: async (ctx, { targetType, targetId }) => {
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_target", (q) => q.eq("targetType", targetType).eq("targetId", targetId))
      .collect();

    if (ratings.length === 0) return { avg: 0, count: 0 };
    const sum = ratings.reduce((acc, r) => acc + r.value, 0);
    return { avg: sum / ratings.length, count: ratings.length };
  },
});

export const getUserRating = query({
  args: {
    userId: v.id("users"),
    targetType: v.union(v.literal("book"), v.literal("author")),
    targetId: v.string(),
  },
  handler: async (ctx, { userId, targetType, targetId }) => {
    const existing = await ctx.db
      .query("ratings")
      .withIndex("by_user_target", (q) =>
        q.eq("userId", userId).eq("targetType", targetType).eq("targetId", targetId)
      )
      .unique();
    return existing?.value ?? null;
  },
});
