"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ScreenTitle } from "@/components/layout/Screen";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { StarRating } from "@/components/ui/StarRating";
import { useT } from "@/lib/i18n/I18nProvider";

export default function YazarlarPage() {
  const router = useRouter();
  const { t } = useT();
  const authors = useQuery(api.authors.listAuthors, {});

  return (
    <>
      <ScreenTitle>{t("nav.yazarlar")}</ScreenTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {authors?.map((a) => (
            <Card key={a._id} padding={16} style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 10, alignItems: "center", textAlign: "center" }} onClick={() => router.push(`/yazar/${a._id}`)}>
              <Avatar src={a.photoUrl} name={a.name} size="lg" />
              <div>
                <div style={{ fontSize: "var(--fs-body-1)", fontWeight: "var(--fw-semibold)" as unknown as number }}>{a.name}</div>
                <div style={{ fontSize: "var(--fs-body-3)", color: "var(--text-secondary)", marginTop: 2 }}>{a.bookCount} kitap</div>
              </div>
              {a.ratingCount > 0 && <StarRating value={a.avgRating} count={a.ratingCount} />}
            </Card>
          ))}
        </div>
    </>
  );
}
