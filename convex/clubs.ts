import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getClub = query({
  args: { clubId: v.id("clubs") },
  handler: async (ctx, { clubId }) => {
    const club = await ctx.db.get(clubId);
    if (!club) return null;
    const memberCount = await ctx.db
      .query("clubMembers")
      .withIndex("by_club", (q) => q.eq("clubId", clubId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect()
      .then((r) => r.length);
    const activeBook = club.activeBookId
      ? await ctx.db.get(club.activeBookId)
      : null;
    return { ...club, memberCount, activeBook };
  },
});

export const listClubs = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("clubs").order("desc").take(50);
  },
});

export const getMembership = query({
  args: { clubId: v.id("clubs"), userId: v.id("users") },
  handler: async (ctx, { clubId, userId }) => {
    return ctx.db
      .query("clubMembers")
      .withIndex("by_club_user", (q) => q.eq("clubId", clubId).eq("userId", userId))
      .unique();
  },
});

export const createClub = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    bannerUrl: v.string(),
    privacyMode: v.union(
      v.literal("public"),
      v.literal("restricted"),
      v.literal("private")
    ),
    leaderId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const clubId = await ctx.db.insert("clubs", {
      ...args,
      createdAt: Date.now(),
    });
    await ctx.db.insert("clubMembers", {
      clubId,
      userId: args.leaderId,
      role: "leader",
      status: "active",
      joinedAt: Date.now(),
    });
    return clubId;
  },
});

export const manageMembership = mutation({
  args: {
    clubId: v.id("clubs"),
    userId: v.id("users"),
    action: v.union(
      v.literal("join"),
      v.literal("leave"),
      v.literal("approve"),
      v.literal("kick")
    ),
    targetUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, { clubId, userId, action, targetUserId }) => {
    const club = await ctx.db.get(clubId);
    if (!club) throw new Error("Kulüp bulunamadı.");

    if (action === "join") {
      const existing = await ctx.db
        .query("clubMembers")
        .withIndex("by_club_user", (q) =>
          q.eq("clubId", clubId).eq("userId", userId)
        )
        .unique();
      if (existing) throw new Error("Zaten üyesiniz veya başvurunuz inceleniyor.");

      const status = club.privacyMode === "public" ? "active" : "pending";
      await ctx.db.insert("clubMembers", {
        clubId,
        userId,
        role: "member",
        status,
        joinedAt: Date.now(),
      });
      return { status };
    }

    if (action === "leave") {
      const membership = await ctx.db
        .query("clubMembers")
        .withIndex("by_club_user", (q) =>
          q.eq("clubId", clubId).eq("userId", userId)
        )
        .unique();
      if (!membership) throw new Error("Üyelik bulunamadı.");
      if (membership.role === "leader") throw new Error("Lider kulübü terk edemez.");
      await ctx.db.delete(membership._id);
      return { status: "left" };
    }

    // approve / kick — only leader or moderator
    const requesterMembership = await ctx.db
      .query("clubMembers")
      .withIndex("by_club_user", (q) =>
        q.eq("clubId", clubId).eq("userId", userId)
      )
      .unique();
    if (
      !requesterMembership ||
      !["leader", "moderator"].includes(requesterMembership.role)
    ) {
      throw new Error("Bu işlem için yetkiniz yok.");
    }

    const target = targetUserId ?? userId;
    const targetMembership = await ctx.db
      .query("clubMembers")
      .withIndex("by_club_user", (q) =>
        q.eq("clubId", clubId).eq("userId", target)
      )
      .unique();
    if (!targetMembership) throw new Error("Hedef üye bulunamadı.");

    if (action === "approve") {
      await ctx.db.patch(targetMembership._id, { status: "active" });
    } else if (action === "kick") {
      await ctx.db.delete(targetMembership._id);
    }

    return { status: action };
  },
});

export const setActiveBook = mutation({
  args: {
    clubId: v.id("clubs"),
    userId: v.id("users"),
    bookId: v.optional(v.id("books")),
  },
  handler: async (ctx, { clubId, userId, bookId }) => {
    const club = await ctx.db.get(clubId);
    if (!club) throw new Error("Kulüp bulunamadı.");
    if (club.leaderId !== userId) throw new Error("Sadece lider kitap seçebilir.");
    await ctx.db.patch(clubId, { activeBookId: bookId });
  },
});

export const archiveClubBook = mutation({
  args: {
    clubId: v.id("clubs"),
    userId: v.id("users"),
    bookId: v.id("books"),
    startedAt: v.number(),
    finishedAt: v.number(),
  },
  handler: async (ctx, { clubId, userId, bookId, startedAt, finishedAt }) => {
    const club = await ctx.db.get(clubId);
    if (!club) throw new Error("Kulüp bulunamadı.");
    if (club.leaderId !== userId) throw new Error("Sadece lider kitabı arşivleyebilir.");

    await ctx.db.insert("clubArchive", { clubId, bookId, startedAt, finishedAt });
    await ctx.db.patch(clubId, { activeBookId: undefined });
  },
});

export const getClubArchive = query({
  args: { clubId: v.id("clubs") },
  handler: async (ctx, { clubId }) => {
    const archive = await ctx.db
      .query("clubArchive")
      .withIndex("by_club", (q) => q.eq("clubId", clubId))
      .order("desc")
      .collect();

    return Promise.all(
      archive.map(async (entry) => {
        const book = await ctx.db.get(entry.bookId);
        return { ...entry, book };
      })
    );
  },
});
