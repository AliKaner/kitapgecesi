import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getUserLists = query({
  args: {
    creatorId: v.id("users"),
    includePrivate: v.boolean(),
    currentUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, { creatorId, includePrivate, currentUserId }) => {
    const lists = await ctx.db
      .query("lists")
      .withIndex("by_creator", (q) => q.eq("creatorId", creatorId))
      .order("desc")
      .collect();

    const filtered = includePrivate
      ? lists
      : lists.filter((l) => !l.isPrivate);

    return Promise.all(
      filtered.map(async (list) => {
        const bookRows = await ctx.db
          .query("listBooks")
          .withIndex("by_list", (q) => q.eq("listId", list._id))
          .order("asc")
          .collect();
        const books = await Promise.all(bookRows.slice(0, 5).map((r) => ctx.db.get(r.bookId)));
        const bookCount = bookRows.length;
        const likeCount = await ctx.db
          .query("likes")
          .withIndex("by_target", (q) =>
            q.eq("targetType", "list").eq("targetId", list._id)
          )
          .collect()
          .then((r) => r.length);

        const isLiked = currentUserId
          ? await ctx.db
              .query("likes")
              .withIndex("by_user_target", (q) =>
                q
                  .eq("userId", currentUserId)
                  .eq("targetType", "list")
                  .eq("targetId", list._id)
              )
              .unique()
              .then((r) => !!r)
          : false;

        return { ...list, previewBooks: books.filter(Boolean), bookCount, likeCount, isLiked };
      })
    );
  },
});

export const getList = query({
  args: { listId: v.id("lists") },
  handler: async (ctx, { listId }) => {
    const list = await ctx.db.get(listId);
    if (!list) return null;

    const bookRows = await ctx.db
      .query("listBooks")
      .withIndex("by_list", (q) => q.eq("listId", listId))
      .order("asc")
      .collect();

    const books = await Promise.all(
      bookRows.map(async (row) => {
        const book = await ctx.db.get(row.bookId);
        return book ? { ...book, order: row.order } : null;
      })
    );

    const creator = await ctx.db.get(list.creatorId);
    const likeCount = await ctx.db
      .query("likes")
      .withIndex("by_target", (q) =>
        q.eq("targetType", "list").eq("targetId", listId)
      )
      .collect()
      .then((r) => r.length);

    return {
      ...list,
      books: books.filter((b): b is NonNullable<typeof b> => b !== null),
      creator,
      likeCount,
    };
  },
});

export const createList = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    creatorId: v.id("users"),
    isPrivate: v.boolean(),
    isRanked: v.boolean(),
    bookIds: v.array(v.id("books")),
  },
  handler: async (ctx, args) => {
    const { bookIds, ...listData } = args;
    const listId = await ctx.db.insert("lists", {
      ...listData,
      collaborators: [],
      createdAt: Date.now(),
    });

    for (let i = 0; i < bookIds.length; i++) {
      await ctx.db.insert("listBooks", {
        listId,
        bookId: bookIds[i],
        order: i,
      });
    }

    return listId;
  },
});

export const updateListBooks = mutation({
  args: {
    listId: v.id("lists"),
    userId: v.id("users"),
    bookIds: v.array(v.id("books")),
  },
  handler: async (ctx, { listId, userId, bookIds }) => {
    const list = await ctx.db.get(listId);
    if (!list) throw new Error("Liste bulunamadı.");
    if (
      list.creatorId !== userId &&
      !list.collaborators.includes(userId)
    ) {
      throw new Error("Bu listeyi düzenleme yetkiniz yok.");
    }

    const existing = await ctx.db
      .query("listBooks")
      .withIndex("by_list", (q) => q.eq("listId", listId))
      .collect();
    await Promise.all(existing.map((r) => ctx.db.delete(r._id)));

    for (let i = 0; i < bookIds.length; i++) {
      await ctx.db.insert("listBooks", {
        listId,
        bookId: bookIds[i],
        order: i,
      });
    }
  },
});

export const cloneList = mutation({
  args: {
    listId: v.id("lists"),
    userId: v.id("users"),
  },
  handler: async (ctx, { listId, userId }) => {
    const original = await ctx.db.get(listId);
    if (!original) throw new Error("Liste bulunamadı.");
    if (original.isPrivate) throw new Error("Bu liste klonlanamaz (gizli).");

    const bookRows = await ctx.db
      .query("listBooks")
      .withIndex("by_list", (q) => q.eq("listId", listId))
      .order("asc")
      .collect();

    const newListId = await ctx.db.insert("lists", {
      title: original.title,
      description: original.description,
      creatorId: userId,
      isPrivate: false,
      isRanked: original.isRanked,
      clonedFromListId: listId,
      collaborators: [],
      createdAt: Date.now(),
    });

    for (const row of bookRows) {
      await ctx.db.insert("listBooks", {
        listId: newListId,
        bookId: row.bookId,
        order: row.order,
      });
    }

    return newListId;
  },
});

export const getListComments = query({
  args: { listId: v.id("lists") },
  handler: async (ctx, { listId }) => {
    const comments = await ctx.db
      .query("listComments")
      .withIndex("by_list", (q) => q.eq("listId", listId))
      .order("asc")
      .collect();

    return Promise.all(
      comments.map(async (c) => {
        const author = await ctx.db.get(c.authorId);
        return { ...c, author };
      })
    );
  },
});

export const addListComment = mutation({
  args: {
    listId: v.id("lists"),
    authorId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("listComments", { ...args, createdAt: Date.now() });
  },
});

export const deleteList = mutation({
  args: { listId: v.id("lists"), userId: v.id("users") },
  handler: async (ctx, { listId, userId }) => {
    const list = await ctx.db.get(listId);
    if (!list) throw new Error("Liste bulunamadı.");
    if (list.creatorId !== userId) throw new Error("Bu listeyi silme yetkiniz yok.");

    const books = await ctx.db
      .query("listBooks")
      .withIndex("by_list", (q) => q.eq("listId", listId))
      .collect();
    await Promise.all(books.map((r) => ctx.db.delete(r._id)));
    await ctx.db.delete(listId);
  },
});
