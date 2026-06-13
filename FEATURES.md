# Kitapgecesi — Feature Planning

## 1. Post Sistemi (Twitter benzeri)

### Post Tipleri
| Tip | Açıklama | Aktiviteye Düşer mi? |
|-----|----------|----------------------|
| **Okuma postu** | "Bu kitabı bitirdim" veya "X sayfasını okudum" (yüzdelik ilerleme otomatik hesaplanır) | Evet — okuma aktivitesi |
| **Alıntı postu** | Kitabın belirli sayfasından alıntı — görünüm seçilebilir | Hayır (sadece sosyal) |
| **Direkt post** | Düz metin (280 karakter sınırı), kitapla ilgili olmak zorunda değil | Hayır |
| **Kitap alma postu** | "Bunları aldım" — veri tabanından aratılıp eklenen kitaplar + 1-4 adet arası isteğe bağlı fotoğraflarla | Evet — satın alma aktivitesi |
| **RT postu** | Başkasının veya kendi postunun üstüne ekstra yazı (quote tweet) | Hayır |
| **Kulüp davet postu** | Bir kitap kulübüne davet | Hayır |

### Alıntı Postu Detayı
- Kullanıcı alıntı metnini + kitabı seçer, sayfa numarası girer
- Sistem kitap verisini çeker (kapak, yazar, vb.)
- Görünüm tipi seçilebilir:
  - **Cover arka plan** — kitabın kapağından türetilen arka plan
  - **Özel arka plan** — kullanıcı seçer
  - **Düz** — sade görünüm
- Her görünümde altta kitap bilgileri (isim, yazar) gösterilir.
- **Sosyal Paylaşım Kartı:** Post altında "Görsel Olarak Paylaş" seçeneği ile Instagram Story / Twitter uyumlu estetik PNG çıktısı üretilebilir.

### Kitap Alma Postu Detayı
- Kullanıcı satın aldığı kitapları kütüphaneden/API'den tek tek aratıp postuna ekleyebilir.
- İsteğe bağlı olarak 1-4 adet arası fiziksel fotoğraf yüklenebilir.
- Görsel yüklenmezse sistem seçilen kitapların kapaklarından otomatik estetik bir kolaj oluşturur.

### Ortak Özellikler
- Yorum, like, repost (tüm tipler için)
- Post paylaşırken hem profile hem kulübe gönderilebilir.

---

## 2. Profil Showcase (Steam benzeri)
- Kullanıcı profil ayarlarından hangi widget'ların render edilip edilmeyeceğini (aktif/pasif) kontrol edebilir.
- Sürükle-bırak (drag-and-drop) ile widget'ların profil üzerindeki sıralaması düzenlenebilir.
- Seviyeye göre slot kilidi: Başlangıçta 2 aktif slot, XP seviyesi arttıkça maksimum 6 aktif slot.

### Widget Tipleri
- **Dinamik (Otomatik):**
  - Bu yılın okuma hedefi (ilerleme barı)
  - Haftalık okuma süresi/grafiği
- **Statik (Kullanıcı Seçimi):**
  - Kitaplık (Vitrin)
  - En sevdiğim 3 kitap
  - En sevdiğim yazar
  - En sevdiğim alıntı
  - En sevdiğim kitap listesi

---

## 3. Listeler (Letterboxd benzeri)
- Kitap listesi veya yazar listesi
- Public / private modları
- Sıralı / sırasız listeler
- Paylaşılabilir, likelanabilir, yorum yapılabilir.
- **Ortak Listeler (Collaboration):** Liste sahibi arkadaşlarını listeye düzenleyici olarak davet edebilir.
- **Klonlama:** Başka kullanıcının listesi klonlandığında "X listesinden klonlandı/esinlenildi" referans linki otomatik eklenir.

---

