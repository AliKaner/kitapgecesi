import type { IconName } from "@/components/ui/Icon";

/** A countable user statistic a badge can be earned from. */
export type BadgeMetric =
  | "posts"
  | "likes"
  | "books"
  | "followers"
  | "following"
  | "donations"
  | "lists"
  | "journal"
  | "clubs";

export interface BadgeDef {
  key: string;
  name: string;
  description: string;
  icon: IconName;
  metric: BadgeMetric;
  threshold: number;
}

/* The original flagship badges — keys are kept stable so already-earned
   userBadges keep matching after the catalog grew. */
const FLAGSHIP: BadgeDef[] = [
  { key: "ilk_paylasim", name: "İlk Adım", description: "İlk gönderini paylaştın.", icon: "pencil", metric: "posts", threshold: 1 },
  { key: "aktif_okur", name: "Aktif Okur", description: "10 gönderi paylaştın.", icon: "book", metric: "posts", threshold: 10 },
  { key: "begeni_toplayici", name: "Beğeni Toplayıcı", description: "Gönderilerin toplam 50 beğeni aldı.", icon: "heart", metric: "likes", threshold: 50 },
  { key: "bagisci", name: "Bağışçı", description: "İlk bağışını yaptın.", icon: "gift", metric: "donations", threshold: 1 },
  { key: "kitap_kurdu", name: "Kitap Kurdu", description: "10 kitap okudun.", icon: "library", metric: "books", threshold: 10 },
  { key: "yildiz", name: "Yıldız", description: "10 takipçiye ulaştın.", icon: "user", metric: "followers", threshold: 10 },
];

/* Tier adjectives, applied in order as a metric's badges grow harder. */
const TIERS = [
  "Çaylak", "Acemi", "Hevesli", "Çırak", "Kalfa", "Usta", "Uzman", "Kıdemli",
  "Veteran", "Üstat", "Efsane", "Kahraman", "Şampiyon", "Bilge", "Ulu",
  "Efsanevi", "Destansı", "Mitik", "İlahi", "Ölümsüz",
];

/* "Nice" rising thresholds; each metric slices a window of these. */
const NICE = [1, 2, 3, 5, 10, 15, 25, 50, 75, 100, 150, 250, 500, 750, 1000, 1500, 2500, 5000, 7500, 10000];

interface MetricPlan {
  metric: BadgeMetric;
  noun: string;
  icon: IconName;
  unit: string; // for the description, e.g. "gönderi"
  offset: number; // start index into NICE
  count: number; // number of tiers
}

const PLANS: MetricPlan[] = [
  { metric: "posts", noun: "Yazar", icon: "pencil", unit: "gönderi paylaştın", offset: 3, count: 15 },
  { metric: "likes", noun: "Gözde", icon: "heart", unit: "beğeni topladın", offset: 4, count: 15 },
  { metric: "books", noun: "Okur", icon: "book", unit: "kitap okudun", offset: 3, count: 15 },
  { metric: "followers", noun: "Fenomen", icon: "star", unit: "takipçiye ulaştın", offset: 3, count: 15 },
  { metric: "following", noun: "Kâşif", icon: "user", unit: "kişiyi takip ettin", offset: 3, count: 10 },
  { metric: "donations", noun: "Hayırsever", icon: "gift", unit: "bağış yaptın", offset: 2, count: 10 },
  { metric: "journal", noun: "Günlükçü", icon: "feather", unit: "günlük girdisi yazdın", offset: 0, count: 10 },
  { metric: "lists", noun: "Küratör", icon: "list", unit: "liste oluşturdun", offset: 0, count: 8 },
  { metric: "clubs", noun: "Kulüpçü", icon: "crown", unit: "kulübe katıldın", offset: 0, count: 8 },
];

function buildTiers(): BadgeDef[] {
  const out: BadgeDef[] = [];
  for (const plan of PLANS) {
    for (let i = 0; i < plan.count; i++) {
      const threshold = NICE[plan.offset + i];
      if (threshold === undefined) break;
      out.push({
        key: `${plan.metric}_${threshold}`,
        name: `${TIERS[i]} ${plan.noun}`,
        description: `${threshold} ${plan.unit}.`,
        icon: plan.icon,
        metric: plan.metric,
        threshold,
      });
    }
  }
  return out;
}

export const BADGE_DEFS: BadgeDef[] = [...FLAGSHIP, ...buildTiers()];
