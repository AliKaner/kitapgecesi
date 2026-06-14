import tr from "./tr";

const en: Record<keyof typeof tr, string> = {
  // General
  "common.loading": "Loading...",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.share": "Share",
  "common.search": "Search",
  "common.follow": "Follow",
  "common.following": "Following",
  "common.unfollow": "Unfollow",

  // Sidebar / Navigation
  "nav.anasayfa": "Home",
  "nav.kitaplar": "Books",
  "nav.yazarlar": "Authors",
  "nav.listeler": "Lists",
  "nav.kulupler": "Clubs",
  "nav.okumaListesi": "Reading List",
  "nav.bildirimler": "Notifications",
  "nav.profil": "Profile",
  "nav.bagis": "Donate",
  "nav.ayarlar": "Settings",
  "nav.yeniGonderi": "New Post",
  "nav.language": "Language",

  // Settings
  "ayarlar.title": "Settings",
  "ayarlar.tab.genel": "General",
  "ayarlar.tab.tema": "Theme",
  "ayarlar.tab.profil": "Profile",
  "ayarlar.bildirimler.label": "Notifications",
  "ayarlar.bildirimler.hint": "Get notified about new interactions",
  "ayarlar.epostaBildirimleri.label": "Email Notifications",
  "ayarlar.epostaBildirimleri.hint": "Receive weekly summary emails",
  "ayarlar.gizliHesap.label": "Private Account",
  "ayarlar.gizliHesap.hint": "Only your followers can see your profile",
  "ayarlar.okumaHatirlaticilari.label": "Reading Reminders",
  "ayarlar.okumaHatirlaticilari.hint": "Reminders for your daily reading goal",
  "ayarlar.cikisYap": "Log Out",
  "ayarlar.vurguRengi": "Accent Color",
  "ayarlar.koyuMod.label": "Dark Mode",
  "ayarlar.koyuMod.hint": "Use the dark theme",
  "ayarlar.adSoyad": "Full Name",
  "ayarlar.kullaniciAdi": "Username",
  "ayarlar.eposta": "Email",
  "ayarlar.davetKodu": "Invite Code",
  "ayarlar.davetKodu.placeholder": "Your invite code",
  "ayarlar.davetKodu.hint": "Invite your friends to KitapGecesi.",

  // Composer (home / club)
  "composer.placeholder": "What are you reading?",
  "composer.tab.bookLog": "Book Log",
  "composer.tab.quote": "Quote",
  "composer.tab.bookTrade": "Book Exchange",

  // Books page
  "kitaplar.tab.turler": "Genres",
  "kitaplar.tab.konular": "Topics",
  "kitaplar.sort.yeni": "Newest",
  "kitaplar.sort.puan": "Most Liked",
  "kitaplar.sort.alfabetik": "A-Z",
  "kitaplar.mostRead": "Most Read",
  "kitaplar.mostLiked": "Most Liked Books",

  // Post interactions
  "post.views": "{count} views",
  "post.commentPlaceholder": "Write a comment...",
  "post.send": "Send",
  "post.noComments": "No comments yet.",
  "post.edit": "Edit",
  "post.delete": "Delete",
  "post.deleteConfirm": "Are you sure you want to delete this post?",
  "post.editPlaceholder": "Edit your post...",
};

export default en;
