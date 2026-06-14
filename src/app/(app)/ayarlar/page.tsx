"use client";

import { CSSProperties, ReactNode, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConvex, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ScreenTitle } from "@/components/layout/Screen";
import { Avatar } from "@/components/ui/Avatar";
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

function ImageUploadField({
  label,
  hint,
  value,
  onUploaded,
  variant,
}: {
  label: string;
  hint?: string;
  value?: string;
  onUploaded: (url: string) => void;
  variant: "avatar" | "banner";
}) {
  const { t } = useT();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const convex = useConvex();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await res.json();
      const url = await convex.query(api.files.getUrl, { storageId });
      if (url) onUploaded(url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div style={{ fontSize: "var(--fs-body-3)", fontWeight: "var(--fw-medium)" as unknown as number, color: "var(--text-secondary)", marginBottom: 7 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {variant === "avatar" ? (
          <Avatar src={value} name={label} size={56} />
        ) : (
          <div style={{ width: 120, height: 56, borderRadius: "var(--radius-md)", overflow: "hidden", background: "var(--surface-sunken)", flex: "none" }}>
            {value && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" } as CSSProperties} />
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0])}
          style={{ display: "none" }}
        />
        <Button variant="menu" size="sm" type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? t("composer.uploading") : t("common.change")}
        </Button>
      </div>
      {hint && <div style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-3)", marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

export default function AyarlarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState(initialTab === "profil" || initialTab === "tema" ? initialTab : "genel");
  const { user, logout } = useAuth();
  const { t, locale, setLocale } = useT();
  const { accent, setAccent } = useTheme();
  const updateProfileImages = useMutation(api.users.updateProfileImages);
  const setReadingGoal = useMutation(api.users.setReadingGoal);
  const readingGoalRef = useRef<HTMLInputElement>(null);

  const saveReadingGoal = async () => {
    if (!user) return;
    const raw = readingGoalRef.current?.value ?? "";
    const value = raw === "" ? undefined : Number(raw);
    await setReadingGoal({ userId: user._id, readingGoal: value && value > 0 ? value : undefined });
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
          <Row label={t("ayarlar.yillikHedef.label")} hint={t("ayarlar.yillikHedef.hint")}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Input
                ref={readingGoalRef}
                type="number"
                min={1}
                fullWidth={false}
                style={{ width: 80 }}
                defaultValue={user?.readingGoal ?? ""}
                placeholder="48"
              />
              <Button variant="menu" size="sm" onClick={saveReadingGoal}>
                {t("common.save")}
              </Button>
            </div>
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
          <ImageUploadField
            variant="avatar"
            label={t("ayarlar.profilFoto")}
            value={user?.profileImageUrl}
            onUploaded={(url) => user && updateProfileImages({ userId: user._id, profileImageUrl: url })}
          />
          <ImageUploadField
            variant="banner"
            label={t("ayarlar.profilBanner")}
            hint={t("image.bannerHint.profile")}
            value={user?.bannerUrl}
            onUploaded={(url) => user && updateProfileImages({ userId: user._id, bannerUrl: url })}
          />
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
