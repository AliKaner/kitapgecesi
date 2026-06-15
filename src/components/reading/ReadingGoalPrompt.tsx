"use client";

import { CSSProperties, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

const QUICK_PICKS = [12, 24, 36, 52];

/* Mini preview ring — purely decorative, hints at what the goal widget becomes. */
function PreviewRing() {
  const r = 18;
  const c = 2 * Math.PI * r;
  const pct = 35;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" style={{ flex: "none" }}>
      <circle cx="24" cy="24" r={r} fill="none" stroke="var(--border-default)" strokeWidth="5" />
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        transform="rotate(-90 24 24)"
        opacity={0.55}
      />
    </svg>
  );
}

export function ReadingGoalPrompt() {
  const { t } = useT();
  const { user } = useAuth();
  const setReadingGoal = useMutation(api.users.setReadingGoal);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("24");
  const [saving, setSaving] = useState(false);

  // Only for signed-in users who haven't set a goal yet.
  if (!user || user.readingGoal) return null;

  const save = async () => {
    const n = Math.floor(Number(value));
    if (!n || n <= 0) return;
    setSaving(true);
    try {
      await setReadingGoal({ userId: user._id, readingGoal: n });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card
        padding={14}
        tone="tint"
        hover
        onClick={() => setOpen(true)}
        style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 10 } as CSSProperties}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <PreviewRing />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>{t("readingGoal.promptTitle")}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{t("readingGoal.promptDesc")}</div>
          </div>
        </div>
        <Button variant="primary" size="sm" icon="plus" fullWidth>
          {t("readingGoal.create")}
        </Button>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={t("readingGoal.modalTitle")}>
        <p style={{ fontSize: "var(--fs-body-2)", color: "var(--text-secondary)", marginBottom: 16 }}>
          {t("readingGoal.modalDesc")}
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {QUICK_PICKS.map((n) => {
            const active = String(n) === value;
            return (
              <button
                key={n}
                onClick={() => setValue(String(n))}
                style={{
                  padding: "7px 14px",
                  borderRadius: "999px",
                  border: `1px solid ${active ? "var(--accent)" : "var(--border-default)"}`,
                  background: active ? "var(--accent-tint)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-primary)",
                  fontSize: "var(--fs-body-2)",
                  fontWeight: 500,
                  cursor: "pointer",
                } as CSSProperties}
              >
                {n}
              </button>
            );
          })}
        </div>
        <Input
          type="number"
          min={1}
          label={t("readingGoal.booksLabel")}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" onClick={save} disabled={saving || !Number(value)}>
            {t("readingGoal.save")}
          </Button>
        </div>
      </Modal>
    </>
  );
}
