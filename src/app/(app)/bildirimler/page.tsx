"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ScreenTitle } from "@/components/layout/Screen";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon, IconName } from "@/components/ui/Icon";
import { BADGE_DEFS } from "@/lib/badges";
import { useAuth } from "@/lib/auth/AuthProvider";

const NOTIF_ICON: Record<string, IconName> = {
  follow: "user",
  like: "heart",
  repost: "repeat",
  reply: "comment",
  badge: "star",
};

const NOTIF_TEXT: Record<string, string> = {
  follow: "seni takip etmeye başladı.",
  like: "gönderini beğendi.",
  repost: "gönderini yeniden paylaştı.",
  reply: "gönderine yanıt verdi.",
};

const BADGE_NAME: Record<string, string> = Object.fromEntries(BADGE_DEFS.map((b) => [b.key, b.name]));

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const hour = 1000 * 60 * 60;
  const day = hour * 24;
  if (diff < hour) return "az önce";
  if (diff < day) return `${Math.floor(diff / hour)} saat önce`;
  return `${Math.floor(diff / day)} gün önce`;
}

export default function BildirimlerPage() {
  const { user } = useAuth();
  const notifications = useQuery(api.notifications.getNotifications, user ? { userId: user._id } : "skip");
  const markAllRead = useMutation(api.notifications.markAllRead);

  return (
    <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <ScreenTitle>Bildirimler</ScreenTitle>
          {user && (
            <Button variant="ghost" size="sm" onClick={() => markAllRead({ userId: user._id })}>
              Tümünü okundu işaretle
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
                    Yeni rozet kazandın: <strong>{BADGE_NAME[n.badgeKey ?? ""] ?? ""}</strong>
                  </p>
                ) : (
                  <p style={{ fontSize: "var(--fs-body-2)" }}>
                    <strong>{n.sender?.name}</strong> {NOTIF_TEXT[n.type] ?? ""}
                  </p>
                )}
                <span style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-3)" }}>{timeAgo(n.createdAt)}</span>
              </div>
              <Icon name={NOTIF_ICON[n.type] ?? "bell"} size={18} color="var(--text-secondary)" />
              {n.type === "follow" && (
                <Button variant="secondary" size="sm">
                  Takip Et
                </Button>
              )}
            </div>
          ))}
          {notifications && notifications.length === 0 && <p style={{ color: "var(--text-secondary)" }}>Henüz bildirim yok.</p>}
        </div>
    </>
  );
}
