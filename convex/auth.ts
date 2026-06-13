import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { generateSalt, generateToken, hashPassword } from "./passwordUtils";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 gün

export const register = mutation({
  args: {
    name: v.string(),
    username: v.string(),
    email: v.string(),
    password: v.string(),
    inviteCode: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    if (existing) throw new Error("Bu kullanıcı adı zaten alınmış.");

    const code = await ctx.db
      .query("inviteCodes")
      .withIndex("by_code", (q) => q.eq("code", args.inviteCode))
      .unique();
    if (!code) throw new Error("Geçersiz davetiye kodu.");
    if (code.isRevoked) throw new Error("Bu davetiye kodu iptal edilmiş.");
    if (!code.isInfinite && code.usedCount >= code.maxUses)
      throw new Error("Bu davetiye kodu kullanım limitine ulaştı.");

    let invitedById: Id<"users"> | undefined;
    if (code.creatorId) {
      invitedById = code.creatorId;
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(args.password, salt);

    const userId = await ctx.db.insert("users", {
      name: args.name,
      username: args.username,
      email: args.email,
      profileImageUrl: "",
      externalId: `local-${args.username}`,
      xp: 0,
      yaprak: 100,
      level: 1,
      trustScore: 100,
      invitedById,
      passwordHash,
      passwordSalt: salt,
      locale: "tr",
      createdAt: Date.now(),
    });

    await ctx.db.patch(code._id, { usedCount: code.usedCount + 1 });

    const defaultWidgets = ["target", "favorites", "bookshelf", "quote"] as const;
    for (let i = 0; i < defaultWidgets.length; i++) {
      await ctx.db.insert("showcases", {
        userId,
        widgetType: defaultWidgets[i],
        order: i,
        isEnabled: true,
        config: "{}",
      });
    }

    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId,
      token,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    });

    const user = await ctx.db.get(userId);
    return { token, user };
  },
});

export const login = mutation({
  args: {
    usernameOrEmail: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { usernameOrEmail, password }) => {
    let user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", usernameOrEmail))
      .unique();

    if (!user) {
      const all = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), usernameOrEmail))
        .collect();
      user = all[0] ?? null;
    }

    if (!user) throw new Error("Kullanıcı bulunamadı.");

    const hash = await hashPassword(password, user.passwordSalt);
    if (hash !== user.passwordHash) throw new Error("Şifre yanlış.");

    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    });

    return { token, user };
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (session) await ctx.db.delete(session._id);
  },
});

export const getCurrentUser = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, { token }) => {
    if (!token) return null;
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!session) return null;
    if (session.expiresAt < Date.now()) return null;
    return ctx.db.get(session.userId);
  },
});
