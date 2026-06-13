import type { IconName } from "@/components/ui/Icon";

export const BADGE_DEFS: { key: string; name: string; description: string; icon: IconName; threshold: number }[] = [
  { key: "ilk_paylasim", name: "İlk Adım", description: "İlk gönderini paylaştın.", icon: "pencil", threshold: 1 },
  { key: "aktif_okur", name: "Aktif Okur", description: "10 gönderi paylaştın.", icon: "book", threshold: 10 },
  { key: "begeni_toplayici", name: "Beğeni Toplayıcı", description: "Gönderilerin toplam 50 beğeni aldı.", icon: "heart", threshold: 50 },
  { key: "bagisci", name: "Bağışçı", description: "İlk bağışını yaptın.", icon: "gift", threshold: 1 },
  { key: "kitap_kurdu", name: "Kitap Kurdu", description: "10 kitap okudun.", icon: "library", threshold: 10 },
  { key: "yildiz", name: "Yıldız", description: "10 takipçiye ulaştın.", icon: "user", threshold: 10 },
];
