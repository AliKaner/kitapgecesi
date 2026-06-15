"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, usePaginatedQuery } from "convex/react";
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
  const [search, setSearch] = useState("");
  const trimmedSearch = search.trim();

  const { results, status, loadMore } = usePaginatedQuery(
    api.authors.listAuthorsPage,
    trimmedSearch ? "skip" : {},
    { initialNumItems: PAGE_SIZE }
  );
  const searchResults = useQuery(api.authors.searchAuthors, trimmedSearch ? { query: trimmedSearch } : "skip");

  const list = trimmedSearch ? searchResults ?? [] : results;
  const loaded = trimmedSearch ? searchResults != null : status !== "LoadingFirstPage";

  return (
    <>
      <ScreenTitle>{t("nav.yazarlar")}</ScreenTitle>
      <CompactFilter
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("yazarlar.searchPlaceholder")}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
        {list.map((a) => (
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
      {list.length === 0 && loaded && (
        <p style={{ color: "var(--text-secondary)", marginTop: 18 }}>{t("yazarlar.empty")}</p>
      )}
      {!trimmedSearch && status === "CanLoadMore" && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
          <Button variant="menu" onClick={() => loadMore(PAGE_SIZE)}>
            {t("kitaplar.showMore")}
          </Button>
        </div>
      )}
    </>
  );
}
