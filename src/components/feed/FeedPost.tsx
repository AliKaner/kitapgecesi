"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { PostCard } from "./PostCard";
import { RepostModal } from "./RepostModal";
import { BookCard } from "../book/BookCard";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { showToast } from "../ui/Toast";
import { useT } from "@/lib/i18n/I18nProvider";

/* Posts viewed once per browser session are not re-counted on re-render. */
const viewedPosts = new Set<string>();

function formatDate(ts: number) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(ts);
}

function formatCount(n: number) {
  return n.toLocaleString("tr-TR");
}

export type FeedPostData = FunctionReturnType<typeof api.posts.getFeed>[number];
type RepostedPostData = NonNullable<FeedPostData["repostedPost"]>;

function PostBody({ post }: { post: FeedPostData | RepostedPostData }) {
  const { t } = useT();
  return (
    <>
      {post.content && <p style={{ fontSize: "var(--fs-body-1)", lineHeight: "var(--lh-body-1)", color: "var(--text-primary)" } as CSSProperties}>{post.content}</p>}
      {post.mediaUrls?.[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.mediaUrls[0]}
          alt=""
          style={{ width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: "var(--radius-md)", display: "block" } as CSSProperties}
        />
      )}
      {post.books?.[0] && (
        <BookCard
          layout="row"
          cover={post.books[0]?.coverUrl}
          title={post.books[0]?.title ?? ""}
          author={post.books[0]?.author}
          width={78}
        />
      )}
      {post.type === "okuma" && post.pageNumber != null && (
        <div style={{ fontSize: "var(--fs-body-3)", color: "var(--text-secondary)" } as CSSProperties}>
          {t("post.pageProgress", { page: post.pageNumber })}
        </div>
      )}
    </>
  );
}

