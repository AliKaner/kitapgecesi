"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ScreenTitle } from "@/components/layout/Screen";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CompactFilter } from "@/components/ui/CompactFilter";
import { StarRating } from "@/components/ui/StarRating";
import { useT } from "@/lib/i18n/I18nProvider";

const PAGE_SIZE = 20;

export default function YazarlarPage() {
  const router = useRouter();
  const { t } = useT();
  const authors = useQuery(api.authors.listAuthors, {});
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("alfabetik");

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr");
    const list = q ? (authors ?? []).filter((a) => a.name.toLocaleLowerCase("tr").includes(q)) : [...(authors ?? [])];
    if (sort === "kitap") {
      list.sort((a, b) => b.bookCount - a.bookCount);
    } else if (sort === "puan") {
      list.sort((a, b) => b.avgRating - a.avgRating || b.ratingCount - a.ratingCount);
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name, "tr"));
    }
    return list;
  }, [authors, search, sort]);

  const filterKey = `${sort}:${search.trim().toLocaleLowerCase("tr")}`;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(PAGE_SIZE);
  }

  const visible = filtered.slice(0, visibleCount);

  return (
    <>
      <ScreenTitle>{t("nav.yazarlar")}</ScreenTitle>
      <CompactFilter
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("yazarlar.searchPlaceholder")}
        selects={[
          {
            value: sort,
            onChange: setSort,
            icon: "list",
            ariaLabel: t("yazarlar.sort.alfabetik"),
            options: [
              { value: "alfabetik", label: t("yazarlar.sort.alfabetik") },
              { value: "kitap", label: t("yazarlar.sort.kitap") },
              { value: "puan", label: t("yazarlar.sort.puan") },
            ],
          },
        ]}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
        {visible.map((a) => (
          <Card key={a._id} padding={16} style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 10, alignItems: "center", textAlign: "center" }} onClick={() => router.push(`/yazar/${a._id}`)}>
            <Avatar src={a.photoUrl} name={a.name} size="lg" />
            <div>
              <div style={{ fontSize: "var(--fs-body-1)", fontWeight: "var(--fw-semibold)" as unknown as number }}>{a.name}</div>
              <div style={{ fontSize: "var(--fs-body-3)", color: "var(--text-secondary)", marginTop: 2 }}>{t("yazarlar.bookCount", { count: a.bookCount })}</div>
            </div>
            {a.ratingCount > 0 && <StarRating value={a.avgRating} count={a.ratingCount} />}
          </Card>
        ))}
      </div>
      {filtered.length === 0 && authors != null && (
        <p style={{ color: "var(--text-secondary)", marginTop: 18 }}>{t("yazarlar.empty")}</p>
      )}
      {visibleCount < filtered.length && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
          <Button variant="menu" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
            {t("kitaplar.showMore")}
          </Button>
        </div>
      )}
    </>
  );
}
