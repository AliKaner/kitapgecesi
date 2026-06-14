"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ScreenTitle } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { useAuth } from "@/lib/auth/AuthProvider";

const ORGS = [
  { name: "LÖSEV", initials: "LÖ", color: "#C0432F", description: "Lösemili Çocuklar Vakfı'na bağış yap." },
  { name: "TEMA", initials: "TE", color: "#5B913B", description: "Doğal varlıkları koruma çalışmalarını destekle." },
  { name: "Darüşşafaka", initials: "DA", color: "#2A6FDB", description: "Eğitim bursları için kaynak sağla." },
  { name: "Türkiye Eğitim Gönüllüleri", initials: "TE", color: "#C8881F", description: "Çocukların eğitimine destek ol." },
];

const DONATE_AMOUNT = 10;

function formatDate(ts: number) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(ts);
}

export default function BagisPage() {
  const [tab, setTab] = useState("Bağış Yap");
  const { user } = useAuth();
  const history = useQuery(api.donations.getDonationHistory, user ? { userId: user._id } : "skip");
  const donate = useMutation(api.donations.donate);

  return (
    <>
      <ScreenTitle sub={user ? `Bakiyeniz: ${user.yaprak.toLocaleString("tr-TR")} yaprak` : undefined}>Bağış</ScreenTitle>
      <div style={{ marginBottom: 26 }}>
        <Tabs items={["Bağış Yap", "Bağışlarınız"]} value={tab} onChange={setTab} />
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
                <div style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-3)" }}>{org.description}</div>
              </div>
              <Button
                variant="primary"
                size="sm"
                disabled={!user || user.yaprak < DONATE_AMOUNT}
                onClick={() => user && donate({ userId: user._id, organizationName: org.name, yaprakAmount: DONATE_AMOUNT })}
              >
                {DONATE_AMOUNT} Yaprak Bağışla
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
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 22 }}>{d.yaprakSpent} yaprak</div>
            </Card>
          ))}
          {history && history.length === 0 && <p style={{ color: "var(--text-secondary)" }}>Henüz bağış yapmadınız.</p>}
        </div>
      )}
    </>
  );
}
