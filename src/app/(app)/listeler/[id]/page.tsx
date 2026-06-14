"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { BookCard } from "@/components/book/BookCard";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

function formatCount(n: number) {
  return n.toLocaleString("tr-TR");
}

export default function ListeDetayPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params.id as Id<"lists">;
  const { user } = useAuth();
  const { t } = useT();
  const [commentText, setCommentText] = useState("");

  const list = useQuery(api.lists.getList, { listId });
  const comments = useQuery(api.lists.getListComments, { listId });
  const isLiked = useQuery(api.posts.getIsLiked, user ? { userId: user._id, targetType: "list", targetId: listId } : "skip");

  const likeTarget = useMutation(api.posts.likeTarget);
  const addListComment = useMutation(api.lists.addListComment);
  const cloneList = useMutation(api.lists.cloneList);

  if (list === undefined) return null;
  if (list === null) {
    return <p>Liste bulunamadı.</p>;
  }

  const isOwner = user?._id === list.creatorId;

  return (
    <>
      <button
        onClick={() => router.push("/listeler")}
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
        Listeler
      </button>

      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 38, lineHeight: 1.1, marginBottom: 8 }}>{list.title}</h1>
      {list.description && <p style={{ color: "var(--text-secondary)", marginBottom: 14 }}>{list.description}</p>}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Avatar src={list.creator?.profileImageUrl} name={list.creator?.name} size="sm" />
        <span style={{ fontSize: "var(--fs-body-2)", color: "var(--text-secondary)" }}>{list.creator?.name}</span>
        <div style={{ flex: 1 }} />
        <IconButton
          icon="heart"
          count={formatCount(list.likeCount)}
          active={!!isLiked}
          label="Beğen"
          onClick={() => user && likeTarget({ userId: user._id, targetType: "list", targetId: listId })}
        />
        {!isOwner && (
          <Button
            variant="menu"
            size="sm"
            icon="repeat"
            onClick={async () => {
              if (!user) return;
              const newId = await cloneList({ listId, userId: user._id });
              router.push(`/listeler/${newId}`);
            }}
          >
            Klonla
          </Button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
        {list.books.map((b, i) => (
          <div key={b._id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {list.isRanked && (
              <span style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--text-secondary)", width: 28, textAlign: "right" }}>{i + 1}</span>
            )}
            <BookCard
              layout="row"
              cover={b.coverUrl || undefined}
              title={b.title}
              author={b.author}
              pages={b.totalPages}
              width={70}
              onClick={() => router.push(`/kitap/${b._id}`)}
              style={{ flex: 1 }}
            />
          </div>
        ))}
      </div>

      <section>
        <h3 style={{ fontSize: "var(--fs-h3)", fontWeight: 600, marginBottom: 14 }}>Yorumlar</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          {comments?.length ? (
            comments.map((c) => (
              <div key={c._id} style={{ display: "flex", gap: 10 }}>
                <Avatar src={c.author?.profileImageUrl} name={c.author?.name} size="sm" />
                <div>
                  <div style={{ fontSize: "var(--fs-body-3)", fontWeight: "var(--fw-semibold)" as unknown as number, color: "var(--text-primary)" }}>
                    {c.author?.name}
                  </div>
                  <div style={{ fontSize: "var(--fs-body-2)", color: "var(--text-primary)" }}>{c.content}</div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: "var(--fs-body-3)", color: "var(--text-secondary)" }}>{t("post.noComments")}</div>
          )}
        </div>
        {user && (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={t("post.commentPlaceholder")}
              style={{
                flex: 1,
                border: "1px solid var(--border-default)",
                borderRadius: "10px",
                padding: "8px 12px",
                fontSize: "var(--fs-body-2)",
                fontFamily: "var(--font-sans)",
                background: "var(--surface-card)",
                color: "var(--text-primary)",
              }}
            />
            <Button
              size="sm"
              variant="primary"
              onClick={async () => {
                if (!commentText.trim()) return;
                await addListComment({ listId, authorId: user._id, content: commentText.trim() });
                setCommentText("");
              }}
            >
              {t("post.send")}
            </Button>
          </div>
        )}
      </section>
    </>
  );
}
