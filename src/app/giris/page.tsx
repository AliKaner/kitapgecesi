"use client";

import { CSSProperties, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

export default function GirisPage() {
  const { t } = useT();
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
      setError(err instanceof Error ? err.message : t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left panel: Brand and Invite-only note */}
      <div className="auth-left">
        {/* Top brand header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="book" size={28} color="var(--kg-sage)" />
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "0.04em",
              color: "var(--kg-white)",
            }}
          >
            KİTAPGECESİ
          </span>
        </div>

        {/* Middle contents */}
        <div style={{ maxWidth: 440, margin: "auto 0" }}>
          <span className="auth-badge">
            <Icon name="bookmark" size={14} color="var(--kg-sage)" />
            <span style={{ fontSize: 11 }}>{t("auth.inviteOnlyBadge")}</span>
          </span>
          
          <h1
            className="kg-serif"
            style={{
              fontSize: "clamp(32px, 5vw, 44px)",
              lineHeight: 1.1,
              color: "var(--kg-white)",
              marginTop: 20,
              marginBottom: 16,
            }}
          >
            {t("auth.inviteOnlyHeadline")}
          </h1>
          
          <p
            style={{
              fontSize: "var(--fs-body-1)",
              lineHeight: "var(--lh-body-1)",
              color: "var(--kg-sage-soft)",
              marginBottom: 28,
            }}
          >
            {t("auth.inviteOnlySubtitle")}
          </p>

          {/* Invite Code notice card */}
          <div className="auth-warning-card">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="shield" size={18} color="var(--kg-sage)" />
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-body-3)",
                  fontWeight: 600,
                  color: "var(--kg-white)",
                  letterSpacing: "0.05em",
                }}
              >
                {t("auth.inviteOnlyBadge")}
              </span>
            </div>
            <p
              style={{
                fontSize: "var(--fs-body-3)",
                lineHeight: "var(--lh-body-3)",
                color: "var(--kg-sage-soft)",
              }}
            >
              {t("auth.inviteOnlyNotice")}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ fontSize: "var(--fs-body-3)", color: "var(--kg-sage-soft)", opacity: 0.7 }}>
          © {new Date().getFullYear()} KitapGecesi.
        </div>
      </div>

      {/* Right panel: Login form */}
      <div className="auth-right">
        <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 32 }}>
          <div>
            <h2
              className="kg-serif"
              style={{
                fontSize: "clamp(28px, 4vw, 36px)",
                lineHeight: 1.15,
                color: "var(--kg-ink)",
                marginBottom: 8,
              }}
            >
              {t("auth.welcomeBack")}
            </h2>
            <p style={{ fontSize: "var(--fs-body-2)", color: "var(--kg-slate)" }}>
              {t("auth.hasInviteCode")}
            </p>
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Input
              placeholder={t("auth.usernameOrEmail")}
              icon="user"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder={t("auth.password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <div style={{ color: "var(--kg-danger, #C0432F)", fontSize: "var(--fs-body-3)", display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="x" size={14} />
                <span>{error}</span>
              </div>
            )}
            <Button type="submit" variant="primary" size="lg" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? t("auth.loggingIn") : t("auth.login")}
            </Button>
          </form>

          <p style={{ color: "var(--kg-slate)", fontSize: "var(--fs-body-2)", textAlign: "center" }}>
            {t("auth.noAccount")}{" "}
            <Link
              href="/kayit"
              style={{
                color: "var(--kg-green)",
                fontWeight: 600,
                textDecoration: "underline",
                textUnderlineOffset: "4px",
                transition: "color 0.2s ease",
              }}
            >
              {t("auth.signUp")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

