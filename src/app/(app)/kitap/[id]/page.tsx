"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { SectionHead } from "@/components/layout/Screen";
import { Card } from "@/components/ui/Card";
import { DetailRow } from "@/components/ui/DetailRow";
import { DetailStat } from "@/components/ui/DetailStat";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { StarRating } from "@/components/ui/StarRating";
import { Tabs } from "@/components/ui/Tabs";
import { Tag } from "@/components/ui/Tag";
import { BookCover } from "@/components/book/BookCover";
import { BookCard } from "@/components/book/BookCard";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

export default function KitapDetayPage() {
  const { t } = useT();
  const params = useParams();
  const router = useRouter();
  const [tab, setTab] = useState("Genel Bakış");
  const bookId = params.id as Id<"books">;
  const { user } = useAuth();

  const book = useQuery(api.books.getBook, { bookId });
  const allBooks = useQuery(api.books.searchLocalBooks, { query: "" });
  const stats = useQuery(api.books.getBookStats, { bookId });
  const ratingSummary = useQuery(api.books.getRatingSummary, { targetType: "book", targetId: bookId });
  const userRating = useQuery(
    api.books.getUserRating,
    user ? { userId: user._id, targetType: "book", targetId: bookId } : "skip"
  );
  const userBook = useQuery(api.library.getUserBook, user ? { userId: user._id, bookId } : "skip");
  const likeInfo = useQuery(api.likes.getLikeInfo, { targetType: "book", targetId: bookId, userId: user?._id });

  const rateTarget = useMutation(api.books.rateTarget);
  const setStatus = useMutation(api.library.setStatus);
  const incrementViews = useMutation(api.books.incrementBookViews);
  const toggleLike = useMutation(api.likes.toggleLike);

  useEffect(() => {
    incrementViews({ bookId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  if (book === undefined) return null;
  if (book === null) {
    return <p>{t("kitap.notFound")}</p>;
  }

  const similar = (allBooks ?? []).filter((b) => b._id !== book._id).slice(0, 4);

  return (
    <>
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
        {t("nav.kitaplar")}
      </button>

      <div style={{ display: "flex", gap: 28, marginBottom: 32 }}>
        <BookCover src={book.coverUrl || undefined} title={book.title} width={150} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 38, lineHeight: 1.1, marginBottom: 8 }}>{book.title}</h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: 10 }}>
            {book.author} · {t("kitap.pages", { count: book.totalPages })}
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
          <div style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
            <StarRating
              value={userRating ?? ratingSummary?.avg ?? 0}
              count={ratingSummary?.count}
              compact={false}
              onRate={user ? (v) => rateTarget({ userId: user._id, targetType: "book", targetId: bookId, value: v }) : undefined}
            />
            <IconButton
              icon="heart"
              label={t("kitap.like")}
              active={likeInfo?.likedByMe}
              count={likeInfo?.count ?? 0}
              onClick={() => user && toggleLike({ userId: user._id, targetType: "book", targetId: bookId })}
              disabled={!user}
            />
          </div>
          <Tabs
            variant="segmented"
            size="sm"
            items={[
              { value: "want", label: t("kitap.status.want") },
              { value: "reading", label: t("kitap.status.reading") },
              { value: "read", label: t("kitap.status.read") },
            ]}
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
          <DetailStat label={t("kitap.stat.views")} value={(stats?.viewCount ?? 0).toLocaleString("tr-TR")} />
          <DetailStat
            label={t("kitap.stat.rating")}
            value={`${(ratingSummary?.avg ?? 0).toFixed(1).replace(".", ",")} / ${ratingSummary?.count ?? 0}`}
          />
          <DetailStat label={t("kitap.stat.reads")} value={(stats?.readCount ?? 0).toLocaleString("tr-TR")} />
          <DetailStat label={t("kitap.stat.likes")} value={(stats?.likeCount ?? 0).toLocaleString("tr-TR")} />
        </div>
      </Card>

      <section style={{ marginBottom: 32 }}>
        <SectionHead title={t("kitap.detail.title")} />
        <Card>
          <DetailRow label={t("kitap.detail.publisher")} value={book.publisher ?? "—"} />
          <DetailRow label={t("kitap.detail.category")} value={book.category ?? "—"} />
          <DetailRow label={t("kitap.detail.isbn")} value={book.isbn ?? "—"} />
          <DetailRow label={t("kitap.detail.releaseYear")} value={book.releaseYear ? String(book.releaseYear) : "—"} />
        </Card>
      </section>

      <div style={{ marginBottom: 22 }}>
        <Tabs
          items={[
            { value: "Genel Bakış", label: t("kitap.tab.overview") },
            { value: "İncelemeler", label: t("kitap.tab.reviews") },
            { value: "Alıntılar", label: t("kitap.tab.quotes") },
            { value: "Benzer Kitaplar", label: t("kitap.tab.similar") },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === "Genel Bakış" && (
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 36 }}>
          {t("kitap.overview", { author: book.author, title: book.title, pages: book.totalPages })}
        </p>
      )}
      {tab === "İncelemeler" && (
        <p style={{ color: "var(--text-secondary)", marginBottom: 36 }}>{t("kitap.noReviews")}</p>
      )}
      {tab === "Alıntılar" && (
        <p style={{ color: "var(--text-secondary)", marginBottom: 36 }}>{t("kitap.noQuotes")}</p>
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
          <SectionHead title={t("kitap.tab.similar")} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 124px)", gap: "22px 20px" }}>
            {similar.map((b) => (
              <BookCard key={b._id} cover={b.coverUrl || undefined} title={b.title} author={b.author} width={124} onClick={() => router.push(`/kitap/${b._id}`)} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
