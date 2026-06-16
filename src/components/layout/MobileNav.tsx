"use client";

import { CSSProperties, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Icon, IconName } from "../ui/Icon";
import { SidebarContent } from "./Sidebar";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

const TABS: { id: string; icon: IconName; labelKey: string; href: string }[] = [
  { id: "anasayfa", icon: "home", labelKey: "nav.anasayfa", href: "/" },
  { id: "kitaplar", icon: "book", labelKey: "nav.kitaplar", href: "/kitaplar" },
  { id: "bildirimler", icon: "bell", labelKey: "nav.bildirimler", href: "/bildirimler" },
  { id: "profil", icon: "user", labelKey: "nav.profil", href: "/profil" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useT();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const unreadCount = useQuery(api.notifications.getUnreadCount, user ? { userId: user._id } : "skip");

  // Her gezinmede (alt menü sekmesi dahil) çekmece kapansın — mobilde sidebar
  // hiçbir zaman açık takılı kalmasın. Render sırasında ayarlanır (effect yok).
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    if (drawerOpen) setDrawerOpen(false);
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [drawerOpen]);

  return (
    <>
      <header className="kg-mobile-topbar">
        <Image src="/logo.png" alt="KitapGecesi" width={89} height={40} style={{ height: 24, width: "auto" }} priority />
        <button
          aria-label={t("nav.language")}
          onClick={() => setDrawerOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 38,
            height: 38,
            borderRadius: 10,
            border: "1px solid var(--border-default)",
            background: "var(--surface-card)",
            color: "var(--text-primary)",
            cursor: "pointer",
          } as CSSProperties}
        >
          <Icon name="menu" size={20} />
        </button>
      </header>

      <nav className="kg-mobile-nav">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-label={t(tab.labelKey as Parameters<typeof t>[0])}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                height: "100%",
                color: active ? "var(--accent)" : "var(--text-secondary)",
              } as CSSProperties}
            >
              <Icon name={tab.icon} size={24} strokeWidth={active ? 2 : 1.75} />
              {tab.id === "bildirimler" && !!unreadCount && (
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    right: "calc(50% - 16px)",
                    minWidth: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: "var(--accent)",
                  } as CSSProperties}
                />
              )}
            </Link>
          );
        })}
        <button
          aria-label={t("nav.menu")}
          onClick={() => setDrawerOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            height: "100%",
            border: "none",
            background: "transparent",
            color: drawerOpen ? "var(--accent)" : "var(--text-secondary)",
            cursor: "pointer",
          } as CSSProperties}
        >
          <Icon name="menu" size={24} strokeWidth={drawerOpen ? 2 : 1.75} />
        </button>
      </nav>

      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1100,
            background: "rgba(20, 20, 20, 0.45)",
            backdropFilter: "blur(2px)",
          } as CSSProperties}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: "min(82vw, 300px)",
              background: "var(--bg-page)",
              borderRight: "1px solid var(--border-default)",
              display: "flex",
              flexDirection: "column",
              padding: "22px 14px 18px",
              overflowY: "auto",
            } as CSSProperties}
          >
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
