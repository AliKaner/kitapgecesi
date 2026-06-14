import { internalMutation } from "./_generated/server";
import { generateSalt, hashPassword } from "./passwordUtils";
import { Id } from "./_generated/dataModel";

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("users").first();
    if (existing) return "Zaten seed edilmiş.";

    const now = Date.now();

    // ── Yazarlar & Kitaplar ────────────────────────────────────────
    const author = async (name: string) =>
      ctx.db.insert("authors", { name, createdAt: now });

    const book = async (
      title: string,
      authorName: string,
      authorId: Id<"authors">,
      totalPages: number,
      genres: string[],
      coverUrl = ""
    ) =>
      ctx.db.insert("books", {
        title,
        author: authorName,
        authorId,
        genres,
        totalPages,
        coverUrl,
        isVerified: true,
        createdAt: now,
      });

    const rickRubin = await author("Rick Rubin");
    const nevalElSeddavi = await author("Neval El Seddavi");
    const davidEagleman = await author("David Eagleman");
    const markWolynn = await author("Mark Wolynn");
    const debbieBerne = await author("Debbie Berne");
    const brunoMunari = await author("Bruno Munari");
    const donNorman = await author("Don Norman");
    const besselVanDerKolk = await author("Bessel van der Kolk");
    const jamesClear = await author("James Clear");
    const frankHerbert = await author("Frank Herbert");
    const pauloCoelho = await author("Paulo Coelho");

    const creativeAct = await book("The Creative Act: A Way of Being", "Rick Rubin", rickRubin, 432, ["Sanat", "Felsefe"]);
    const sifir = await book("Sıfır Noktasındaki Kadın", "Neval El Seddavi", nevalElSeddavi, 116, ["Roman", "Edebiyat"]);
    const beyin = await book("Beyin — Senin Hikayen", "David Eagleman", davidEagleman, 272, ["Bilim", "Psikoloji"]);
    const seninle = await book("Seninle Başlamadı", "Mark Wolynn", markWolynn, 356, ["Psikoloji", "Duygu ve Düşünce"]);
    const designBooks = await book("The Design of Books", "Debbie Berne", debbieBerne, 240, ["Sanat", "Tasarım"]);
    const designArt = await book("Design as Art", "Bruno Munari", brunoMunari, 224, ["Sanat", "Tasarım"]);
    const everyday = await book("The Design of Everyday Things", "Don Norman", donNorman, 368, ["Tasarım", "Bilim"]);
    const bodyScore = await book("The Body Keeps the Score", "Bessel van der Kolk", besselVanDerKolk, 464, ["Psikoloji", "Bilim"]);
    const atomic = await book("Atomic Habits", "James Clear", jamesClear, 320, ["Duygu ve Düşünce", "Felsefe"]);
    const dune = await book("Dune", "Frank Herbert", frankHerbert, 688, ["Roman", "Edebiyat"], "/books/dune.png");
    const simyaci = await book("Simyacı", "Paulo Coelho", pauloCoelho, 197, ["Roman", "Felsefe"]);

    // ── Kullanıcılar ─────────────────────────────────────────────
    const defaultSalt = generateSalt();
    const defaultPasswordHash = await hashPassword("sifre123", defaultSalt);

    const user = async (name: string, username: string, externalId: string) =>
      ctx.db.insert("users", {
        name,
        username,
        email: `${username}@example.com`,
        profileImageUrl: "",
        externalId,
        xp: 0,
        yaprak: 100,
        level: 1,
        trustScore: 100,
        passwordHash: defaultPasswordHash,
        passwordSalt: defaultSalt,
        locale: "tr",
        createdAt: now,
      });

    const selcan = await user("Selcan Güler", "selcanguler", "seed-selcan");
    const cem = await user("Cem Yazgan", "cemyazgan", "seed-cem");
    const metecan = await user("Metecan Kaplan", "metecankaplan", "seed-metecan");
    const nazan = await user("Nazan Çeliker", "nazanceliker", "seed-nazan");

    // Selcan için varsayılan vitrin
    const defaultWidgets = ["target", "favorites", "bookshelf", "quote"] as const;
    for (let i = 0; i < defaultWidgets.length; i++) {
      await ctx.db.insert("showcases", {
        userId: selcan,
        widgetType: defaultWidgets[i],
        order: i,
        isEnabled: true,
        config: "{}",
      });
    }

    // ── Gönderiler ───────────────────────────────────────────────
    const post1 = await ctx.db.insert("posts", {
      authorId: cem,
      type: "direkt",
      content:
        "Dün yeni bir kararla teknik kitaplar okuyup beraber yorumlayacağımız, birbirimizle paylaşacağımız bir kulüp kurduk. Katılmak isteyen herkesi bekleriz.",
      isSilent: false,
      createdAt: now - 1000 * 60 * 60 * 24 * 5,
    });

    const post2 = await ctx.db.insert("posts", {
      authorId: metecan,
      type: "okuma",
      content:
        "“Beyin Senin Hikayen,” insan beyninin karmaşıklığını sade ve akıcı bir dille anlatan etkileyici bir kitap. Kendini ve düşünce mekanizmalarını daha iyi anlamak isteyenler için ilham verici bir okuma deneyimi sunuyor.",
      bookIds: [beyin],
      isSilent: false,
      createdAt: now - 1000 * 60 * 60 * 24 * 8,
    });

    const post3 = await ctx.db.insert("posts", {
      authorId: nazan,
      type: "okuma",
      content:
        "“Seninle Başlamadı,” aile içinde yaşanan zorlukların birey üzerindeki etkisini derinlemesine ele alan, düşündürücü ve içgörü kazandıran bir kitap.",
      bookIds: [seninle],
      isSilent: false,
      createdAt: now - 1000 * 60 * 60 * 24 * 1,
    });

    // Beğeni ve yorumlar
    await ctx.db.insert("likes", { userId: selcan, targetType: "post", targetId: post1, createdAt: now });
    await ctx.db.insert("likes", { userId: metecan, targetType: "post", targetId: post1, createdAt: now });
    await ctx.db.insert("likes", { userId: selcan, targetType: "post", targetId: post2, createdAt: now });
    await ctx.db.insert("comments", { postId: post2, authorId: selcan, content: "Harika bir kitap ✨", createdAt: now });

    // ── Listeler ─────────────────────────────────────────────────
    const list = async (title: string, description: string, bookIds: typeof creativeAct[]) => {
      const listId = await ctx.db.insert("lists", {
        title,
        description,
        creatorId: selcan,
        isPrivate: false,
        isRanked: false,
        collaborators: [],
        createdAt: now,
      });
      for (let i = 0; i < bookIds.length; i++) {
        await ctx.db.insert("listBooks", { listId, bookId: bookIds[i], order: i });
      }
      return listId;
    };

    const designList = await list("Design", "Tasarım üzerine sevdiğim kitaplar.", [designBooks, designArt, everyday, atomic]);
    await list("Yeniler", "Son okuduklarım.", [dune, simyaci, bodyScore, beyin]);
    await list("Psikoloji", "Zihin ve davranış üzerine.", [bodyScore, beyin, seninle]);
    await list("İlham", "Beni besleyen kitaplar.", [creativeAct, atomic, simyaci, designArt]);

    // ── Liste Yorumları ────────────────────────────────────────────
    await ctx.db.insert("listComments", { listId: designList, authorId: cem, content: "Harika bir seçki, hepsini okumak istiyorum.", createdAt: now - 1000 * 60 * 60 * 6 });
    await ctx.db.insert("listComments", { listId: designList, authorId: nazan, content: "Design as Art gerçekten ufuk açıcı.", createdAt: now - 1000 * 60 * 60 * 3 });

    // ── Puanlamalar ──────────────────────────────────────────────
    await ctx.db.insert("ratings", { userId: selcan, targetType: "book", targetId: dune, value: 5, createdAt: now - 1000 * 60 * 60 * 24 * 11 });
    await ctx.db.insert("ratings", { userId: metecan, targetType: "book", targetId: dune, value: 4, createdAt: now - 1000 * 60 * 60 * 24 * 9 });
    await ctx.db.insert("ratings", { userId: cem, targetType: "book", targetId: sifir, value: 5, createdAt: now - 1000 * 60 * 60 * 24 * 4 });
    await ctx.db.insert("ratings", { userId: nazan, targetType: "book", targetId: atomic, value: 4, createdAt: now - 1000 * 60 * 60 * 24 * 7 });
    await ctx.db.insert("ratings", { userId: selcan, targetType: "author", targetId: frankHerbert, value: 5, createdAt: now - 1000 * 60 * 60 * 24 * 11 });
    await ctx.db.insert("ratings", { userId: metecan, targetType: "author", targetId: jamesClear, value: 4, createdAt: now - 1000 * 60 * 60 * 24 * 30 });

    // ── Rozetler ─────────────────────────────────────────────────
    await ctx.db.insert("userBadges", { userId: selcan, badgeKey: "ilk_paylasim", earnedAt: now - 1000 * 60 * 60 * 24 * 30 });
    await ctx.db.insert("userBadges", { userId: selcan, badgeKey: "kitap_kurdu", earnedAt: now - 1000 * 60 * 60 * 24 * 12 });
    await ctx.db.insert("userBadges", { userId: cem, badgeKey: "ilk_paylasim", earnedAt: now - 1000 * 60 * 60 * 24 * 5 });
    await ctx.db.insert("userBadges", { userId: metecan, badgeKey: "aktif_okur", earnedAt: now - 1000 * 60 * 60 * 24 * 8 });

    // ── Kulüpler ─────────────────────────────────────────────────
    const club1 = await ctx.db.insert("clubs", {
      name: "Tasarım Severler Kulübü",
      description: "Tasarım ve sanat üzerine kitapları birlikte okuyup tartışıyoruz.",
      bannerUrl: "",
      leaderId: cem,
      privacyMode: "public",
      activeBookId: designBooks,
      createdAt: now - 1000 * 60 * 60 * 24 * 20,
    });
    const club2 = await ctx.db.insert("clubs", {
      name: "Bilim Kurgu Kulübü",
      description: "Klasik ve modern bilim kurgu romanlarını birlikte keşfediyoruz.",
      bannerUrl: "",
      leaderId: selcan,
      privacyMode: "public",
      activeBookId: dune,
      createdAt: now - 1000 * 60 * 60 * 24 * 45,
    });

    await ctx.db.insert("clubMembers", { clubId: club1, userId: cem, role: "leader", status: "active", joinedAt: now - 1000 * 60 * 60 * 24 * 20 });
    await ctx.db.insert("clubMembers", { clubId: club1, userId: selcan, role: "member", status: "active", joinedAt: now - 1000 * 60 * 60 * 24 * 18 });
    await ctx.db.insert("clubMembers", { clubId: club1, userId: nazan, role: "member", status: "pending", joinedAt: now - 1000 * 60 * 60 * 24 * 1 });

    await ctx.db.insert("clubMembers", { clubId: club2, userId: selcan, role: "leader", status: "active", joinedAt: now - 1000 * 60 * 60 * 24 * 45 });
    await ctx.db.insert("clubMembers", { clubId: club2, userId: metecan, role: "moderator", status: "active", joinedAt: now - 1000 * 60 * 60 * 24 * 40 });
    await ctx.db.insert("clubMembers", { clubId: club2, userId: cem, role: "member", status: "active", joinedAt: now - 1000 * 60 * 60 * 24 * 30 });

    await ctx.db.insert("clubArchive", { clubId: club2, bookId: simyaci, startedAt: now - 1000 * 60 * 60 * 24 * 60, finishedAt: now - 1000 * 60 * 60 * 24 * 46 });

    // ── Bildirimler ──────────────────────────────────────────────
    await ctx.db.insert("notifications", {
      userId: selcan,
      senderId: metecan,
      type: "follow",
      isRead: false,
      createdAt: now - 1000 * 60 * 60 * 2,
    });
    await ctx.db.insert("notifications", {
      userId: selcan,
      senderId: metecan,
      type: "like",
      targetPostId: post1,
      isRead: false,
      createdAt: now - 1000 * 60 * 60 * 5,
    });
    await ctx.db.insert("notifications", {
      userId: selcan,
      senderId: nazan,
      type: "repost",
      targetPostId: post2,
      isRead: true,
      createdAt: now - 1000 * 60 * 60 * 24,
    });
    await ctx.db.insert("notifications", {
      userId: selcan,
      senderId: cem,
      type: "reply",
      targetPostId: post3,
      isRead: true,
      createdAt: now - 1000 * 60 * 60 * 24 * 2,
    });

    // ── Takip ────────────────────────────────────────────────────
    await ctx.db.insert("follows", { followerId: metecan, followingId: selcan, createdAt: now });
    await ctx.db.insert("follows", { followerId: nazan, followingId: selcan, createdAt: now });
    await ctx.db.insert("follows", { followerId: selcan, followingId: cem, createdAt: now });

    // ── Bağışlar ─────────────────────────────────────────────────
    await ctx.db.insert("donations", { userId: selcan, organizationName: "LÖSEV", yaprakSpent: 50, createdAt: now - 1000 * 60 * 60 * 24 * 10 });
    await ctx.db.insert("donations", { userId: selcan, organizationName: "TEMA", yaprakSpent: 25, createdAt: now - 1000 * 60 * 60 * 24 * 30 });

    // ── Kitaplık (Selcan) ────────────────────────────────────────
    await ctx.db.insert("userBooks", { userId: selcan, bookId: dune, status: "read", startedAt: now - 1000 * 60 * 60 * 24 * 20, finishedAt: now - 1000 * 60 * 60 * 24 * 12, createdAt: now - 1000 * 60 * 60 * 24 * 20 });
    await ctx.db.insert("userBooks", { userId: selcan, bookId: atomic, status: "read", startedAt: now - 1000 * 60 * 60 * 24 * 40, finishedAt: now - 1000 * 60 * 60 * 24 * 30, createdAt: now - 1000 * 60 * 60 * 24 * 40 });
    await ctx.db.insert("userBooks", { userId: selcan, bookId: beyin, status: "reading", startedAt: now - 1000 * 60 * 60 * 24 * 3, createdAt: now - 1000 * 60 * 60 * 24 * 3 });
    await ctx.db.insert("userBooks", { userId: selcan, bookId: simyaci, status: "want", createdAt: now - 1000 * 60 * 60 * 24 });

    // ── Günlük (Selcan) ──────────────────────────────────────────
    await ctx.db.insert("journalEntries", { userId: selcan, bookId: beyin, content: "Beyin'in hafıza üzerine olan bölümünü okudum, çok ilginç örnekler var.", pagesRead: 24, createdAt: now - 1000 * 60 * 60 * 24 * 2 });
    await ctx.db.insert("journalEntries", { userId: selcan, bookId: dune, content: "Dune'u bitirdim, kesinlikle yeniden okunası bir klasik.", pagesRead: 688, createdAt: now - 1000 * 60 * 60 * 24 * 12 });
    await ctx.db.insert("journalEntries", { userId: selcan, content: "Bugün hiç kitap okuyamadım ama yarın telafi edeceğim.", createdAt: now - 1000 * 60 * 60 * 24 * 6 });

    return "Seed tamamlandı.";
  },
});

