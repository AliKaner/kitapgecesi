"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ScreenTitle } from "@/components/layout/Screen";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon, IconName } from "@/components/ui/Icon";
import { BADGE_DEFS } from "@/lib/badges";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

const NOTIF_ICON: Record<string, IconName> = {
  follow: "user",
  like: "heart",
  repost: "repeat",
  reply: "comment",
  badge: "star",
};

const NOTIF_TEXT_KEYS: Record<string, "bildirim.type.follow" | "bildirim.type.like" | "bildirim.type.repost" | "bildirim.type.reply"> = {
  follow: "bildirim.type.follow",
  like: "bildirim.type.like",
  repost: "bildirim.type.repost",
  reply: "bildirim.type.reply",
};

const BADGE_NAME: Record<string, string> = Object.fromEntries(BADGE_DEFS.map((b) => [b.key, b.name]));

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
  const { user } = useAuth();
  const notifications = useQuery(api.notifications.getNotifications, user ? { userId: user._id } : "skip");
  const markAllRead = useMutation(api.notifications.markAllRead);

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
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 0",
                borderBottom: "1px solid var(--border-default)",
                background: n.isRead ? "transparent" : "var(--surface-tint)",
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
              <Icon name={NOTIF_ICON[n.type] ?? "bell"} size={18} color="var(--text-secondary)" />
              {n.type === "follow" && (
                <Button variant="secondary" size="sm">
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
