"use client";

import { CSSProperties, HTMLAttributes, ReactNode, useState } from "react";
import { Avatar } from "../ui/Avatar";
import { IconButton } from "../ui/IconButton";
import { Icon } from "../ui/Icon";
import { RoleBadges, RoleBadgeKey } from "../ui/RoleBadges";
import { useT } from "@/lib/i18n/I18nProvider";

/* Feed post. Header (avatar · name · date · overflow), body text, an optional
   embedded block (a book review, club, image — passed as children), and the
   reaction row: comment · repost · like · share. Pass `reposted`/`liked`
   strings or numbers; counts are shown as given (e.g. "1,245"). */

export interface PostCardAuthor {
  name?: string;
  handle?: string;
  avatar?: string;
  roleBadges?: RoleBadgeKey[] | null;
}

export interface PostCardMoreAction {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

export interface PostCardProps extends HTMLAttributes<HTMLElement> {
  author?: PostCardAuthor;
  date?: string;
  text?: string;
  comments?: number | string;
  reposts?: number | string;
  likes?: number | string;
  shares?: number | string;
  views?: number | string;
  liked?: boolean;
  reposted?: boolean;
  contextLabel?: ReactNode;
  onMore?: () => void;
  onCommentClick?: () => void;
  onRepostClick?: () => void;
  onLikeClick?: () => void;
  onShareClick?: () => void;
  onAuthorClick?: () => void;
  moreActions?: PostCardMoreAction[];
  commentsSection?: ReactNode;
  children?: ReactNode;
  compact?: boolean;
}

export function PostCard({
  author = {},
  date,
  text,
  children,
  comments,
  reposts,
  likes,
  shares,
  views,
  liked = false,
  reposted = false,
  contextLabel,
  onMore,
  onCommentClick,
  onRepostClick,
  onLikeClick,
  onShareClick,
  onAuthorClick,
  moreActions,
  commentsSection,
  compact = false,
  style,
  ...rest
}: PostCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useT();

  return (
    <article
      style={{
        background: "var(--bg-post)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-lg)",
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        ...style,
      } as CSSProperties}
      {...rest}
    >
      {contextLabel && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "var(--fs-body-3)", color: "var(--text-secondary)", marginBottom: -2 } as CSSProperties}>
          <Icon name="repeat" size={13} /> {contextLabel}
        </div>
      )}
      <header style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div
          onClick={onAuthorClick}
          style={{ display: "flex", alignItems: "center", gap: 11, flex: 1, minWidth: 0, cursor: onAuthorClick ? "pointer" : undefined }}
        >
          <Avatar src={author.avatar} name={author.name} size="md" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "var(--fs-body-1)", fontWeight: "var(--fw-semibold)", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 } as CSSProperties}>
              {author.name}
              <RoleBadges badges={author.roleBadges} />
            </div>
          {(author.handle || date) && (
            <div style={{ fontSize: "var(--fs-body-3)", color: "var(--text-secondary)" } as CSSProperties}>
              {author.handle && <span>{author.handle}</span>}
              {author.handle && date && <span> · </span>}
              {date}
              {views !== undefined && views !== null && (
                <span> · {t("post.views", { count: views })}</span>
              )}
            </div>
          )}
          </div>
        </div>
        {compact ? null : moreActions && moreActions.length > 0 ? (
          <div style={{ position: "relative" }}>
            <IconButton icon="more" label={t("post.more")} size={32} onClick={() => setMenuOpen((v) => !v)} />
            {menuOpen && (
              <>
                <div
                  onClick={() => setMenuOpen(false)}
                  style={{ position: "fixed", inset: 0, zIndex: 10 }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    zIndex: 11,
                    minWidth: 140,
                    background: "var(--surface-card)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-md, 0 4px 16px rgba(0,0,0,0.08))",
                    overflow: "hidden",
                  }}
                >
                  {moreActions.map((a) => (
                    <button
                      key={a.label}
                      onClick={() => {
                        setMenuOpen(false);
                        a.onClick();
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 14px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontFamily: "var(--font-sans)",
                        fontSize: "var(--fs-body-2)",
                        color: a.danger ? "var(--kg-danger)" : "var(--text-primary)",
                      }}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <IconButton icon="more" label={t("post.more")} size={32} onClick={onMore} />
        )}
      </header>

      {text && <p style={{ fontSize: "var(--fs-body-1)", lineHeight: "var(--lh-body-1)", color: "var(--text-primary)" } as CSSProperties}>{text}</p>}

      {children}

      {!compact && (
        <footer style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
          <IconButton icon="comment" count={comments} label={t("post.comment")} size={34} onClick={onCommentClick} />
          <IconButton icon="repeat" count={reposts} active={reposted} label={t("post.repost")} size={34} onClick={onRepostClick} />
          <IconButton icon="heart" count={likes} active={liked} label={t("common.like")} size={34} onClick={onLikeClick} />
          <div style={{ flex: 1 }} />
          <IconButton icon="share" count={shares} label={t("common.share")} size={34} onClick={onShareClick} />
        </footer>
      )}

      {commentsSection}
    </article>
  );
}
