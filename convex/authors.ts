import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const listAuthors = query({
  args: {},
  handler: async (ctx) => {
    const authors = await ctx.db.query("authors").collect();
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_target", (q) => q.eq("targetType", "author"))
      .collect();

    const sums = new Map<string, { sum: number; count: number }>();
    for (const r of ratings) {
      const cur = sums.get(r.targetId) ?? { sum: 0, count: 0 };
      cur.sum += r.value;
      cur.count += 1;
      sums.set(r.targetId, cur);
    }

    return Promise.all(
      authors.map(async (author) => {
        const bookCount = await ctx.db
          .query("books")
          .withIndex("by_authorId", (q) => q.eq("authorId", author._id))
          .collect()
          .then((r) => r.length);
        const m = sums.get(author._id);
        return { ...author, bookCount, avgRating: m ? m.sum / m.count : 0, ratingCount: m?.count ?? 0 };
      })
    );
  },
});

export const getAuthor = query({
  args: { authorId: v.id("authors") },
  handler: async (ctx, { authorId }) => {
    const author = await ctx.db.get(authorId);
    if (!author) return null;

    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_target", (q) => q.eq("targetType", "author").eq("targetId", authorId))
      .collect();
    const ratingSummary =
      ratings.length === 0
        ? { avg: 0, count: 0 }
        : { avg: ratings.reduce((acc, r) => acc + r.value, 0) / ratings.length, count: ratings.length };

    return { ...author, ratingSummary };
  },
});

export const getAuthorBooks = query({
  args: { authorId: v.id("authors") },
  handler: async (ctx, { authorId }) => {
    return ctx.db
      .query("books")
      .withIndex("by_authorId", (q) => q.eq("authorId", authorId))
      .collect();
  },
});

export const getOrCreateAuthor = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }): Promise<Id<"authors">> => {
    const existing = await ctx.db
      .query("authors")
      .withIndex("by_name", (q) => q.eq("name", name))
      .unique();
    if (existing) return existing._id;
    return ctx.db.insert("authors", { name, createdAt: Date.now() });
  },
});
