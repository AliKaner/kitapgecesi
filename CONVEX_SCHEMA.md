# Convex API ve Veritabanı Şeması Tasarımı

Bu doküman, **Kitapgecesi** platformunun Convex backend'i üzerinde koşacak olan veritabanı şemasını ve API uç noktalarını (Queries, Mutations, Actions) tüm parametreleri ve iş mantığı detaylarıyla birlikte listelemektedir.

---

## 1. Veritabanı Şeması (`convex/schema.ts`)

Convex, TypeScript tabanlı bir şema doğrulama sistemi (`v` validator'ları) kullanır. Tablolar, ilişkiler ve indeks yapıları aşağıdaki gibi kurgulanmıştır:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ----------------------------------------------------
  // KULLANICI VE HESAP YÖNETİMİ
  // ----------------------------------------------------
  users: defineTable({
    name: v.string(),
    username: v.string(), // Eşsiz kullanıcı adı (by_username indeksi)
    email: v.string(),
    profileImageUrl: v.string(),
    externalId: v.string(), // Clerk / Auth0 benzersiz ID'si
    xp: v.number(), // Toplam kazanılan tecrübe puanı (asla azalmaz)
    yaprak: v.number(), // Harcanabilir bakiye puanı
    level: v.number(), // Kullanıcı seviyesi (Math.floor(XP / 100) + 1)
    trustScore: v.number(), // Güven skoru (100 üzerinden başlar)
    invitedById: v.optional(v.id("users")), // Davet eden kullanıcının ID'si
    createdAt: v.number(),
  })
  .index("by_username", ["username"])
  .index("by_externalId", ["externalId"]),

  // ----------------------------------------------------
  // KİTAP KATALOĞU
  // ----------------------------------------------------
  books: defineTable({
    title: v.string(),
    author: v.string(),
    totalPages: v.number(),
    coverUrl: v.string(),
    isbn: v.optional(v.string()),
    isVerified: v.boolean(), // Resmi doğrulanmış kitap mı yoksa kullanıcı eklemesi mi (UGC)
    externalId: v.optional(v.string()), // Google Books / Open Library ID'si
    createdAt: v.number(),
  })
  .index("by_isbn", ["isbn"])
  .index("by_externalId", ["externalId"]),

  // ----------------------------------------------------
  // GÖNDERİLER (POSTLAR)
  // ----------------------------------------------------
  posts: defineTable({
    authorId: v.id("users"),
    type: v.union(
      v.literal("okuma"),       // "Bu kitabı bitirdim" veya "X sayfa okudum"
      v.literal("alinti"),      // Kitaptan alıntı paylaşımı
      v.literal("direkt"),      // Kitap dışı düz metin paylaşımı
      v.literal("kitap_alma"),  // "Bunları satın aldım" paylaşımı
      v.literal("repost"),      // Başka gönderiyi alıntılama
      v.literal("club_davet")   // Kulüp daveti paylaşımı
    ),
    content: v.optional(v.string()), // Düz metin veya alıntı metni içeriği
    mediaUrls: v.optional(v.array(v.string())), // Yüklenen görseller (1-4 adet fotoğraf)
    bookIds: v.optional(v.array(v.id("books"))), // Gönderiyle ilişkili kitaplar
    pageNumber: v.optional(v.number()), // Okuma / Alıntı için bulunulan sayfa no
    repostId: v.optional(v.id("posts")), // Repost ise asıl postun ID'si
    clubId: v.optional(v.id("clubs")), // Kulüp feed'ine atıldıysa kulüp ID'si
    isSilent: v.boolean(), // true ise sadece günlüğe işlenir, genel akışta gizlenir
    createdAt: v.number(),
  })
  .index("by_author", ["authorId"])
  .index("by_club", ["clubId"])
  .index("by_createdAt", ["createdAt"]),

  // Yorumlar
  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_post", ["postId"]),

  // Beğeniler (Likes)
  likes: defineTable({
    userId: v.id("users"),
    targetType: v.union(v.literal("post"), v.literal("comment"), v.literal("list")),
    targetId: v.string(), // Beğenilen post, comment veya list ID'si (dize olarak)
    createdAt: v.number(),
  })
  .index("by_user_target", ["userId", "targetType", "targetId"])
  .index("by_target", ["targetType", "targetId"]),

  // ----------------------------------------------------
  // PROFİL WIDGET/VITRIN SISTEMI
  // ----------------------------------------------------
  showcases: defineTable({
    userId: v.id("users"),
    widgetType: v.union(
      v.literal("target"),    // Yıllık okuma hedefi widget'ı
      v.literal("time"),      // Haftalık/aylık okuma süresi widget'ı
      v.literal("bookshelf"), // Kitaplık vitrini
      v.literal("favorites"), // En sevdiğim 3 kitap
      v.literal("author"),    // En sevdiğim yazar
      v.literal("quote"),     // En sevdiğim alıntı
      v.literal("list")       // Favori kitap listem
    ),
    order: v.number(), // Profilde yukarıdan aşağıya sıralama sırası
    isEnabled: v.boolean(), // Görünür mü / gizli mi?
    config: v.string(), // Widget'a özel dinamik ayarlar (JSON dizesi)
  }).index("by_user", ["userId"]),

  // ----------------------------------------------------
  // KİTAP KULÜPLERİ
  // ----------------------------------------------------
  clubs: defineTable({
    name: v.string(),
    description: v.string(),
    bannerUrl: v.string(),
    leaderId: v.id("users"),
    privacyMode: v.union(v.literal("public"), v.literal("restricted"), v.literal("private")),
    activeBookId: v.optional(v.id("books")), // Kulübün şu an aktif olarak okuduğu kitap
    createdAt: v.number(),
  }),

  clubMembers: defineTable({
    clubId: v.id("clubs"),
    userId: v.id("users"),
    role: v.union(v.literal("leader"), v.literal("moderator"), v.literal("member")),
    joinedAt: v.number(),
  })
  .index("by_club", ["clubId"])
  .index("by_user", ["userId"])
  .index("by_club_user", ["clubId", "userId"]),

  clubArchive: defineTable({
    clubId: v.id("clubs"),
    bookId: v.id("books"),
    startedAt: v.number(),
    finishedAt: v.number(),
  }).index("by_club", ["clubId"]),

  // ----------------------------------------------------
  // LİSTELER (Letterboxd Benzeri)
  // ----------------------------------------------------
  lists: defineTable({
    title: v.string(),
    description: v.string(),
    creatorId: v.id("users"),
    isPrivate: v.boolean(),
    isRanked: v.boolean(),
    clonedFromListId: v.optional(v.id("lists")), // Eğer başka listeden klonlandıysa asıl liste ID'si
    collaborators: v.array(v.id("users")), // Listeye kitap ekleme yetkisi olan ortak yazarlar
    createdAt: v.number(),
  }).index("by_creator", ["creatorId"]),

  listBooks: defineTable({
    listId: v.id("lists"),
    bookId: v.id("books"),
    order: v.number(),
  })
  .index("by_list", ["listId"])
  .index("by_list_book", ["listId", "bookId"]),

  // ----------------------------------------------------
  // SİSTEM / ENTEGRASYON
  // ----------------------------------------------------
  inviteCodes: defineTable({
    code: v.string(), // Eşsiz davetiye kodu
    creatorId: v.optional(v.id("users")), // Admin ise boş, üye ise oluşturan üye ID'si
    isInfinite: v.boolean(), // Admin kodları için sınırsız üyelik hakkı
    usedCount: v.number(),
    maxUses: v.number(), // Bu kodla en fazla kaç kişi kayıt olabilir
    isRevoked: v.boolean(), // İptal edilmiş mi?
    createdAt: v.number(),
  }).index("by_code", ["code"]),

  notifications: defineTable({
    userId: v.id("users"), // Alıcı
    senderId: v.id("users"), // Tetikleyen kişi
    type: v.union(
      v.literal("like"),
      v.literal("reply"),
      v.literal("repost"),
      v.literal("club_invite"),
      v.literal("level_up")
    ),
    targetPostId: v.optional(v.id("posts")),
    targetClubId: v.optional(v.id("clubs")),
    isRead: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
```

---

## 2. API Uç Noktaları (Convex Functions)

### A. Kullanıcı ve Profil İşlemleri (`convex/users.ts`)

#### 1. `getUserProfile` (Query)
*   **Açıklama:** Kullanıcı adı ile profil detaylarını getirir.
*   **Girdiler:** `{ username: v.string() }`
*   **İş Mantığı:** `users` tablosundan kullanıcıyı bulur. Profil ayarlarını ve davet edenin adını da resolve ederek döner.

#### 2. `createUser` (Mutation)
*   **Açıklama:** Yeni kullanıcı hesabı açar.
*   **Girdiler:** 
    ```typescript
    {
      name: v.string(),
      username: v.string(),
      email: v.string(),
      profileImageUrl: v.string(),
      externalId: v.string(),
      inviteCode: v.string()
    }
    ```
*   **İş Mantığı:**
    1. `username` benzersizliğini denetler.
    2. `inviteCode` doğruluğunu ve limitlerini (`isRevoked`, `maxUses` kontrolü) kontrol eder.
    3. Kodun `usedCount` değerini 1 artırır.
    4. Kullanıcıyı oluşturur (`xp: 0`, `yaprak: 100`, `level: 1`, `trustScore: 100`).
    5. Varsayılan 4 profil widget'ını (`target`, `favorites`, `bookshelf`, `quote`) aktif ve boş olarak `showcases` tablosuna ekler.

#### 3. `spendYaprak` (Mutation)
*   **Açıklama:** Kullanıcının bakiyesinden Yaprak düşürür (bağış vb. etkinlikler için).
*   **Girdiler:** `{ userId: v.id("users"), amount: v.number(), action: v.string() }`
*   **İş Mantığı:** Kullanıcı bakiyesini sorgular, yeterliyse `yaprak = yaprak - amount` yapar.

---

### B. Post Sistemi İşlemleri (`convex/posts.ts`)

#### 1. `getFeed` (Query)
*   **Açıklama:** Sosyal akış için sessiz olmayan postları listeler.
*   **Girdiler:** `{ limit: v.number(), cursor: v.union(v.string(), v.null()) }`
*   **İş Mantığı:** `isSilent: false` olan postları `createdAt` azalan sırasında getirir. Yazar nesnesini, ilişkili kitapları, beğeni ve yorum sayılarını birleştirerek döndürür.

#### 2. `createPost` (Mutation)
*   **Açıklama:** Yeni bir post paylaşır.
*   **Girdiler:**
    ```typescript
    {
      authorId: v.id("users"),
      type: v.string(), // "okuma", "alinti", "direkt", "kitap_alma", "repost", "club_davet"
      content: v.optional(v.string()),
      mediaUrls: v.optional(v.array(v.string())),
      bookIds: v.optional(v.array(v.id("books"))),
      pageNumber: v.optional(v.number()),
      repostId: v.optional(v.id("posts")),
      clubId: v.optional(v.id("clubs")),
      isSilent: v.boolean()
    }
    ```
*   **İş Mantığı:**
    1. Gönderiyi `posts` tablosuna yazar.
    2. Eğer post `isSilent: false` ise, kullanıcının son 24 saatte paylaştığı sessiz olmayan gönderi sayısına bakar.
    3. Günlük sınır aşılmadıysa (post sayısı <= 3), kullanıcıya 10 XP ve 5 Yaprak verir.
    4. Kazanılan XP sonrası `level` artışı olduysa kullanıcıya otomatik `level_up` bildirimi gönderir.

#### 3. `likeTarget` (Mutation)
*   **Açıklama:** Post, yorum veya listeyi beğenir ya da beğeniyi kaldırır.
*   **Girdiler:** `{ userId: v.id("users"), targetType: "post" | "comment" | "list", targetId: v.string() }`
*   **İş Mantığı:**
    1. Beğeni zaten varsa kaydı siler.
    2. Beğeni yoksa kaydı oluşturur.
    3. Eğer beğeni `post` tipindeyse ve beğenen kişi post sahibi değilse:
       - Beğenilen post sahibine 1 XP kazandırır (Günlük limit: 50 beğeni XP'si).
       - Post sahibine beğeni bildirimi (`notifications`) gönderir.

#### 4. `deletePost` (Mutation)
*   **Açıklama:** Postu ve ilişkili tüm alt verileri siler (Cascade delete).
*   **Girdiler:** `{ userId: v.id("users"), postId: v.id("posts") }`
*   **İş Mantığı:** Post sahibinin silme yetkisi kontrol edilir. Post silinirken ona ait yorumlar (`comments`) ve beğeniler (`likes`) de temizlenir.

---

### C. Profil Vitrin İşlemleri (`convex/showcases.ts`)

#### 1. `getUserShowcases` (Query)
*   **Açıklama:** Kullanıcının aktif olan profil vitrinlerini sırasıyla döner.
*   **Girdiler:** `{ userId: v.id("users") }`
*   **İş Mantığı:** İlgili kullanıcının `isEnabled: true` olan vitrinlerini `order` alanına göre sıralayarak döner.

#### 2. `updateShowcaseLayout` (Mutation)
*   **Açıklama:** Profil ayarlarından vitrinlerin sırasını, aktiflik durumunu ve içeriğini tek seferde günceller.
*   **Girdiler:**
    ```typescript
    {
      userId: v.id("users"),
      layouts: v.array(v.object({
        id: v.id("showcases"),
        order: v.number(),
        isEnabled: v.boolean(),
        config: v.string() // JSON dizesi olarak güncellenen veri (örn: favori kitap ID listesi)
      }))
    }
    ```
*   **İş Mantığı:** Gönderilen dizideki her bir vitrin kaydını bulup `order`, `isEnabled` ve `config` alanlarını topluca günceller.

---

### D. Kitap Kataloğu İşlemleri (`convex/books.ts`)

#### 1. `searchLocalBooks` (Query)
*   **Açıklama:** Yerel veri tabanındaki kitaplarda arama yapar.
*   **Girdiler:** `{ query: v.string() }`
*   **İş Mantığı:** Kitap adı (`title`) ve yazar (`author`) alanlarında case-insensitive arama yapar.

#### 2. `searchExternalBooks` (Action)
*   **Açıklama:** Dış API'ler üzerinden kitap sorgulaması yapar (Google Books API).
*   **Girdiler:** `{ query: v.string() }`
*   **İş Mantığı:** HTTP Action kullanarak Google Books / Open Library API'lerine istek atar ve JSON sonuç döner.

#### 3. `importOrGetBook` (Mutation)
*   **Açıklama:** Arama sonuçlarından seçilen bir kitabı yerel veri tabanına işler.
*   **Girdiler:**
    ```typescript
    {
      title: v.string(),
      author: v.string(),
      totalPages: v.number(),
      coverUrl: v.string(),
      externalId: v.optional(v.string()),
      isbn: v.optional(v.string())
    }
    ```
*   **İş Mantığı:** `externalId` veya `isbn` ile kitap yerelde zaten varsa mevcut kaydı döner. Yoksa `isVerified: true` olarak kaydeder.

#### 4. `createUGCBook` (Mutation)
*   **Açıklama:** Kullanıcı tarafından el yordamıyla eklenen kitap kaydı oluşturur.
*   **Girdiler:** `{ title: v.string(), author: v.string(), totalPages: v.number(), coverUrl: v.string() }`
*   **İş Mantığı:** Kitabı `isVerified: false` (Doğrulanmamış) etiketiyle ekler.

---

### E. Kitap Kulübü İşlemleri (`convex/clubs.ts`)

#### 1. `createClub` (Mutation)
*   **Açıklama:** Yeni bir kitap kulübü açar.
*   **Girdiler:** `{ name: v.string(), description: v.string(), bannerUrl: v.string(), privacyMode: "public" | "restricted" | "private", leaderId: v.id("users") }`
*   **İş Mantığı:** Kulüp oluşturulur. Kurucu üye `clubMembers` tablosuna `role: "leader"` olarak eklenir.

#### 2. `manageMembership` (Mutation)
*   **Açıklama:** Kulübe katılma, ayrılma veya üye çıkarma işlemlerini yürütür.
*   **Girdiler:** `{ clubId: v.id("clubs"), userId: v.id("users"), action: "join" | "leave" | "approve" | "kick" }`
*   **İş Mantığı:**
    - `join`: Kulüp `public` ise doğrudan üye yapar. `restricted` ise onay bekleyen istek oluşturur.
    - `approve` ve `kick`: Sadece lider veya moderatörler yetkilidir.

#### 3. `archiveClubBook` (Mutation)
*   **Açıklama:** Kulübün aktif kitabını bitirip arşive gönderir.
*   **Girdiler:** `{ clubId: v.id("clubs"), bookId: v.id("books"), startedAt: v.number(), finishedAt: v.number() }`
*   **İş Mantığı:** Kitabı `clubArchive` tablosuna kaydeder. `clubs` tablosundaki `activeBookId` değerini boşaltır.

---

### F. Listeler İşlemleri (`convex/lists.ts`)

#### 1. `createList` (Mutation)
*   **Açıklama:** Yeni bir kitap listesi oluşturur.
*   **Girdiler:** `{ title: v.string(), description: v.string(), creatorId: v.id("users"), isPrivate: v.boolean(), isRanked: v.boolean(), bookIds: v.array(v.id("books")) }`
*   **İş Mantığı:** `lists` kaydını açar. Gönderilen kitapları sırasıyla `order` vererek `listBooks` tablosuna bağlar.

#### 2. `cloneList` (Mutation)
*   **Açıklama:** Mevcut bir listeyi başka bir kullanıcı adına klonlar.
*   **Girdiler:** `{ listId: v.id("lists"), userId: v.id("users") }`
*   **İş Mantığı:** Hedef listenin tüm bilgilerini çeker. `clonedFromListId: listId` referansıyla yeni liste açar ve içindeki tüm kitapları kopyalar.

---

### G. Davetler ve Güven Skoru İşlemleri (`convex/invites.ts`)

#### 1. `generateInviteCode` (Mutation)
*   **Açıklama:** Üyenin davetiye kodu oluşturmasını sağlar.
*   **Girdiler:** `{ userId: v.id("users") }`
*   **İş Mantığı:**
    1. Kullanıcının güven skoru (`trustScore`) 50'nin altındaysa kod üretimi engellenir.
    2. Kullanıcı seviyesine göre davet kodu kotası denetlenir (Seviye 1: 2 kod, Seviye 5: 10 kod vb.). Limit aşılmadıysa rastgele eşsiz kod üretilip kaydedilir.

#### 2. `handleUserBan` (Mutation - Admin)
*   **Açıklama:** Kurallara uymayan bir kullanıcıyı uzaklaştırır ve referans zincirini cezalandırır.
*   **Girdiler:** `{ bannedUserId: v.id("users") }`
*   **İş Mantığı:**
    1. Kullanıcıyı pasife çeker/banlar.
    2. Kullanıcının `invitedById` alanına bakar. Onu davet eden kişi mevcutsa, davet edenin `trustScore` değerini 20 puan düşürür.
