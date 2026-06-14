"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ScreenTitle } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

const ORGS = [
  { name: "LÖSEV", initials: "LÖ", color: "#C0432F", descriptionKey: "bagis.org.losev" as const },
  { name: "TEMA", initials: "TE", color: "#5B913B", descriptionKey: "bagis.org.tema" as const },
  { name: "Darüşşafaka", initials: "DA", color: "#2A6FDB", descriptionKey: "bagis.org.darussafaka" as const },
  { name: "Türkiye Eğitim Gönüllüleri", initials: "TE", color: "#C8881F", descriptionKey: "bagis.org.tegv" as const },
];

const DONATE_AMOUNT = 10;

function formatDate(ts: number) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(ts);
}

export default function BagisPage() {
  const { t } = useT();
  const [tab, setTab] = useState("Bağış Yap");
  const { user } = useAuth();
  const history = useQuery(api.donations.getDonationHistory, user ? { userId: user._id } : "skip");
  const donate = useMutation(api.donations.donate);

  return (
    <>
      <ScreenTitle sub={user ? t("bagis.balance", { amount: user.yaprak.toLocaleString("tr-TR") }) : undefined}>{t("nav.bagis")}</ScreenTitle>
      <div style={{ marginBottom: 26 }}>
        <Tabs
          items={[
            { value: "Bağış Yap", label: t("bagis.tab.donate") },
            { value: "Bağışlarınız", label: t("bagis.tab.yours") },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === "Bağış Yap" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {ORGS.map((org) => (
            <Card key={org.name} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: org.color,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "var(--fw-semibold)" as unknown as number,
                  flex: "none",
                }}
              >
                {org.initials}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "var(--fs-h3)", fontWeight: 600 }}>{org.name}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-3)" }}>{t(org.descriptionKey)}</div>
              </div>
              <Button
                variant="primary"
                size="sm"
                disabled={!user || user.yaprak < DONATE_AMOUNT}
                onClick={() => user && donate({ userId: user._id, organizationName: org.name, yaprakAmount: DONATE_AMOUNT })}
              >
                {t("bagis.donateButton", { amount: DONATE_AMOUNT })}
              </Button>
            </Card>
          ))}
        </div>
      )}

      {tab === "Bağışlarınız" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {(history ?? []).map((d) => (
            <Card key={d._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "var(--fs-body-2)", fontWeight: "var(--fw-medium)" as unknown as number }}>{d.organizationName}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-3)" }}>{formatDate(d.createdAt)}</div>
              </div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 22 }}>{t("bagis.yaprakAmount", { amount: d.yaprakSpent })}</div>
            </Card>
          ))}
          {history && history.length === 0 && <p style={{ color: "var(--text-secondary)" }}>{t("bagis.empty")}</p>}
        </div>
      )}
    </>
  );
}
