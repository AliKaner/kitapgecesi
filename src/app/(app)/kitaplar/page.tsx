"use client";

import { CSSProperties, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ContextRail } from "@/components/layout/ContextRail";
import { ScreenTitle, SectionHead } from "@/components/layout/Screen";
import { Tabs } from "@/components/ui/Tabs";
import { Tag } from "@/components/ui/Tag";
import { BookCard } from "@/components/book/BookCard";
import { useAuth } from "@/lib/auth/AuthProvider";

const GENRES = ["Edebiyat", "Roman", "Psikoloji", "Duygu ve Düşünce", "Felsefe", "Tarih", "Bilim", "Tasavvuf", "Sanat", "Kişisel Gelişim"];

const SORT_OPTIONS = [
  { value: "yeni", label: "Yeni Eklenenler" },
  { value: "alfabetik", label: "Alfabetik" },
  { value: "puan", label: "En Yüksek Puan" },
];

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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 124px)", gap: "22px 20px" }}>
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

  const popular = filtered.slice(0, 5);
  const rest = filtered.slice(5);

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  return (
    <div style={{ display: "flex" }}>
      <div style={{ flex: 1, minWidth: 0, maxWidth: 760, margin: "0 auto", padding: "26px 32px 60px" }}>
        <ScreenTitle>Kitaplar</ScreenTitle>
        <div style={{ marginBottom: 26 }}>
          <Tabs items={["Kitap Türleri", "Yazarlar", "Konular"]} value={tab} onChange={setTab} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          {GENRES.map((g) => (
            <Tag key={g} tone={selectedGenres.includes(g) ? "tint" : "default"} onClick={() => toggleGenre(g)} style={{ cursor: "pointer" }}>
              {g}
            </Tag>
          ))}
        </div>
        <div style={{ marginBottom: 30 }}>
          <Tabs variant="segmented" size="sm" items={SORT_OPTIONS} value={sort} onChange={setSort} />
        </div>
        <section style={{ marginBottom: 36 }}>
          <SectionHead title="En Çok Okunanlar" />
          <BookRail items={popular} readIds={readIds} onOpen={(id) => router.push(`/kitap/${id}`)} />
        </section>
        {rest.length > 0 && (
          <section>
            <SectionHead title="En Beğenilen Kitaplar" />
            <BookRail items={rest} readIds={readIds} onOpen={(id) => router.push(`/kitap/${id}`)} />
          </section>
        )}
      </div>
      <ContextRail />
    </div>
  );
}
