"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { SectionHead } from "@/components/layout/Screen";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { StarRating } from "@/components/ui/StarRating";
import { BookCard } from "@/components/book/BookCard";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function YazarDetayPage() {
  const params = useParams();
  const router = useRouter();
  const authorId = params.id as Id<"authors">;
  const { user } = useAuth();

  const author = useQuery(api.authors.getAuthor, { authorId });
  const books = useQuery(api.authors.getAuthorBooks, { authorId });
  const userRating = useQuery(
    api.books.getUserRating,
    user ? { userId: user._id, targetType: "author", targetId: authorId } : "skip"
  );
  const rateTarget = useMutation(api.books.rateTarget);

  if (author === undefined) return null;
  if (author === null) {
    return <p>Yazar bulunamadı.</p>;
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
        Yazarlar
      </button>

      <div style={{ display: "flex", gap: 24, alignItems: "center", marginBottom: 28 }}>
        <Avatar src={author.photoUrl} name={author.name} size="xl" />
        <div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 36, lineHeight: 1.1, marginBottom: 8 }}>{author.name}</h1>
          <StarRating
            value={userRating ?? author.ratingSummary.avg}
            count={author.ratingSummary.count}
            compact={false}
            onRate={user ? (v) => rateTarget({ userId: user._id, targetType: "author", targetId: authorId, value: v }) : undefined}
          />
        </div>
      </div>

      {author.bio && <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 36 }}>{author.bio}</p>}

      <section>
        <SectionHead title="Kitapları" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 124px)", gap: "22px 20px" }}>
          {books?.map((b) => (
            <BookCard key={b._id} cover={b.coverUrl || undefined} title={b.title} author={b.author} width={124} onClick={() => router.push(`/kitap/${b._id}`)} />
          ))}
        </div>
      </section>
    </>
  );
}
