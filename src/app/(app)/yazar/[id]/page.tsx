"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { SectionHead } from "@/components/layout/Screen";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { DetailStat } from "@/components/ui/DetailStat";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { StarRating } from "@/components/ui/StarRating";
import { BookCard } from "@/components/book/BookCard";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

export default function YazarDetayPage() {
  const { t } = useT();
  const params = useParams();
  const router = useRouter();
  const authorId = params.id as Id<"authors">;
  const { user } = useAuth();

  const author = useQuery(api.authors.getAuthor, { authorId });
  const books = useQuery(api.authors.getAuthorBooks, { authorId });
  const stats = useQuery(api.authors.getAuthorStats, { authorId });
  const userRating = useQuery(
    api.books.getUserRating,
    user ? { userId: user._id, targetType: "author", targetId: authorId } : "skip"
  );
  const likeInfo = useQuery(api.likes.getLikeInfo, { targetType: "author", targetId: authorId, userId: user?._id });
  const rateTarget = useMutation(api.books.rateTarget);
  const incrementViews = useMutation(api.authors.incrementAuthorViews);
  const toggleLike = useMutation(api.likes.toggleLike);

  useEffect(() => {
    incrementViews({ authorId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorId]);

  if (author === undefined) return null;
  if (author === null) {
    return <p>{t("yazar.notFound")}</p>;
  }

  return (
    <>
      <button
        onClick={() => router.push("/yazarlar")}
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
        {t("nav.yazarlar")}
      </button>

      <div style={{ display: "flex", gap: 24, alignItems: "center", marginBottom: 28 }}>
        <Avatar src={author.photoUrl} name={author.name} size="xl" />
        <div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 36, lineHeight: 1.1, marginBottom: 8 }}>{author.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StarRating
              value={userRating ?? author.ratingSummary.avg}
              count={author.ratingSummary.count}
              compact={false}
              onRate={user ? (v) => rateTarget({ userId: user._id, targetType: "author", targetId: authorId, value: v }) : undefined}
            />
            <IconButton
              icon="heart"
              label={t("kitap.like")}
              active={likeInfo?.likedByMe}
              count={likeInfo?.count ?? 0}
              onClick={() => user && toggleLike({ userId: user._id, targetType: "author", targetId: authorId })}
              disabled={!user}
            />
          </div>
        </div>
      </div>

      <Card tone="sunken" style={{ marginBottom: 32 }}>
        <div style={{ display: "flex" }}>
          <DetailStat label={t("yazar.stat.views")} value={(stats?.viewCount ?? 0).toLocaleString("tr-TR")} />
          <DetailStat
            label={t("kitap.stat.rating")}
            value={`${author.ratingSummary.avg.toFixed(1).replace(".", ",")} / ${author.ratingSummary.count}`}
          />
          <DetailStat label={t("yazar.stat.reads")} value={(stats?.readCount ?? 0).toLocaleString("tr-TR")} />
          <DetailStat label={t("kitap.stat.likes")} value={(stats?.likeCount ?? 0).toLocaleString("tr-TR")} />
        </div>
      </Card>

      {author.bio && <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 36 }}>{author.bio}</p>}

      <section>
        <SectionHead title={t("yazar.books")} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 124px)", gap: "22px 20px" }}>
          {books?.map((b) => (
            <BookCard key={b._id} cover={b.coverUrl || undefined} title={b.title} author={b.author} width={124} onClick={() => router.push(`/kitap/${b._id}`)} />
          ))}
        </div>
      </section>
    </>
  );
}
