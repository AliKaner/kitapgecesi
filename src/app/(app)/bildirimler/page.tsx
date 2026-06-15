"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ScreenTitle } from "@/components/layout/Screen";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { BADGE_DEFS } from "@/lib/badges";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

const NOTIF_TEXT_KEYS: Record<string, "bildirim.type.follow" | "bildirim.type.like" | "bildirim.type.repost" | "bildirim.type.reply"> = {
  follow: "bildirim.type.follow",
  like: "bildirim.type.like",
  repost: "bildirim.type.repost",
  reply: "bildirim.type.reply",
};

const BADGE_NAME: Record<string, string> = Object.fromEntries(BADGE_DEFS.map((b) => [b.key, b.name]));

/* Where each notification takes you when tapped. */
function routeFor(n: { type: string; targetClubId?: string | null }): string {
  switch (n.type) {
    case "badge":
      return "/profil?tab=Rozetler";
    case "club_invite":
      return n.targetClubId ? `/kulup/${n.targetClubId}` : "/kulupler";
    case "follow":
      return "/profil";
    case "like":
    case "reply":
    case "repost":
    default:
      return "/";
  }
}

function timeAgo(ts: number, t: ReturnType<typeof useT>["t"]) {
  const diff = Date.now() - ts;
  const hour = 1000 * 60 * 60;
  const day = hour * 24;
  if (diff < hour) return t("bildirim.justNow");
  if (diff < day) return t("bildirim.hoursAgo", { count: Math.floor(diff / hour) });
  return t("bildirim.daysAgo", { count: Math.floor(diff / day) });
}

export default function BildirimlerPage() {
  const { t } = useT();
  const router = useRouter();
  const { user } = useAuth();
  const notifications = useQuery(api.notifications.getNotifications, user ? { userId: user._id } : "skip");
  const markAllRead = useMutation(api.notifications.markAllRead);
  const markRead = useMutation(api.notifications.markRead);

  // Seeing the list counts as reading it: clear the unread badge on view.
  const hasUnread = (notifications ?? []).some((n) => !n.isRead);
  useEffect(() => {
    if (user && hasUnread) markAllRead({ userId: user._id });
  }, [user, hasUnread, markAllRead]);

  const open = (n: { _id: string; isRead: boolean; type: string; targetClubId?: string | null }) => {
    if (!n.isRead) markRead({ notificationId: n._id as Parameters<typeof markRead>[0]["notificationId"] });
    router.push(routeFor(n));
  };

  return (
    <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <ScreenTitle>{t("nav.bildirimler")}</ScreenTitle>
          {user && (
            <Button variant="ghost" size="sm" onClick={() => markAllRead({ userId: user._id })}>
              {t("bildirim.markAllRead")}
            </Button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {(notifications ?? []).map((n) => (
            <div
              key={n._id}
              onClick={() => open(n)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  open(n);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 0",
                borderBottom: "1px solid var(--border-default)",
                background: n.isRead ? "transparent" : "var(--surface-tint)",
                cursor: "pointer",
              }}
            >
              <Avatar src={n.sender?.profileImageUrl || undefined} name={n.sender?.name} size="md" />
              <div style={{ flex: 1, minWidth: 0 }}>
                {n.type === "badge" ? (
                  <p style={{ fontSize: "var(--fs-body-2)" }}>
                    {t("bildirim.newBadge")} <strong>{BADGE_NAME[n.badgeKey ?? ""] ?? ""}</strong>
                  </p>
                ) : (
                  <p style={{ fontSize: "var(--fs-body-2)" }}>
                    <strong>{n.sender?.name}</strong> {NOTIF_TEXT_KEYS[n.type] ? t(NOTIF_TEXT_KEYS[n.type]) : ""}
                  </p>
                )}
                <span style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-3)" }}>{timeAgo(n.createdAt, t)}</span>
              </div>
              {n.type === "follow" && (
                <Button variant="secondary" size="sm" onClick={(e) => e.stopPropagation()}>
                  {t("common.follow")}
                </Button>
              )}
            </div>
          ))}
          {notifications && notifications.length === 0 && <p style={{ color: "var(--text-secondary)" }}>{t("bildirim.empty")}</p>}
        </div>
    </>
  );
}