export function FeedPost({ post, currentUserId }: { post: FeedPostData; currentUserId?: Id<"users"> }) {
  const { t } = useT();
  const router = useRouter();
  const [showComments, setShowComments] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content ?? "");
  const [commentText, setCommentText] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const likeTarget = useMutation(api.posts.likeTarget);
  const createRepost = useMutation(api.posts.createRepost);
  const addComment = useMutation(api.posts.addComment);
  const updatePost = useMutation(api.posts.updatePost);
  const deletePost = useMutation(api.posts.deletePost);
  const recordView = useMutation(api.posts.recordView);

  const liked = useQuery(
    api.posts.getIsLiked,
    currentUserId ? { userId: currentUserId, targetType: "post", targetId: post._id } : "skip"
  );
  const reposted = useQuery(
    api.posts.getIsReposted,
    currentUserId ? { userId: currentUserId, postId: post._id } : "skip"
  );
  const comments = useQuery(api.posts.getComments, showComments ? { postId: post._id } : "skip");

  useEffect(() => {
    const el = ref.current;
    if (!el || viewedPosts.has(post._id)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !viewedPosts.has(post._id)) {
          viewedPosts.add(post._id);
          recordView({ postId: post._id });
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [post._id, recordView]);

  const isOwner = currentUserId === post.authorId;
  const isRepost = post.type === "repost";

  const handleRepostClick = () => {
    if (!currentUserId) return;
    if (reposted) {
      createRepost({ userId: currentUserId, postId: post._id });
      return;
    }
    setShowRepostModal(true);
  };

  const goToProfile = (username?: string) => {
    if (username) router.push(`/profil/${username}`);
  };

  const share = async () => {
    const url = `${window.location.origin}/post/${post._id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore — clipboard may be unavailable
    }
    showToast(t("post.linkCopied"));
  };

  const moreActions = isOwner
    ? [
        { label: t("post.edit"), onClick: () => setEditing(true) },
        {
          label: t("post.delete"),
          danger: true,
          onClick: () => {
            if (currentUserId && window.confirm(t("post.deleteConfirm"))) {
              deletePost({ userId: currentUserId, postId: post._id });
            }
          },
        },
      ]
    : undefined;

  return (
    <div ref={ref}>
      <PostCard
        author={{ name: post.author?.name, handle: post.author?.username ? `@${post.author.username}` : undefined, avatar: post.author?.profileImageUrl, roleBadges: post.author?.roleBadges }}
        date={formatDate(post.createdAt)}
        views={post.viewCount ? formatCount(post.viewCount) : undefined}
        text={editing ? undefined : post.content}
        comments={formatCount(post.commentCount)}
        reposts={formatCount(post.repostCount)}
        likes={formatCount(post.likeCount)}
        liked={!!liked}
        reposted={!!reposted}
        repostDisabled={isRepost}
        moreActions={moreActions}
        onAuthorClick={() => goToProfile(post.author?.username)}
        onShareClick={share}
        onCommentClick={() => setShowComments((v) => !v)}
        onLikeClick={() => currentUserId && likeTarget({ userId: currentUserId, targetType: "post", targetId: post._id })}
        onRepostClick={isRepost ? undefined : handleRepostClick}
        commentsSection={
          showComments && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--border-default)", paddingTop: 12 }}>
              {comments?.length ? (
                comments.map((c) => (
                  <div key={c._id} style={{ display: "flex", gap: 10 }}>
                    <Avatar src={c.author?.profileImageUrl} name={c.author?.name} size="sm" />
                    <div>
                      <div style={{ fontSize: "var(--fs-body-3)", fontWeight: "var(--fw-semibold)" as unknown as number, color: "var(--text-primary)" } as CSSProperties}>
                        {c.author?.name}
                      </div>
                      <div style={{ fontSize: "var(--fs-body-2)", color: "var(--text-primary)" } as CSSProperties}>{c.content}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: "var(--fs-body-3)", color: "var(--text-secondary)" }}>{t("post.noComments")}</div>
              )}
              {currentUserId && (
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
                      await addComment({ postId: post._id, authorId: currentUserId, content: commentText.trim() });
                      setCommentText("");
                    }}
                  >
                    {t("post.send")}
                  </Button>
                </div>
              )}
            </div>
          )
        }
      >
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder={t("post.editPlaceholder")}
              rows={3}
              style={{
                width: "100%",
                border: "1px solid var(--border-default)",
                borderRadius: "10px",
                padding: "10px 12px",
                fontSize: "var(--fs-body-1)",
                fontFamily: "var(--font-sans)",
                background: "var(--surface-card)",
                color: "var(--text-primary)",
                resize: "vertical",
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                size="sm"
                variant="primary"
                onClick={async () => {
                  if (!currentUserId) return;
                  await updatePost({ postId: post._id, userId: currentUserId, content: editText.trim() });
                  setEditing(false);
                }}
              >
                {t("common.save")}
              </Button>
              <Button size="sm" variant="menu" onClick={() => { setEditing(false); setEditText(post.content ?? ""); }}>
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {post.mediaUrls?.[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.mediaUrls[0]}
                alt=""
                style={{ width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: "var(--radius-md)", display: "block" } as CSSProperties}
              />
            )}
            {post.books?.[0] && (
              <BookCard
                layout="row"
                cover={post.books[0]?.coverUrl}
                title={post.books[0]?.title ?? ""}
                author={post.books[0]?.author}
                width={78}
              />
            )}
            {post.type === "okuma" && post.pageNumber != null && (
              <div style={{ fontSize: "var(--fs-body-3)", color: "var(--text-secondary)" } as CSSProperties}>
                {t("post.pageProgress", { page: post.pageNumber })}
              </div>
            )}
          </>
        )}

        {post.repostedPost && (
          <PostCard
            author={{ name: post.repostedPost.author?.name, handle: post.repostedPost.author?.username ? `@${post.repostedPost.author.username}` : undefined, avatar: post.repostedPost.author?.profileImageUrl, roleBadges: post.repostedPost.author?.roleBadges }}
            date={formatDate(post.repostedPost.createdAt)}
            style={{ background: "var(--surface-sunken)" }}
            onAuthorClick={() => goToProfile(post.repostedPost?.author?.username)}
            compact
          >
            <PostBody post={post.repostedPost} />
          </PostCard>
        )}
      </PostCard>
      <RepostModal
        open={showRepostModal}
        onClose={() => setShowRepostModal(false)}
        onSubmit={(content) => {
          if (!currentUserId) return;
          createRepost({ userId: currentUserId, postId: post._id, content });
        }}
      />
    </div>
  );
}
