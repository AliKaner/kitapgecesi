"use client";

import { CSSProperties, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";
import { Icon } from "../ui/Icon";
import { BookCover } from "../book/BookCover";
import { StarRating } from "../ui/StarRating";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

/* Right context rail — search plus a set of book widgets (book of the month,
   popular books, the shelf) and the reading-goal card. */

const SHELF_IMG = "/shelf.png";

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
  const { user } = useAuth();
  const router = useRouter();
  const goal = useQuery(api.users.getReadingGoalStats, user ? { userId: user._id } : "skip");

  if (!user || !goal) return null;

  const today = new Date();
  const yearEnd = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
  const diffTime = yearEnd.getTime() - today.getTime();
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const remainingBooks = Math.max(0, goal.target - goal.done);

  let paceText = "";
  if (remainingBooks === 0) {
    paceText = "Hedefinizi tamamladınız! 🎉";
  } else {
    const booksPerDay = remainingBooks / diffDays;
    if (booksPerDay >= 1) {
      const rounded = Math.round(booksPerDay);
      paceText = `Günde ${rounded} kitap okumalısın`;
    } else {
      const daysPerBook = Math.round(diffDays / remainingBooks);
      paceText = daysPerBook === 1 ? "Günde 1 kitap okumalısın" : `${daysPerBook} günde bir kitap okumalısın`;
    }
  }

  return (
    <Card padding={20}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{t("contextRail.yearlyGoal")}</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
            {t("contextRail.goalSubtitle", { year: goal.year, target: goal.target })}
          </div>
        </div>
        <GoalRing pct={goal.pct} />
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "4px 0 16px" }}>
        <span style={{ fontFamily: "var(--font-serif)", fontSize: 34, lineHeight: 1 }}>{goal.done}</span>
        <span style={{ fontSize: 15, color: "var(--text-secondary)" }}>{t("contextRail.ofTarget", { target: goal.target })}</span>
      </div>

      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 8, 
        padding: "8px 12px", 
        borderRadius: "10px", 
        background: "var(--accent-tint)", 
        color: "var(--accent-active)", 
        fontSize: "13px", 
        fontWeight: 500, 
        marginBottom: 16 
      }}>
        <Icon name="calendar" size={14} color="var(--accent)" />
        <span>{paceText}</span>
      </div>

      {goal.doneBooks && goal.doneBooks.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Bu Yıl Okunan Kitaplar ({goal.doneBooks.length})
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }} className="kg-hscroll">
            {goal.doneBooks.map((b) => (
              <BookCover
                key={b._id}
                src={b.coverUrl || undefined}
                title={b.title}
                width={40}
                onClick={() => router.push(`/kitap/${b._id}`)}
                style={{ cursor: "pointer" }}
              />
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, paddingTop: 16, borderTop: "1px solid var(--border-default)" }}>
        <Stat n={goal.pages.toLocaleString("tr-TR")} l={t("contextRail.pages")} />
        <Stat n={goal.reviews} l={t("contextRail.reviews")} />
        <Stat n={goal.quotes} l={t("contextRail.quotes")} />
      </div>
    </Card>
  );
}

function BookOfMonth() {
  const { t } = useT();
  const router = useRouter();
  const { user } = useAuth();
  const b = useQuery(api.books.getBookOfMonth, {});
  const inLibrary = useQuery(
    api.library.getUserBook,
    user && b ? { userId: user._id, bookId: b._id } : "skip"
  );
  const setStatus = useMutation(api.library.setStatus);

  if (b === null) return null; // none set yet

  const added = !!inLibrary;
  const addToList = () => {
    if (!user || !b) return;
    setStatus({ userId: user._id, bookId: b._id, status: "want" });
  };

  return (
    <Card padding={20} title={t("contextRail.bookOfMonth")}>
      {b && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" }}>
          <BookCover src={b.coverUrl || undefined} title={b.title} width={120} style={{ marginBottom: 8 }} />
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, lineHeight: 1.1 }}>{b.title}</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{b.author}</div>
          {b.ratingCount > 0 && <StarRating value={b.avgRating} count={b.ratingCount} />}
          <Button size="sm" variant="primary" icon="book" fullWidth onClick={() => router.push(`/kitap/${b._id}`)} style={{ marginTop: 10 }}>
            {t("contextRail.read")}
          </Button>
          <Button
            size="sm"
            variant={added ? "primary" : "menu"}
            icon="bookmark"
            fullWidth
            onClick={addToList}
            disabled={!user}
            style={{ marginTop: 8 }}
          >
            {added ? t("common.saved") : t("contextRail.addToList")}
          </Button>
        </div>
      )}
    </Card>
  );
}

function PopularBooks() {
  const { t } = useT();
  const router = useRouter();
  const books = useQuery(api.books.getPopularBooks, { limit: 8 });
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!books || books.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 132; // book width (120) + gap (12)
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const action = (
    <div style={{ display: "flex", gap: 2, marginRight: -8 }}>
      <IconButton
        icon="chevron-right"
        size={28}
        style={{ transform: "rotate(180deg)" }}
        onClick={() => scroll("left")}
        label="Önceki"
      />
      <IconButton
        icon="chevron-right"
        size={28}
        onClick={() => scroll("right")}
        label="Sonraki"
      />
    </div>
  );

  return (
    <Card padding={20} title={t("contextRail.popular")} action={action}>
      <div
        ref={scrollRef}
        className="kg-hscroll"
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "safe center",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          margin: "0 -20px",
          padding: "0 20px 2px",
          scrollBehavior: "smooth",
        } as CSSProperties}
      >
        {books.map((b) => (
          <BookCover
            key={b._id}
            src={b.coverUrl || undefined}
            title={b.title}
            width={120}
            onClick={() => router.push(`/kitap/${b._id}`)}
            style={{ cursor: "pointer", flex: "none", scrollSnapAlign: "start" }}
          />
        ))}
      </div>
    </Card>
  );
}

// Slight per-slot height jitter so the shelf reads as real books, not a grid.
const SHELF_RATIOS = [1.5, 1.42, 1.54, 1.46, 1.52, 1.4, 1.5, 1.44, 1.53];

function BookShelf() {
  const { t } = useT();
  const router = useRouter();
  const books = useQuery(api.books.getPopularBooks, { limit: 9 });

  if (!books || books.length === 0) return null;
  const rows = [books.slice(0, 3), books.slice(3, 6), books.slice(6, 9)];

  return (
    <Card
      padding={20}
      title={t("contextRail.books")}
      action={
        <Link href="/kitaplar" className="kg-eyebrow" style={{ cursor: "pointer" }}>
          {t("common.all")}
        </Link>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((row, ri) => (
          <div key={ri}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8, padding: "0 4px" }}>
              {row.map((b, ci) => (
                <BookCover
                  key={b._id}
                  src={b.coverUrl || undefined}
                  title={b.title}
                  width={52}
                  ratio={SHELF_RATIOS[ri * 3 + ci]}
                  onClick={() => router.push(`/kitap/${b._id}`)}
                  style={{ cursor: "pointer" }}
                />
              ))}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SHELF_IMG} alt="" style={{ display: "block", width: "100%", height: "auto", marginTop: -1 }} />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ContextRail() {
  const { t } = useT();
  return (
    <aside
      className="kg-context-rail"
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
      <PopularBooks />
      <BookShelf />
      <ReadingGoal />
    </aside>
  );
}
