"use client";

import { CSSProperties, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function GirisPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(usernameOrEmail.trim(), password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--kg-night)",
        color: "var(--kg-sage)",
        padding: "32px",
        textAlign: "center",
      } as CSSProperties}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
        <Icon name="book" size={28} color="var(--kg-sage)" />
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 18, fontWeight: 600, letterSpacing: "0.04em" }}>KİTAPGECESİ</span>
      </div>

      <h1
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "clamp(32px, 6vw, 56px)",
          lineHeight: 1.05,
          color: "var(--kg-white)",
          marginBottom: 28,
        }}
      >
        Tekrar hoş geldin.
      </h1>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 380 }}>
        <Input
          placeholder="Kullanıcı adı veya e-posta"
          icon="user"
          pill
          value={usernameOrEmail}
          onChange={(e) => setUsernameOrEmail(e.target.value)}
          style={{ color: "var(--kg-ink)" }}
          required
        />
        <Input
          type="password"
          placeholder="Şifre"
          pill
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ color: "var(--kg-ink)" }}
          required
        />
        {error && (
          <div style={{ color: "var(--kg-error, #E0654F)", fontSize: "var(--fs-body-3)" }}>{error}</div>
        )}
        <Button type="submit" variant="primary" size="lg" disabled={loading}>
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </Button>
      </form>

      <p style={{ marginTop: 28, color: "var(--kg-sage-soft)", fontSize: "var(--fs-body-3)" }}>
        Hesabın yok mu?{" "}
        <Link href="/kayit" style={{ color: "var(--kg-sage)", textDecoration: "underline" }}>
          Kayıt ol
        </Link>
      </p>
    </div>
  );
}