## 4. Okuma Günlüğü & Aktivite Geçmişi
- Günlük: hangi kitap, hangi sayfa
- Haftalık: kitaplar yan yana
- Aylık: toplu veri
- Yıllık: toplu veri
- **Sessiz Güncelleme (Gizlilik):** Kullanıcı okuma durumu girerken "Sadece günlüğüme kaydet (Akışta gizle)" seçeneğini seçebilir. Böylece ana feed kirletilmeden günlüğe kayıt girilebilir.
- **Otomatik Türetim ve Veri Bütünlüğü:** Aktivite kaydı postlardan otomatik türetilir. Post silindiğinde ilişkili günlük ve aktivite kaydı da otomatik silinir.

---

## 5. Kitap Verisi
- **Hibrit Veri Modeli:** Google Books ve Open Library API ana kaynak olarak kullanılır.
- **Kullanıcı Katkısı (UGC):** Kitap bulunamazsa kullanıcı kitap adı, yazar, sayfa sayısı ve kapak resmiyle geçici kayıt açabilir. Bu kayıtlar aramalarda "Doğrulanmamış" etiketiyle listelenir, admin onayından sonra kalıcı kütüphaneye eklenir.

---

## 6. Kitap Kulübü
- Kulüp kurulabilir (banner, isim vb.)
- Her kulübün kendi akışı/feed'i var.
- Post paylaşırken hem profile hem kulübe aynı anda gönderilebilir.
- Kulübe davet postu paylaşılabilir.
- Kulüp lideri ayın/haftanın kitabını seçebilir VEYA oylama açabilir (birkaç kitap arasında).
- **Gizlilik Modları:** Public (herkese açık), Restricted (akış açık, üyelik lider onaylı), Private (akış ve katılım davetiyeyle gizli).
- **Roller & Moderasyon:** Kulüp büyüdüğünde lider üyeler arasından moderatörler atayabilir. Moderatörler üye onaylama/çıkarma ve uygunsuz gönderileri silme yetkisine sahiptir.
- **Kulüp Arşivi:** Kulübün geçmişte okuduğu kitaplar ve bu kitaplara özel kulüp içi tartışmalar "Geçmiş Okumalar" sekmesinde arşivlenir.

---

## 7. Puan & Bağış Sistemi
- **XP (Tecrübe Puanı):** Paylaşımlardan ve alınan beğenilerden kazanılır. Asla azalmaz, kullanıcının seviyesini ve davet kod kotasını belirler.
- **Yaprak / Bakiye:** Harcandıkça azalan para birimidir. Bağış ekranında ağaç dikme vb. sosyal sorumluluk projeleri için harcanır.
- **Spam Engeli (Daily Cap):** Günlük puan kazanımı sınırlıdır (örn: günde en fazla 3 post ve 50 like'tan puan alınabilir, kendi postunu beğenmek puan vermez).
- Bağış ekranı ayrı bir sayfa olacak.

---

## 8. Kayıt Sistemi
- Sadece davet koduyla kayıt — açık kayıt yok.
- Davet kodu kotası kullanıcının **XP seviyesine** bağlıdır:
  - Başlangıç: 2 kod
  - Maksimum (en yüksek seviye): sınırsız
  - Aralık: 2 → 10 → sınırsız (seviyeye göre kademeli)
- Admin: sınırsız kod
- Kod tipleri:
  - **Tek kullanımlık** — normal kullanıcıların ürettiği kodlar
  - **Sonsuz** — sadece admin kodları
- **Güven Zinciri (Trust Chain):** Davet edilen bir kullanıcı spam/trol nedeniyle banlanırsa, davet eden kişinin güven skoru düşer ve yeni kod üretmesi dondurulur.
- **Bekleme Listesi (Waitlist):** Giriş sayfasında davet kodu olmayanlar için başvuru formu bulunur.

---

## 9. Bildirimler (Notifications)
- Likes, replies, mentions, reposts.
- Kulüp davetleri ve kulüp içi anket/kitap duyuruları.
- Seviye atlama (Level Up) ve güven skoru değişim bildirimleri.

---

## 10. Ayarlar
- Dark / Light mode seçeneği.
- Profil, liste ve aktivite gizlilik ayarları (Herkes, Sadece Takipçiler, Gizli).
- Hesap silme ve veri dışa aktarma (Data export) seçenekleri.
