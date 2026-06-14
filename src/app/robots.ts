import type { MetadataRoute } from "next";

const SITE_URL = "https://www.kitapgecesi.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/giris", "/kayit", "/onkayit"],
      disallow: ["/ayarlar", "/bildirimler", "/profil"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
