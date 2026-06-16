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
  const target = goal.target ?? 0;
  const remainingBooks = Math.max(0, target - goal.done);

  let paceText = "";
  if (target > 0) {
    if (remainingBooks === 0) {
      paceText = "Hedefinizi tamamladınız! 🎉";
    } else {
      const booksPerDay = remainingBooks / diffDays;
      if (booksPerDay > 1) {
        paceText = `Günde ${Math.ceil(booksPerDay)} kitap okumalısın`;
      } else {
        const daysPerBook = Math.max(1, Math.floor(diffDays / remainingBooks));
        paceText = daysPerBook === 1 ? "Günde 1 kitap okumalısın" : `${daysPerBook} günde 1 kitap okumalısın`;
      }
    }
  }

  return (
    <Card padding={20}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{t("contextRail.yearlyGoal")}</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
            {t("contextRail.goalSubtitle", { year: goal.year ?? new Date().getFullYear(), target: goal.target ?? 0 })}
          </div>
        </div>
        <GoalRing pct={goal.pct} />
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "4px 0 16px" }}>
        <span style={{ fontFamily: "var(--font-serif)", fontSize: 34, lineHeight: 1 }}>{goal.done}</span>
        <span style={{ fontSize: 15, color: "var(--text-secondary)" }}>{t("contextRail.ofTarget", { target: goal.target ?? 0 })}</span>
      </div>

      {paceText && (
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
      )}

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

  const edgeButton = (direction: "left" | "right"): CSSProperties => ({
    position: "absolute",
    top: "50%",
    transform: direction === "left" ? "translateY(-50%) rotate(180deg)" : "translateY(-50%)",
    [direction]: 4,
    zIndex: 2,
    boxShadow: "var(--shadow-sm)",
  });

  return (
    <Card padding={20} title={t("contextRail.popular")}>
      <div style={{ position: "relative", margin: "0 -20px" } as CSSProperties}>
        <div
          ref={scrollRef}
          className="kg-hscroll"
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            // Side padding equal to half the rail minus half a cover, so the
            // first (and any) book snaps to the visual centre of the rail.
            padding: "0 calc(50% - 60px) 2px",
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
              style={{ cursor: "pointer", flex: "none", scrollSnapAlign: "center" }}
            />
          ))}
        </div>
        <IconButton
          icon="chevron-right"
          size={32}
          variant="outline"
          style={edgeButton("left")}
          onClick={() => scroll("left")}
          label="Önceki"
        />
        <IconButton
          icon="chevron-right"
          size={32}
          variant="outline"
          style={edgeButton("right")}
          onClick={() => scroll("right")}
          label="Sonraki"
        />
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

type BookGenresProps = {};

const BookGenres = (props: BookGenresProps) => {
  const _props = props;
  const router = useRouter();
  const { t } = useT();

  const GENRES_LIST = [
    {
      name: "Edebiyat",
      bg: "#FFF5F0",
      color: "#E0532B",
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
          <line x1="16" y1="8" x2="2" y2="22" />
          <line x1="17.5" y1="15" x2="9" y2="15" />
        </svg>
      ),
    },
    {
      name: "Roman",
      bg: "#F0F5FF",
      color: "#2F54EB",
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 3v18" />
          <rect x="12" y="6" width="4" height="6" rx="0.5" />
        </svg>
      ),
    },
    {
      name: "Psikoloji",
      bg: "#F6FFED",
      color: "#52C41A",
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M4 14.5A2.5 2.5 0 0 1 6.5 12H20" />
          <path d="M4 9.5A2.5 2.5 0 0 1 6.5 7H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      name: "Duygu ve Düşünce",
      bg: "#E6F7FF",
      color: "#1890FF",
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 3v18" />
          <path d="M14 8.5c.8.8.8 2 0 2.8L12 13.5l-2-2.2c-.8-.8-.8-2 0-2.8s2-.8 2.8 0z" />
        </svg>
      ),
    },
    {
      name: "Felsefe",
      bg: "#FFF0F6",
      color: "#EB2F96",
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 3v18" />
          <circle cx="11.5" cy="10" r="1.5" />
          <circle cx="14.5" cy="10" r="1.5" />
          <path d="M10 10h1.5m1.5 0H13" />
        </svg>
      ),
    },
    {
      name: "Tarih",
      bg: "#FFFBE6",
      color: "#876400",
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 3v18" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="13" y1="8" x2="13" y2="14" />
          <line x1="15" y1="8" x2="15" y2="14" />
          <line x1="10.5" y1="8" x2="15.5" y2="8" />
          <line x1="10.5" y1="14" x2="15.5" y2="14" />
        </svg>
      ),
    },
    {
      name: "Bilim",
      bg: "#FFF1F0",
      color: "#F5222D",
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 3v18" />
          <ellipse cx="13" cy="10" rx="3.5" ry="1.2" transform="rotate(30 13 10)" />
          <ellipse cx="13" cy="10" rx="3.5" ry="1.2" transform="rotate(-30 13 10)" />
        </svg>
      ),
    },
    {
      name: "Tasavvuf",
      bg: "#FCF8E3",
      color: "#AD8B00",
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 3v18" />
          <path d="M13 7l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
        </svg>
      ),
    },
  ];

  return (
    <Card padding={20}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-primary)" }}>
          <line x1="8" x2="21" y1="6" y2="6" />
          <line x1="8" x2="21" y1="12" y2="12" />
          <line x1="8" x2="21" y1="18" y2="18" />
          <line x1="3" x2="3.01" y1="6" y2="6" />
          <line x1="3" x2="3.01" y1="12" y2="12" />
          <line x1="3" x2="3.01" y1="18" y2="18" />
        </svg>
        <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>
          {t("contextRail.bookGenres")}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {GENRES_LIST.map((g) => (
          <div
            key={g.name}
            onClick={() => router.push(`/kitaplar?genre=${g.name}`)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              padding: "6px 8px",
              borderRadius: "8px",
              transition: "background var(--dur-fast) var(--ease-soft)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-sunken)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                background: g.bg,
                color: g.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "none",
              }}
            >
              {g.icon}
            </div>
            <span style={{ fontSize: "var(--fs-body-2)", color: "var(--text-primary)", fontWeight: 500 }}>
              {g.name}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

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
      <BookGenres />
      <ReadingGoal />
    </aside>
  );
}
