"use client";

import Link from "next/link";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { BookCover } from "../book/BookCover";
import { StarRating } from "../ui/StarRating";
import { useT } from "@/lib/i18n/I18nProvider";

/* Right context rail — search, book of the month, reading-goal widget. */

const BOOK_OF_MONTH = {
  title: "Sıfır Noktasındaki Kadın",
  author: "Neval El Seddavi",
  rating: 5.0,
  cover: undefined,
};

const GOAL = { target: 48, done: 12, year: 2025, pages: "6.456", reviews: 78, quotes: 46, pct: 25 };

function GoalRing({ pct }: { pct: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" style={{ flex: "none" }}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--border-default)" strokeWidth="6" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        transform="rotate(-90 32 32)"
      />
      <text x="32" y="37" textAnchor="middle" style={{ font: "600 16px var(--font-sans)", fill: "var(--text-primary)" }}>
        %{pct}
      </text>
    </svg>
  );
}

function Stat({ n, l }: { n: string | number; l: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>{n}</span>
      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{l}</span>
    </div>
  );
}

function ReadingGoal() {
  const { t } = useT();
  const g = GOAL;
  return (
    <Card padding={20}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{t("contextRail.yearlyGoal")}</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
            {t("contextRail.goalSubtitle", { year: g.year, target: g.target })}
          </div>
        </div>
        <GoalRing pct={g.pct} />
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "4px 0 16px" }}>
        <span style={{ fontFamily: "var(--font-serif)", fontSize: 34, lineHeight: 1 }}>{g.done}</span>
        <span style={{ fontSize: 15, color: "var(--text-secondary)" }}>{t("contextRail.ofTarget", { target: g.target })}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, paddingTop: 16, borderTop: "1px solid var(--border-default)" }}>
        <Stat n={g.pages} l={t("contextRail.pages")} />
        <Stat n={g.reviews} l={t("contextRail.reviews")} />
        <Stat n={g.quotes} l={t("contextRail.quotes")} />
      </div>
    </Card>
  );
}

function BookOfMonth() {
  const { t } = useT();
  const b = BOOK_OF_MONTH;
  return (
    <Card
      padding={20}
      title={t("contextRail.bookOfMonth")}
      action={
        <Link href="/kitaplar" className="kg-eyebrow" style={{ cursor: "pointer" }}>
          {t("common.all")}
        </Link>
      }
    >
      <div style={{ display: "flex", gap: 16 }}>
        <BookCover src={b.cover} title={b.title} width={92} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 2 }}>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, lineHeight: 1.1 }}>{b.title}</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{b.author}</div>
          <StarRating value={b.rating} />
          <div style={{ marginTop: "auto", paddingTop: 8 }}>
            <Button size="sm" variant="primary" icon="book">
              {t("contextRail.read")}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ContextRail() {
  const { t } = useT();
  return (
    <aside
      style={{
        width: "var(--aside-width)",
        flex: "none",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        padding: "22px 24px 40px",
        borderLeft: "1px solid var(--border-default)",
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
      }}
    >
      <Input icon="search" pill placeholder={t("contextRail.searchPlaceholder")} />
      <BookOfMonth />
      <ReadingGoal />
    </aside>
  );
}
