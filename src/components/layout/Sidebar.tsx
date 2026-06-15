"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { NavItem } from "../navigation/NavItem";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { ReadingGoalPrompt } from "../reading/ReadingGoalPrompt";
import { IconName } from "../ui/Icon";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

export const NAV: { id: string; icon: IconName; labelKey: string; href: string; count?: number }[] = [
  { id: "anasayfa", icon: "home", labelKey: "nav.anasayfa", href: "/" },
  { id: "kitaplar", icon: "book", labelKey: "nav.kitaplar", href: "/kitaplar" },
  { id: "yazarlar", icon: "user", labelKey: "nav.yazarlar", href: "/yazarlar" },
  { id: "listeler", icon: "list", labelKey: "nav.listeler", href: "/listeler" },
  { id: "kulupler", icon: "library", labelKey: "nav.kulupler", href: "/kulupler" },
  { id: "okuma", icon: "bookmark", labelKey: "nav.okumaListesi", href: "/listeler" },
  { id: "bildirimler", icon: "bell", labelKey: "nav.bildirimler", href: "/bildirimler" },
  { id: "profil", icon: "user", labelKey: "nav.profil", href: "/profil" },
  { id: "bagis", icon: "gift", labelKey: "nav.bagis", href: "/bagis" },
  { id: "ayarlar", icon: "settings", labelKey: "nav.ayarlar", href: "/ayarlar" },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useT();
  const unreadCount = useQuery(api.notifications.getUnreadCount, user ? { userId: user._id } : "skip");

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 12px 20px" }}>
        <Image src="/logo.png" alt="KitapGecesi" width={89} height={40} style={{ height: 28, width: "auto" }} priority />
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((n) => (
          <Link key={n.id} href={n.href} style={{ display: "block" }} onClick={onNavigate}>
            <NavItem
              icon={n.icon}
              active={pathname === n.href}
              count={n.id === "bildirimler" ? unreadCount || null : null}
              trailing={n.id === "bagis" && user ? new Intl.NumberFormat("tr-TR", { notation: "compact" }).format(user.yaprak) : null}
            >
              {t(n.labelKey as Parameters<typeof t>[0])}
            </NavItem>
          </Link>
        ))}
      </nav>
      <div style={{ marginTop: 18, padding: "0 6px" }}>
        <Link href="/" style={{ display: "block" }} onClick={onNavigate}>
          <Button variant="primary" icon="plus" fullWidth size="lg">
            {t("nav.yeniGonderi")}
          </Button>
        </Link>
      </div>
      <div style={{ marginTop: 12, padding: "0 6px" }}>
        <ReadingGoalPrompt />
      </div>
      {user && (
        <Link
          href="/profil"
          style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: "10px" }}
          onClick={onNavigate}
        >
          <Avatar src={user.profileImageUrl} name={user.name} size={38} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>@{user.username}</div>
          </div>
        </Link>
      )}
    </>
  );
}

export function Sidebar() {
  return (
    <aside
      className="kg-sidebar"
      style={{
        width: "var(--nav-width)",
        flex: "none",
        position: "sticky",
        top: 0,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "22px 14px 18px",
        borderRight: "1px solid var(--border-default)",
        background: "var(--bg-page)",
      }}
    >
      <SidebarContent />
    </aside>
  );
}
