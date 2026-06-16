"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

function formatCount(n: number) {
  return n.toLocaleString("tr-TR");
}

function PropTag({ label }: { label: string }) {
  return (
    <span
      style={{
        fontSize: "var(--fs-body-3)",
        fontWeight: "var(--fw-medium)" as unknown as number,
        color: "var(--accent)",
        background: "var(--accent-tint)",
        padding: "2px 8px",
        borderRadius: "var(--radius-pill)",
      }}
    >
      {label}
    </span>
  );
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
  const library = useQuery(api.library.getUserLibrary, user ? { userId: user._id, status: "read" } : "skip");
  const readIds = useMemo(() => new Set((library ?? []).map((e) => e.bookId)), [library]);

  const likeTarget = useMutation(api.posts.likeTarget);
  const addListComment = useMutation(api.lists.addListComment);
  const cloneList = useMutation(api.lists.cloneList);

  const handleShare = () => {
    const url = `${window.location.origin}/listeler/${listId}`;
    if (navigator.share) {
      navigator.share({ title: list?.title ?? t("nav.listeler"), url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert(t("common.saved"));
    }
  };

  if (list === undefined) return null;
  if (list === null) {
    return <p>{t("liste.notFound")}</p>;
  }

  const isOwner = user?._id === list.creatorId;
  const total = list.books.length;
  const readCount = list.books.filter((b) => readIds.has(b._id)).length;
  const readPct = total > 0 ? Math.round((readCount / total) * 100) : 0;

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
        {t("nav.listeler")}
      </button>

      <Card style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            {list.isRanked && <PropTag label={t("liste.fields.ranked")} />}
            {list.isPrivate && <PropTag label={t("liste.fields.private")} />}
            <span style={{ fontSize: "var(--fs-body-3)", color: "var(--text-secondary)" }}>{t("liste.bookCount", { count: total })}</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 34, lineHeight: 1.1, marginBottom: 6 }}>{list.title}</h1>
          {list.description && <p style={{ color: "var(--text-secondary)" }}>{list.description}</p>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar src={list.creator?.profileImageUrl} name={list.creator?.name} size="sm" />
          <span style={{ fontSize: "var(--fs-body-2)", color: "var(--text-secondary)" }}>{list.creator?.name}</span>
        </div>

        {user && total > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontSize: "var(--fs-body-2)", color: "var(--text-primary)" }}>{t("liste.readProgress", { read: readCount, total })}</span>
              <span style={{ fontSize: "var(--fs-body-2)", fontWeight: "var(--fw-semibold)" as unknown as number, color: "var(--accent)" }}>%{readPct}</span>
            </div>
            <div style={{ height: 8, borderRadius: "var(--radius-pill)", background: "var(--surface-sunken)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${readPct}%`, background: "var(--accent)", borderRadius: "var(--radius-pill)", transition: "width var(--dur-base) var(--ease-out)" }} />
            </div>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4, borderTop: "1px solid var(--border-default)" }}>
          <IconButton
            icon="heart"
            count={formatCount(list.likeCount)}
            active={!!isLiked}
            label={t("common.like")}
            onClick={() => user && likeTarget({ userId: user._id, targetType: "list", targetId: listId })}
          />
          <IconButton icon="share" variant="outline" size={36} label={t("common.share")} onClick={handleShare} />
          <div style={{ flex: 1 }} />
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
              {t("liste.clone")}
            </Button>
          )}
        </div>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "20px 14px",
          marginBottom: 36,
        }}
      >
        {list.books.map((b, i) => (
          <div
            key={b._id}
            onClick={() => router.push(`/kitap/${b._id}`)}
            style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 8, position: "relative" }}
          >
            {list.isRanked && (
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  left: 4,
                  zIndex: 1,
                  minWidth: 22,
                  height: 22,
                  padding: "0 6px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--accent)",
                  color: "var(--text-on-accent)",
                  fontSize: "var(--fs-body-3)",
                  fontWeight: "var(--fw-semibold)" as unknown as number,
                }}
              >
                {i + 1}
              </span>
            )}
            <div
              style={{
                width: "100%",
                aspectRatio: "2 / 3",
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
                background: "var(--bg-book-image)",
                boxShadow: "var(--shadow-book)",
              }}
            >
              {b.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.coverUrl} alt={b.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-secondary)", opacity: 0.5 }}>
                  <Icon name="book" size={24} />
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: "var(--fs-body-3)",
                color: "var(--text-primary)",
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {b.title}
            </div>
          </div>
        ))}
      </div>

      <section>
        <h3 style={{ fontSize: "var(--fs-h3)", fontWeight: 600, marginBottom: 14 }}>{t("liste.comments")}</h3>
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
