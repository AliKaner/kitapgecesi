"use client";

import { CSSProperties, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";

export default function OnkayitPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
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
          fontSize: "clamp(40px, 8vw, 88px)",
          lineHeight: 1.05,
          color: "var(--kg-white)",
          maxWidth: 720,
          marginBottom: 18,
        }}
      >
        Kitap Gecesi&apos;ne hoş geldin.
      </h1>

      <p style={{ color: "var(--kg-sage-soft)", fontSize: "var(--fs-body-1)", maxWidth: 520, marginBottom: 40, lineHeight: 1.6 }}>
        Okuduklarını paylaş, listeler oluştur, topluluğunla birlikte okuma alışkanlığını büyüt. Erken erişim için
        önkayıt ol, davetiyeni ilk sıradan al.
      </p>

      {sent ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 24px",
            borderRadius: "var(--radius-lg)",
            background: "var(--kg-night-700)",
            color: "var(--kg-sage)",
          }}
        >
          <Icon name="check" size={20} color="var(--kg-green)" />
          Önkayıt alındı! Davetiyeni e-posta ile göndereceğiz.
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: "flex", gap: 10, width: "100%", maxWidth: 420 }}>
          <div style={{ flex: 1 }}>
            <Input
              type="email"
              placeholder="E-posta adresin"
              icon="user"
              pill
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ color: "var(--kg-ink)" }}
              required
            />
          </div>
          <Button type="submit" variant="primary" size="lg">
            Önkayıt Ol
          </Button>
        </form>
      )}

      <p style={{ marginTop: 28, color: "var(--kg-sage-soft)", fontSize: "var(--fs-body-3)", opacity: 0.7 }}>
        Davet kodun varsa, uygulamaya doğrudan katılabilirsin.
      </p>
    </div>
  );
}
