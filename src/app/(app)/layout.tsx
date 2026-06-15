"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { ContextRail } from "@/components/layout/ContextRail";
import { ToastHost } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/giris");
  }, [isLoading, user, router]);

  if (isLoading || !user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)" }}>
      <div style={{ display: "flex", maxWidth: "var(--shell-max)", margin: "0 auto" }}>
        <Sidebar />
        <main style={{ flex: 1, minWidth: 0, maxWidth: "var(--feed-max)", padding: "26px 32px 60px" }}>{children}</main>
        <ContextRail />
      </div>
      <ToastHost />
    </div>
  );
}
