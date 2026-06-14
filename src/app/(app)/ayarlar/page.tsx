"use client";

import { ReactNode, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ScreenTitle } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Tabs } from "@/components/ui/Tabs";
import { ShowcaseEditor } from "@/components/profile/ShowcaseEditor";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";

const SWATCHES = ["#5B913B", "#27272A", "#C0432F", "#2A6FDB", "#C8881F"];

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--border-default)" }}>
      <div>
        <div style={{ fontSize: "var(--fs-body-2)", fontWeight: "var(--fw-medium)" as unknown as number }}>{label}</div>
        {hint && <div style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-3)", marginTop: 2 }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

export default function AyarlarPage() {
  const router = useRouter();
  const [tab, setTab] = useState("genel");
  const { user, logout } = useAuth();
  const { t, locale, setLocale } = useT();
  const { accent, setAccent } = useTheme();
  const updateProfileImages = useMutation(api.users.updateProfileImages);
  const profileImageRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const saveProfileImages = async () => {
    if (!user) return;
    await updateProfileImages({
      userId: user._id,
      profileImageUrl: profileImageRef.current?.value ?? "",
      bannerUrl: bannerRef.current?.value ?? "",
    });
  };

  return (
    <>
      <ScreenTitle>{t("ayarlar.title")}</ScreenTitle>
      <div style={{ marginBottom: 26 }}>
        <Tabs
          items={[
            { value: "genel", label: t("ayarlar.tab.genel") },
            { value: "tema", label: t("ayarlar.tab.tema") },
            { value: "profil", label: t("ayarlar.tab.profil") },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === "genel" && (
        <Card>
          <Row label={t("ayarlar.bildirimler.label")} hint={t("ayarlar.bildirimler.hint")}>
            <Switch defaultChecked />
          </Row>
          <Row label={t("ayarlar.epostaBildirimleri.label")} hint={t("ayarlar.epostaBildirimleri.hint")}>
            <Switch defaultChecked />
          </Row>
          <Row label={t("ayarlar.gizliHesap.label")} hint={t("ayarlar.gizliHesap.hint")}>
            <Switch />
          </Row>
          <Row label={t("ayarlar.okumaHatirlaticilari.label")} hint={t("ayarlar.okumaHatirlaticilari.hint")}>
            <Switch defaultChecked />
          </Row>
          <Row label={t("nav.language")}>
            <Tabs
              variant="segmented"
              size="sm"
              items={[{ value: "tr", label: "TR" }, { value: "en", label: "EN" }]}
              value={locale}
              onChange={(v) => setLocale(v as "tr" | "en")}
            />
          </Row>
          <div style={{ paddingTop: 18 }}>
            <Button
              variant="menu"
              onClick={async () => {
                await logout();
                router.push("/giris");
              }}
            >
              {t("ayarlar.cikisYap")}
            </Button>
          </div>
        </Card>
      )}

      {tab === "tema" && (
        <Card title={t("ayarlar.vurguRengi")}>
          <div style={{ display: "flex", gap: 12 }}>
            {SWATCHES.map((c) => (
              <button
                key={c}
                onClick={() => setAccent(c)}
                aria-label={c}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: c,
                  border: accent.toLowerCase() === c.toLowerCase() ? "3px solid var(--text-primary)" : "1px solid var(--border-default)",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
          <div style={{ marginTop: 18 }}>
            <Row label={t("ayarlar.koyuMod.label")} hint={t("ayarlar.koyuMod.hint")}>
              <Switch />
            </Row>
          </div>
        </Card>
      )}

      {tab === "profil" && (
        <Card style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input label={t("ayarlar.adSoyad")} defaultValue={user?.name} />
          <Input label={t("ayarlar.kullaniciAdi")} defaultValue={user?.username} />
          <Input label={t("ayarlar.eposta")} defaultValue={user?.email} type="email" />
          <Input label={t("ayarlar.davetKodu")} placeholder={t("ayarlar.davetKodu.placeholder")} hint={t("ayarlar.davetKodu.hint")} />
          <Input
            ref={profileImageRef}
            label={t("image.profileUrl")}
            placeholder="https://..."
            defaultValue={user?.profileImageUrl}
          />
          <Input
            ref={bannerRef}
            label={t("ayarlar.profilBanner")}
            hint={t("image.bannerHint.profile")}
            placeholder="https://..."
            defaultValue={user?.bannerUrl}
          />
          <div>
            <Button variant="primary" onClick={saveProfileImages}>
              {t("common.save")}
            </Button>
          </div>
        </Card>
      )}

      {tab === "profil" && user && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: "var(--fs-h3)", fontWeight: 600, marginBottom: 6 }}>{t("showcase.title")}</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-3)", marginBottom: 16 }}>{t("showcase.hint")}</p>
          <ShowcaseEditor userId={user._id} />
        </div>
      )}
    </>
  );
}
