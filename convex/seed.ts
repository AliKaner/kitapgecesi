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

    await list("Design", "Tasarım üzerine sevdiğim kitaplar.", [designBooks, designArt, everyday, atomic]);
    await list("Yeniler", "Son okuduklarım.", [dune, simyaci, bodyScore, beyin]);
    await list("Psikoloji", "Zihin ve davranış üzerine.", [bodyScore, beyin, seninle]);
    await list("İlham", "Beni besleyen kitaplar.", [creativeAct, atomic, simyaci, designArt]);

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
