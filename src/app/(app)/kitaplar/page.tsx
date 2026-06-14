"use client";

import { CSSProperties, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ScreenTitle, SectionHead } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Tabs } from "@/components/ui/Tabs";
import { Tag } from "@/components/ui/Tag";
import { BookCard } from "@/components/book/BookCard";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

const PAGE_SIZE_ALL = 20;
const PAGE_SIZE_FILTERED = 40;

const GENRES = ["Edebiyat", "Roman", "Psikoloji", "Duygu ve Düşünce", "Felsefe", "Tarih", "Bilim", "Tasavvuf", "Sanat", "Kişisel Gelişim"];

interface BookWithRating {
  _id: string;
  title: string;
  author: string;
  coverUrl: string;
  genres?: string[];
  createdAt: number;
  releaseYear?: number;
  viewCount?: number;
  avgRating: number;
  ratingCount: number;
}

const COVER_WIDTH = 124;
const COVER_HEIGHT = COVER_WIDTH * 1.5;

function BookRail({ items, readIds, onOpen }: { items: BookWithRating[]; readIds: Set<string>; onOpen: (id: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, ${COVER_WIDTH}px)`, gap: "22px 12px" }}>
      {items.map((b) => (
        <div key={b._id} style={{ position: "relative" }}>
          <BookCard
            cover={b.coverUrl || undefined}
            title={b.title}
            author={b.author}
            rating={b.ratingCount > 0 ? b.avgRating : undefined}
            width={COVER_WIDTH}
            onClick={() => onOpen(b._id)}
          />
          {readIds.has(b._id) && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: COVER_WIDTH,
                height: COVER_HEIGHT,
                borderRadius: "var(--radius-sm)",
                background: "rgba(20,20,20,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              } as CSSProperties}
            >
              <Icon name="check" size={28} color="#fff" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function KitaplarPage() {
  const { t } = useT();
  const [sort, setSort] = useState("yeni");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [hideRead, setHideRead] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { user } = useAuth();
  const books = useQuery(api.books.listBooksWithRatings, {});
  const library = useQuery(api.library.getUserLibrary, user ? { userId: user._id, status: "read" } : "skip");

  const readIds = useMemo(() => new Set((library ?? []).map((e) => e.bookId)), [library]);

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const b of books ?? []) {
      if (b.releaseYear) set.add(b.releaseYear);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [books]);

  const filtered = useMemo(() => {
    let list = books ?? [];
    const q = search.trim().toLocaleLowerCase("tr");
    if (q) {
      list = list.filter((b) => b.title.toLocaleLowerCase("tr").includes(q) || b.author.toLocaleLowerCase("tr").includes(q));
    }
    if (selectedGenres.length > 0) {
      list = list.filter((b) => b.genres?.some((g) => selectedGenres.includes(g)));
    }
    if (selectedYear != null) {
      list = list.filter((b) => b.releaseYear === selectedYear);
    }
    if (hideRead) {
      list = list.filter((b) => !readIds.has(b._id));
    }
    list = [...list];
    if (sort === "alfabetik") {
      list.sort((a, b) => a.title.localeCompare(b.title, "tr"));
    } else if (sort === "puan") {
      list.sort((a, b) => b.avgRating - a.avgRating || b.ratingCount - a.ratingCount);
    } else if (sort === "populer") {
      list.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
    } else {
      list.sort((a, b) => b.createdAt - a.createdAt);
    }
    return list;
  }, [books, selectedGenres, selectedYear, hideRead, readIds, sort, search]);

  const popular = filtered.slice(0, 4);
  const rest = filtered.slice(4);

  const pageSize = selectedGenres.length > 0 || selectedYear != null || search.trim() ? PAGE_SIZE_FILTERED : PAGE_SIZE_ALL;
  const filterKey = `${sort}:${selectedGenres.join(",")}:${selectedYear ?? ""}:${hideRead}:${search.trim().toLocaleLowerCase("tr")}`;
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(pageSize);
  }

  const visibleRest = rest.slice(0, visibleCount);

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  return (
    <>
      <ScreenTitle>{t("nav.kitaplar")}</ScreenTitle>
        <div style={{ marginBottom: 18, maxWidth: 360 }}>
          <Input
            icon="search"
            pill
            placeholder={t("kitaplar.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 12 }}>
          {GENRES.map((g) => (
            <Tag key={g} tone={selectedGenres.includes(g) ? "tint" : "default"} onClick={() => toggleGenre(g)} style={{ cursor: "pointer" }}>
              {g}
            </Tag>
          ))}
        </div>
        {years.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 12 }}>
            {years.map((y) => (
              <Tag
                key={y}
                tone={selectedYear === y ? "tint" : "default"}
                onClick={() => setSelectedYear((prev) => (prev === y ? null : y))}
                style={{ cursor: "pointer" }}
              >
                {y}
              </Tag>
            ))}
          </div>
        )}
        {(selectedGenres.length > 0 || selectedYear != null) && (
          <div style={{ marginBottom: 12 }}>
            <Tag onClick={() => { setSelectedGenres([]); setSelectedYear(null); }} style={{ cursor: "pointer" }}>
              {t("kitaplar.clearFilters")}
            </Tag>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 30, flexWrap: "wrap", gap: 12 }}>
          <Tabs
            variant="segmented"
            size="sm"
            items={[
              { value: "yeni", label: t("kitaplar.sort.yeni") },
              { value: "populer", label: t("kitaplar.sort.populer") },
              { value: "puan", label: t("kitaplar.sort.puan") },
              { value: "alfabetik", label: t("kitaplar.sort.alfabetik") },
            ]}
            value={sort}
            onChange={setSort}
          />
          <Switch label={t("kitaplar.hideRead")} checked={hideRead} onChange={setHideRead} />
        </div>
        {filtered.length === 0 && books != null ? (
          <p style={{ color: "var(--text-secondary)" }}>{t("kitaplar.empty")}</p>
        ) : (
          <>
            <section style={{ marginBottom: 36 }}>
              <SectionHead title={t("kitaplar.mostRead")} />
              <BookRail items={popular} readIds={readIds} onOpen={(id) => router.push(`/kitap/${id}`)} />
            </section>
            {rest.length > 0 && (
              <section>
                <SectionHead title={t("kitaplar.mostLiked")} />
                <BookRail items={visibleRest} readIds={readIds} onOpen={(id) => router.push(`/kitap/${id}`)} />
                {visibleCount < rest.length && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
                    <Button variant="menu" onClick={() => setVisibleCount((c) => c + pageSize)}>
                      {t("kitaplar.showMore")}
                    </Button>
                  </div>
                )}
              </section>
            )}
          </>
        )}
    </>
  );
}
