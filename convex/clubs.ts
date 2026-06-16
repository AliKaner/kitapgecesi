import { mutation, query, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
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

export const getUserClubs = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const memberships = await ctx.db
      .query("clubMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    const clubs = await Promise.all(
      memberships.map(async (m) => {
        const club = await ctx.db.get(m.clubId);
        return club ? { ...club, role: m.role } : null;
      })
    );
    return clubs.filter((c): c is NonNullable<typeof c> => c !== null);
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
    avatarUrl: v.optional(v.string()),
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

export const updateClubImages = mutation({
  args: {
    clubId: v.id("clubs"),
    userId: v.id("users"),
    avatarUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
  },
  handler: async (ctx, { clubId, userId, avatarUrl, bannerUrl }) => {
    const club = await ctx.db.get(clubId);
    if (!club) throw new Error("Kulüp bulunamadı.");
    if (club.leaderId !== userId) throw new Error("Sadece lider görselleri değiştirebilir.");

    const patch: { avatarUrl?: string; bannerUrl?: string } = {};
    if (avatarUrl !== undefined) patch.avatarUrl = avatarUrl;
    if (bannerUrl !== undefined) patch.bannerUrl = bannerUrl;
    await ctx.db.patch(clubId, patch);
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

// ── Ayın kitabı anketi ─────────────────────────────────────────────

async function assertLeader(ctx: MutationCtx, clubId: Id<"clubs">, userId: Id<"users">) {
  const club = await ctx.db.get(clubId);
  if (!club) throw new Error("Kulüp bulunamadı.");
  if (club.leaderId !== userId) throw new Error("Bu işlem için yetkiniz yok.");
  return club;
}

export const createPoll = mutation({
  args: {
    clubId: v.id("clubs"),
    userId: v.id("users"),
    question: v.string(),
    bookIds: v.array(v.id("books")),
  },
  handler: async (ctx, { clubId, userId, question, bookIds }) => {
    await assertLeader(ctx, clubId, userId);
    if (bookIds.length < 2) throw new Error("Anket için en az iki kitap ekleyin.");

    const existingOpen = await ctx.db
      .query("clubPolls")
      .withIndex("by_club", (q) => q.eq("clubId", clubId))
      .filter((q) => q.eq(q.field("status"), "open"))
      .first();
    if (existingOpen) throw new Error("Bu kulüpte zaten açık bir anket var.");

    return ctx.db.insert("clubPolls", {
      clubId,
      question: question.trim() || "Ayın kitabı hangisi olsun?",
      bookIds,
      status: "open",
      createdBy: userId,
      createdAt: Date.now(),
    });
  },
});

export const getActivePoll = query({
  args: { clubId: v.id("clubs"), userId: v.optional(v.id("users")) },
  handler: async (ctx, { clubId, userId }) => {
    const poll = await ctx.db
      .query("clubPolls")
      .withIndex("by_club", (q) => q.eq("clubId", clubId))
      .filter((q) => q.eq(q.field("status"), "open"))
      .first();
    if (!poll) return null;

    const votes = await ctx.db
      .query("clubPollVotes")
      .withIndex("by_poll", (q) => q.eq("pollId", poll._id))
      .collect();

    const counts = new Map<string, number>();
    for (const vote of votes) counts.set(vote.bookId, (counts.get(vote.bookId) ?? 0) + 1);
    const myVote = userId ? votes.find((vote) => vote.userId === userId)?.bookId ?? null : null;

    const options = await Promise.all(
      poll.bookIds.map(async (bookId) => {
        const book = await ctx.db.get(bookId);
        return { bookId, book, votes: counts.get(bookId) ?? 0 };
      })
    );

    return { ...poll, options, totalVotes: votes.length, myVote };
  },
});

export const voteOnPoll = mutation({
  args: {
    pollId: v.id("clubPolls"),
    userId: v.id("users"),
    bookId: v.id("books"),
  },
  handler: async (ctx, { pollId, userId, bookId }) => {
    const poll = await ctx.db.get(pollId);
    if (!poll || poll.status !== "open") throw new Error("Anket kapalı.");
    if (!poll.bookIds.includes(bookId)) throw new Error("Geçersiz seçenek.");

    const membership = await ctx.db
      .query("clubMembers")
      .withIndex("by_club_user", (q) => q.eq("clubId", poll.clubId).eq("userId", userId))
      .unique();
    if (!membership || membership.status !== "active") throw new Error("Oy vermek için kulübe üye olun.");

    const existing = await ctx.db
      .query("clubPollVotes")
      .withIndex("by_poll_user", (q) => q.eq("pollId", pollId).eq("userId", userId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { bookId, createdAt: Date.now() });
    } else {
      await ctx.db.insert("clubPollVotes", { pollId, userId, bookId, createdAt: Date.now() });
    }
  },
});

export const closePoll = mutation({
  args: {
    pollId: v.id("clubPolls"),
    userId: v.id("users"),
    setAsActiveBook: v.optional(v.boolean()),
  },
  handler: async (ctx, { pollId, userId, setAsActiveBook }) => {
    const poll = await ctx.db.get(pollId);
    if (!poll) throw new Error("Anket bulunamadı.");
    await assertLeader(ctx, poll.clubId, userId);

    const votes = await ctx.db
      .query("clubPollVotes")
      .withIndex("by_poll", (q) => q.eq("pollId", pollId))
      .collect();
    const counts = new Map<string, number>();
    for (const vote of votes) counts.set(vote.bookId, (counts.get(vote.bookId) ?? 0) + 1);

    let winnerBookId: Id<"books"> | undefined;
    let best = -1;
    for (const bookId of poll.bookIds) {
      const c = counts.get(bookId) ?? 0;
      if (c > best) {
        best = c;
        winnerBookId = bookId;
      }
    }

    await ctx.db.patch(pollId, { status: "closed", closedAt: Date.now(), winnerBookId });
    if (setAsActiveBook && winnerBookId) {
      await ctx.db.patch(poll.clubId, { activeBookId: winnerBookId });
    }
    return { winnerBookId };
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
