"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ScreenTitle } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
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

  const submit = async () => {
    if (!user || !name.trim()) return;
    const clubId = await createClub({
      name: name.trim(),
      description: description.trim(),
      bannerUrl: "",
      privacyMode: "public",
      leaderId: user._id,
    });
    setCreating(false);
    setName("");
    setDescription("");
    router.push(`/kulup/${clubId}`);
  };

  return (
    <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <ScreenTitle>{t("nav.kulupler")}</ScreenTitle>
          <Button variant="primary" size="sm" icon="plus" onClick={() => setCreating((v) => !v)}>
            Kulüp Oluştur
          </Button>
        </div>

        {creating && (
          <Card style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
            <Input label="Kulüp Adı" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Açıklama" value={description} onChange={(e) => setDescription(e.target.value)} />
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
              <div style={{ height: 80, borderRadius: "var(--radius-md)", background: c.bannerUrl ? `url(${c.bannerUrl}) center/cover` : "var(--surface-tint)" }} />
              <div style={{ fontSize: "var(--fs-body-1)", fontWeight: "var(--fw-semibold)" as unknown as number }}>{c.name}</div>
              <div style={{ fontSize: "var(--fs-body-3)", color: "var(--text-secondary)" }}>{c.description}</div>
            </Card>
          ))}
          {clubs && clubs.length === 0 && <p style={{ color: "var(--text-secondary)" }}>Henüz bir kulüp yok.</p>}
        </div>
    </>
  );
}
