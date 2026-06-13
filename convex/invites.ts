import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const INVITE_QUOTA_BY_LEVEL: Record<number, number> = {
  1: 2,
  2: 4,
  3: 6,
  4: 8,
  5: 10,
};

function getQuota(level: number): number | typeof Infinity {
  if (level >= 6) return Infinity;
  return INVITE_QUOTA_BY_LEVEL[level] ?? 2;
}

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export const generateInviteCode = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("Kullanıcı bulunamadı.");
    if (user.trustScore < 50)
      throw new Error("Güven skorunuz çok düşük, kod üretemezsiniz.");

    const quota = getQuota(user.level);
    const myCodes = await ctx.db
      .query("inviteCodes")
      .filter((q) => q.eq(q.field("creatorId"), userId))
      .collect();

    if (quota !== Infinity && myCodes.length >= quota) {
      throw new Error(`Seviye ${user.level} için maksimum ${quota} davet kodu üretebilirsiniz.`);
    }

    let code: string;
    let exists = true;
    do {
      code = generateCode();
      const check = await ctx.db
        .query("inviteCodes")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
      exists = !!check;
    } while (exists);

    const id = await ctx.db.insert("inviteCodes", {
      code,
      creatorId: userId,
      isInfinite: false,
      usedCount: 0,
      maxUses: 1,
      isRevoked: false,
      createdAt: Date.now(),
    });

    return { id, code };
  },
});

export const createAdminCode = mutation({
  args: { adminSecret: v.string() },
  handler: async (ctx, { adminSecret }) => {
    if (adminSecret !== process.env.ADMIN_SECRET)
      throw new Error("Yetkisiz.");

    let code: string;
    let exists = true;
    do {
      code = generateCode();
      const check = await ctx.db
        .query("inviteCodes")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
      exists = !!check;
    } while (exists);

    const id = await ctx.db.insert("inviteCodes", {
      code,
      isInfinite: true,
      usedCount: 0,
      maxUses: 999999,
      isRevoked: false,
      createdAt: Date.now(),
    });

    return { id, code };
  },
});

export const revokeInviteCode = mutation({
  args: { codeId: v.id("inviteCodes"), userId: v.id("users") },
  handler: async (ctx, { codeId, userId }) => {
    const code = await ctx.db.get(codeId);
    if (!code) throw new Error("Kod bulunamadı.");
    if (code.creatorId !== userId) throw new Error("Bu kodu iptal etme yetkiniz yok.");
    await ctx.db.patch(codeId, { isRevoked: true });
  },
});

export const getMyInviteCodes = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("inviteCodes")
      .filter((q) => q.eq(q.field("creatorId"), userId))
      .order("desc")
      .collect();
  },
});

export const validateInviteCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const record = await ctx.db
      .query("inviteCodes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
    if (!record) return { valid: false, reason: "Geçersiz kod." };
    if (record.isRevoked) return { valid: false, reason: "Bu kod iptal edilmiş." };
    if (!record.isInfinite && record.usedCount >= record.maxUses)
      return { valid: false, reason: "Bu kodun kullanım limiti doldu." };
    return { valid: true };
  },
});

export const handleUserBan = mutation({
  args: { bannedUserId: v.id("users"), adminSecret: v.string() },
  handler: async (ctx, { bannedUserId, adminSecret }) => {
    if (adminSecret !== process.env.ADMIN_SECRET)
      throw new Error("Yetkisiz.");

    const banned = await ctx.db.get(bannedUserId);
    if (!banned) throw new Error("Kullanıcı bulunamadı.");

    // Trust score cezası: davet eden kişiye
    if (banned.invitedById) {
      const inviter = await ctx.db.get(banned.invitedById);
      if (inviter) {
        await ctx.db.patch(banned.invitedById, {
          trustScore: Math.max(0, inviter.trustScore - 20),
        });
      }
    }

    // Kullanıcı kodlarını iptal et
    const codes = await ctx.db
      .query("inviteCodes")
      .filter((q) => q.eq(q.field("creatorId"), bannedUserId))
      .collect();
    await Promise.all(codes.map((c) => ctx.db.patch(c._id, { isRevoked: true })));
  },
});