// Mevcut bir veritabanına eksik mock verileri (ratings, userBadges,
// listComments, ikinci kulüp, clubArchive) ekler. Birden fazla kez
// çalıştırılması güvenlidir, mevcut kayıtları korur.
export const seedExtra = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const userByUsername = async (username: string) =>
      ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", username))
        .first();

    const selcan = await userByUsername("selcanguler");
    const cem = await userByUsername("cemyazgan");
    const metecan = await userByUsername("metecankaplan");
    const nazan = await userByUsername("nazanceliker");
    if (!selcan || !cem || !metecan || !nazan) return "Önce ana seed çalıştırılmalı.";

    const bookByTitle = async (title: string) =>
      ctx.db
        .query("books")
        .filter((q) => q.eq(q.field("title"), title))
        .first();

    const authorByName = async (name: string) =>
      ctx.db
        .query("authors")
        .filter((q) => q.eq(q.field("name"), name))
        .first();

    const listByTitle = async (title: string) =>
      ctx.db
        .query("lists")
        .filter((q) => q.eq(q.field("title"), title))
        .first();

    const dune = await bookByTitle("Dune");
    const sifir = await bookByTitle("Sıfır Noktasındaki Kadın");
    const atomic = await bookByTitle("Atomic Habits");
    const simyaci = await bookByTitle("Simyacı");
    const frankHerbert = await authorByName("Frank Herbert");
    const jamesClear = await authorByName("James Clear");
    const designList = await listByTitle("Design");

    // ── Liste Yorumları ────────────────────────────────────────────
    const hasListComments = await ctx.db.query("listComments").first();
    if (!hasListComments && designList) {
      await ctx.db.insert("listComments", { listId: designList._id, authorId: cem._id, content: "Harika bir seçki, hepsini okumak istiyorum.", createdAt: now - 1000 * 60 * 60 * 6 });
      await ctx.db.insert("listComments", { listId: designList._id, authorId: nazan._id, content: "Design as Art gerçekten ufuk açıcı.", createdAt: now - 1000 * 60 * 60 * 3 });
    }

    // ── Puanlamalar ──────────────────────────────────────────────
    const hasRatings = await ctx.db.query("ratings").first();
    if (!hasRatings) {
      if (dune) {
        await ctx.db.insert("ratings", { userId: selcan._id, targetType: "book", targetId: dune._id, value: 5, createdAt: now - 1000 * 60 * 60 * 24 * 11 });
        await ctx.db.insert("ratings", { userId: metecan._id, targetType: "book", targetId: dune._id, value: 4, createdAt: now - 1000 * 60 * 60 * 24 * 9 });
      }
      if (sifir) await ctx.db.insert("ratings", { userId: cem._id, targetType: "book", targetId: sifir._id, value: 5, createdAt: now - 1000 * 60 * 60 * 24 * 4 });
      if (atomic) await ctx.db.insert("ratings", { userId: nazan._id, targetType: "book", targetId: atomic._id, value: 4, createdAt: now - 1000 * 60 * 60 * 24 * 7 });
      if (frankHerbert) await ctx.db.insert("ratings", { userId: selcan._id, targetType: "author", targetId: frankHerbert._id, value: 5, createdAt: now - 1000 * 60 * 60 * 24 * 11 });
      if (jamesClear) await ctx.db.insert("ratings", { userId: metecan._id, targetType: "author", targetId: jamesClear._id, value: 4, createdAt: now - 1000 * 60 * 60 * 24 * 30 });
    }

    // ── Rozetler ─────────────────────────────────────────────────
    const hasBadges = await ctx.db.query("userBadges").first();
    if (!hasBadges) {
      await ctx.db.insert("userBadges", { userId: selcan._id, badgeKey: "ilk_paylasim", earnedAt: now - 1000 * 60 * 60 * 24 * 30 });
      await ctx.db.insert("userBadges", { userId: selcan._id, badgeKey: "kitap_kurdu", earnedAt: now - 1000 * 60 * 60 * 24 * 12 });
      await ctx.db.insert("userBadges", { userId: cem._id, badgeKey: "ilk_paylasim", earnedAt: now - 1000 * 60 * 60 * 24 * 5 });
      await ctx.db.insert("userBadges", { userId: metecan._id, badgeKey: "aktif_okur", earnedAt: now - 1000 * 60 * 60 * 24 * 8 });
    }

    // ── İkinci kulüp ve arşiv ─────────────────────────────────────
    const existingClub = await ctx.db
      .query("clubs")
      .filter((q) => q.eq(q.field("name"), "Bilim Kurgu Kulübü"))
      .first();
    if (!existingClub && dune) {
      const club2 = await ctx.db.insert("clubs", {
        name: "Bilim Kurgu Kulübü",
        description: "Klasik ve modern bilim kurgu romanlarını birlikte keşfediyoruz.",
        bannerUrl: "",
        leaderId: selcan._id,
        privacyMode: "public",
        activeBookId: dune._id,
        createdAt: now - 1000 * 60 * 60 * 24 * 45,
      });
      await ctx.db.insert("clubMembers", { clubId: club2, userId: selcan._id, role: "leader", status: "active", joinedAt: now - 1000 * 60 * 60 * 24 * 45 });
      await ctx.db.insert("clubMembers", { clubId: club2, userId: metecan._id, role: "moderator", status: "active", joinedAt: now - 1000 * 60 * 60 * 24 * 40 });
      await ctx.db.insert("clubMembers", { clubId: club2, userId: cem._id, role: "member", status: "active", joinedAt: now - 1000 * 60 * 60 * 24 * 30 });
      if (simyaci) {
        await ctx.db.insert("clubArchive", { clubId: club2, bookId: simyaci._id, startedAt: now - 1000 * 60 * 60 * 24 * 60, finishedAt: now - 1000 * 60 * 60 * 24 * 46 });
      }
    }

    return "Ekstra seed tamamlandı.";
  },
});
