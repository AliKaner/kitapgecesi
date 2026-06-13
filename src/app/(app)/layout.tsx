"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/giris");
  }, [isLoading, user, router]);

  if (isLoading || !user) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-page)" }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
    </div>
  );
}
