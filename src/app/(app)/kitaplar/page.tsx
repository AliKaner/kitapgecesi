"use client";

import { CSSProperties, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ScreenTitle, SectionHead } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { CompactFilter } from "@/components/ui/CompactFilter";
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

const COVER_WIDTH = 120;
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
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [readFilter, setReadFilter] = useState("all");
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
    if (genre) {
      list = list.filter((b) => b.genres?.includes(genre));
    }
    if (year) {
      list = list.filter((b) => b.releaseYear === Number(year));
    }
    if (readFilter === "unread") {
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
  }, [books, genre, year, readFilter, readIds, sort, search]);

  const popular = filtered.slice(0, 4);
  const rest = filtered.slice(4);

  const pageSize = genre || year || search.trim() ? PAGE_SIZE_FILTERED : PAGE_SIZE_ALL;
  const filterKey = `${sort}:${genre}:${year}:${readFilter}:${search.trim().toLocaleLowerCase("tr")}`;
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(pageSize);
  }

  const visibleRest = rest.slice(0, visibleCount);

  return (
    <>
      <ScreenTitle>{t("nav.kitaplar")}</ScreenTitle>
        <CompactFilter
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={t("kitaplar.searchPlaceholder")}
          selects={[
            {
              value: genre,
              onChange: setGenre,
              icon: "book",
              ariaLabel: t("kitaplar.allGenres"),
              options: [{ value: "", label: t("kitaplar.allGenres") }, ...GENRES.map((g) => ({ value: g, label: g }))],
            },
            {
              value: year,
              onChange: setYear,
              icon: "calendar",
              ariaLabel: t("kitaplar.allYears"),
              options: [{ value: "", label: t("kitaplar.allYears") }, ...years.map((y) => ({ value: String(y), label: String(y) }))],
            },
            {
              value: sort,
              onChange: setSort,
              icon: "list",
              ariaLabel: t("kitaplar.sort.yeni"),
              options: [
                { value: "yeni", label: t("kitaplar.sort.yeni") },
                { value: "populer", label: t("kitaplar.sort.populer") },
                { value: "puan", label: t("kitaplar.sort.puan") },
                { value: "alfabetik", label: t("kitaplar.sort.alfabetik") },
              ],
            },
            {
              value: readFilter,
              onChange: setReadFilter,
              icon: "eye",
              ariaLabel: t("kitaplar.readAll"),
              options: [
                { value: "all", label: t("kitaplar.readAll") },
                { value: "unread", label: t("kitaplar.readUnread") },
              ],
            },
          ]}
        />
        {filtered.length === 0 && books != null ? (
          <p style={{ color: "var(--text-secondary)" }}>{t("kitaplar.empty")}</p>
        ) : (
          <>
            <section style={{ marginBottom: 36 }}>
              <SectionHead
                title={t("kitaplar.mostRead")}
                onClick={() => setSort("populer")}
                active={sort === "populer"}
              />
              <BookRail items={popular} readIds={readIds} onOpen={(id) => router.push(`/kitap/${id}`)} />
            </section>
            {rest.length > 0 && (
              <section>
                <SectionHead
                  title={t("kitaplar.mostLiked")}
                  onClick={() => setSort("puan")}
                  active={sort === "puan"}
                />
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
