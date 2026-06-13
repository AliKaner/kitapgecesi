"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { SectionHead } from "@/components/layout/Screen";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { StarRating } from "@/components/ui/StarRating";
import { Tabs } from "@/components/ui/Tabs";
import { Tag } from "@/components/ui/Tag";
import { BookCover } from "@/components/book/BookCover";
import { BookCard } from "@/components/book/BookCard";
import { useAuth } from "@/lib/auth/AuthProvider";

const STATUS_OPTIONS = [
  { value: "want", label: "Okumak İstiyorum" },
  { value: "reading", label: "Okuyorum" },
  { value: "read", label: "Okudum" },
];

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 28 }}>{value}</div>
      <div style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-3)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function KitapDetayPage() {
  const params = useParams();
  const router = useRouter();
  const [tab, setTab] = useState("Genel Bakış");
  const bookId = params.id as Id<"books">;
  const { user } = useAuth();

  const book = useQuery(api.books.getBook, { bookId });
  const allBooks = useQuery(api.books.searchLocalBooks, { query: "" });
  const ratingSummary = useQuery(api.books.getRatingSummary, { targetType: "book", targetId: bookId });
  const userRating = useQuery(
    api.books.getUserRating,
    user ? { userId: user._id, targetType: "book", targetId: bookId } : "skip"
  );
  const userBook = useQuery(api.library.getUserBook, user ? { userId: user._id, bookId } : "skip");

  const rateTarget = useMutation(api.books.rateTarget);
  const setStatus = useMutation(api.library.setStatus);

  if (book === undefined) return null;
  if (book === null) {
    return (
      <div style={{ padding: "26px 32px" }}>
        <p>Kitap bulunamadı.</p>
      </div>
    );
  }

  const similar = (allBooks ?? []).filter((b) => b._id !== book._id).slice(0, 4);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "26px 32px 60px" }}>
      <button
        onClick={() => router.push("/kitaplar")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          border: "none",
          background: "none",
          cursor: "pointer",
          color: "var(--text-secondary)",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-body-2)",
          marginBottom: 22,
          padding: 0,
        }}
      >
        <Icon name="arrow-left" size={16} />
        Kitaplar
      </button>

      <div style={{ display: "flex", gap: 28, marginBottom: 32 }}>
        <BookCover src={book.coverUrl || undefined} title={book.title} width={150} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 38, lineHeight: 1.1, marginBottom: 8 }}>{book.title}</h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: 10 }}>
            {book.author} · {book.totalPages} sayfa
          </p>
          {book.genres && book.genres.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {book.genres.map((g) => (
                <Tag key={g} size="sm">
                  {g}
                </Tag>
              ))}
            </div>
          )}
          <div style={{ marginBottom: 18 }}>
            <StarRating
              value={userRating ?? ratingSummary?.avg ?? 0}
              count={ratingSummary?.count}
              compact={false}
              onRate={user ? (v) => rateTarget({ userId: user._id, targetType: "book", targetId: bookId, value: v }) : undefined}
            />
          </div>
          <Tabs
            variant="segmented"
            size="sm"
            items={STATUS_OPTIONS}
            value={userBook?.status ?? ""}
            onChange={(v) => {
              if (!user) return;
              setStatus({ userId: user._id, bookId, status: v as "want" | "reading" | "read" });
            }}
          />
        </div>
      </div>

      <Card tone="sunken" style={{ marginBottom: 32 }}>
        <div style={{ display: "flex" }}>
          <DetailStat label="görüntüleme" value="8.364" />
          <DetailStat
            label="değerlendirme"
            value={`${(ratingSummary?.avg ?? 0).toFixed(1).replace(".", ",")} / ${ratingSummary?.count ?? 0}`}
          />
          <DetailStat label="okuma" value="2.657" />
        </div>
      </Card>

      <div style={{ marginBottom: 22 }}>
        <Tabs items={["Genel Bakış", "İncelemeler", "Alıntılar", "Benzer Kitaplar"]} value={tab} onChange={setTab} />
      </div>

      {tab === "Genel Bakış" && (
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 36 }}>
          {book.author} tarafından yazılan &quot;{book.title}&quot;, okuyucularını derin bir düşünce yolculuğuna çıkarıyor. {book.totalPages} sayfa
          boyunca akıcı bir anlatımla ilerleyen kitap, KitapGecesi topluluğunda en çok tartışılan eserlerden biri.
        </p>
      )}
      {tab === "İncelemeler" && (
        <p style={{ color: "var(--text-secondary)", marginBottom: 36 }}>Henüz inceleme bulunmuyor.</p>
      )}
      {tab === "Alıntılar" && (
        <p style={{ color: "var(--text-secondary)", marginBottom: 36 }}>Henüz alıntı bulunmuyor.</p>
      )}
      {tab === "Benzer Kitaplar" && similar.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 124px)", gap: "22px 20px", marginBottom: 36 }}>
          {similar.map((b) => (
            <BookCard key={b._id} cover={b.coverUrl || undefined} title={b.title} author={b.author} width={124} onClick={() => router.push(`/kitap/${b._id}`)} />
          ))}
        </div>
      )}

      {tab !== "Benzer Kitaplar" && similar.length > 0 && (
        <section>
          <SectionHead title="Benzer Kitaplar" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 124px)", gap: "22px 20px" }}>
            {similar.map((b) => (
              <BookCard key={b._id} cover={b.coverUrl || undefined} title={b.title} author={b.author} width={124} onClick={() => router.push(`/kitap/${b._id}`)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
