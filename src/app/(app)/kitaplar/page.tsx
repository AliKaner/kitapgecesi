"use client";

import { CSSProperties, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ScreenTitle, SectionHead } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
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
  avgRating: number;
  ratingCount: number;
}

function BookRail({ items, readIds, onOpen }: { items: BookWithRating[]; readIds: Set<string>; onOpen: (id: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 124px)", gap: "22px 12px" }}>
      {items.map((b) => (
        <div key={b._id} style={readIds.has(b._id) ? ({ opacity: 0.35, filter: "grayscale(70%)" } as CSSProperties) : undefined}>
          <BookCard
            cover={b.coverUrl || undefined}
            title={b.title}
            author={b.author}
            rating={b.ratingCount > 0 ? b.avgRating : undefined}
            width={124}
            onClick={() => onOpen(b._id)}
          />
        </div>
      ))}
    </div>
  );
}

export default function KitaplarPage() {
  const { t } = useT();
  const [tab, setTab] = useState("Kitap Türleri");
  const [sort, setSort] = useState("yeni");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const router = useRouter();
  const { user } = useAuth();
  const books = useQuery(api.books.listBooksWithRatings, {});
  const library = useQuery(api.library.getUserLibrary, user ? { userId: user._id, status: "read" } : "skip");

  const readIds = useMemo(() => new Set((library ?? []).map((e) => e.bookId)), [library]);

  const filtered = useMemo(() => {
    let list = books ?? [];
    if (selectedGenres.length > 0) {
      list = list.filter((b) => b.genres?.some((g) => selectedGenres.includes(g)));
    }
    list = [...list];
    if (sort === "alfabetik") {
      list.sort((a, b) => a.title.localeCompare(b.title, "tr"));
    } else if (sort === "puan") {
      list.sort((a, b) => b.avgRating - a.avgRating);
    } else {
      list.sort((a, b) => b.createdAt - a.createdAt);
    }
    return list;
  }, [books, selectedGenres, sort]);

  const popular = filtered.slice(0, 4);
  const rest = filtered.slice(4);

  const pageSize = selectedGenres.length > 0 ? PAGE_SIZE_FILTERED : PAGE_SIZE_ALL;
  const filterKey = `${sort}:${selectedGenres.join(",")}`;
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
        <div style={{ marginBottom: 26 }}>
          <Tabs
            items={[
              { value: "Kitap Türleri", label: t("kitaplar.tab.turler") },
              { value: "Yazarlar", label: t("nav.yazarlar") },
              { value: "Konular", label: t("kitaplar.tab.konular") },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          {GENRES.map((g) => (
            <Tag key={g} tone={selectedGenres.includes(g) ? "tint" : "default"} onClick={() => toggleGenre(g)} style={{ cursor: "pointer" }}>
              {g}
            </Tag>
          ))}
        </div>
        <div style={{ marginBottom: 30 }}>
          <Tabs
            variant="segmented"
            size="sm"
            items={[
              { value: "yeni", label: t("kitaplar.sort.yeni") },
              { value: "puan", label: t("kitaplar.sort.puan") },
              { value: "alfabetik", label: t("kitaplar.sort.alfabetik") },
            ]}
            value={sort}
            onChange={setSort}
          />
        </div>
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
  );
}
