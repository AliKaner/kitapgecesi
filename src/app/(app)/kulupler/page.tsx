"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ScreenTitle } from "@/components/layout/Screen";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ImageAttachment, useImageUpload } from "@/components/feed/ImageAttachment";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

export default function KuluplerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useT();
  const clubs = useQuery(api.clubs.listClubs, {});
  const createClub = useMutation(api.clubs.createClub);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const avatarUpload = useImageUpload();
  const bannerUpload = useImageUpload();

  const submit = async () => {
    if (!user || !name.trim()) return;
    const clubId = await createClub({
      name: name.trim(),
      description: description.trim(),
      avatarUrl: avatarUpload.imageUrl.trim() || undefined,
      bannerUrl: bannerUpload.imageUrl.trim(),
      privacyMode: "public",
      leaderId: user._id,
    });
    setCreating(false);
    setName("");
    setDescription("");
    avatarUpload.setImageUrl("");
    bannerUpload.setImageUrl("");
    router.push(`/kulup/${clubId}`);
  };

  return (
    <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <ScreenTitle>{t("nav.kulupler")}</ScreenTitle>
          <Button variant="primary" size="sm" icon="plus" onClick={() => setCreating((v) => !v)}>
            {t("kulup.create")}
          </Button>
        </div>

        {creating && (
          <Card style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
            <Input label={t("kulup.fields.name")} value={name} onChange={(e) => setName(e.target.value)} />
            <Input label={t("liste.fields.description")} value={description} onChange={(e) => setDescription(e.target.value)} />
            <div>
              <div style={{ fontSize: "var(--fs-body-3)", fontWeight: "var(--fw-medium)" as unknown as number, color: "var(--text-secondary)", marginBottom: 7 }}>{t("image.profileUrl")}</div>
              <ImageAttachment imageUrl={avatarUpload.imageUrl} setImageUrl={avatarUpload.setImageUrl} uploading={avatarUpload.uploading} handleFiles={avatarUpload.handleFiles} />
            </div>
            <div>
              <div style={{ fontSize: "var(--fs-body-3)", fontWeight: "var(--fw-medium)" as unknown as number, color: "var(--text-secondary)", marginBottom: 7 }}>{t("image.bannerUrl")}</div>
              <ImageAttachment imageUrl={bannerUpload.imageUrl} setImageUrl={bannerUpload.setImageUrl} uploading={bannerUpload.uploading} handleFiles={bannerUpload.handleFiles} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="primary" onClick={submit} disabled={!name.trim()}>
                {t("common.save")}
              </Button>
              <Button variant="menu" onClick={() => setCreating(false)}>
                {t("common.cancel")}
              </Button>
            </div>
          </Card>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {clubs?.map((c) => (
            <Card key={c._id} hover style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }} onClick={() => router.push(`/kulup/${c._id}`)}>
              <div style={{ height: 80, borderRadius: "var(--radius-md)", background: c.bannerUrl ? `url(${c.bannerUrl}) center/cover` : "var(--surface-tint)", position: "relative" }}>
                <Avatar
                  src={c.avatarUrl}
                  name={c.name}
                  size={40}
                  style={{ position: "absolute", left: 10, bottom: -14, boxShadow: "0 0 0 2px var(--surface-card)" }}
                />
              </div>
              <div style={{ fontSize: "var(--fs-body-1)", fontWeight: "var(--fw-semibold)" as unknown as number, marginTop: 8 }}>{c.name}</div>
              <div style={{ fontSize: "var(--fs-body-3)", color: "var(--text-secondary)" }}>{c.description}</div>
            </Card>
          ))}
          {clubs && clubs.length === 0 && <p style={{ color: "var(--text-secondary)" }}>{t("kulup.empty")}</p>}
        </div>
    </>
  );
}
