import type { MetadataRoute } from "next";

const SITE_URL = "https://www.kitapgecesi.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/onkayit`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/giris`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/kayit`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
