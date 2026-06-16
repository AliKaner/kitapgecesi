"use client";

import { CSSProperties, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvex, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Tag } from "../ui/Tag";
import { Icon, IconName } from "../ui/Icon";
import { Avatar } from "../ui/Avatar";
import { BookCover } from "../book/BookCover";
import { StarRating } from "../ui/StarRating";
import { ImageAttachment } from "../feed/ImageAttachment";
import { useT } from "@/lib/i18n/I18nProvider";

/* Profile showcase widgets — a registry of configurable cards a user can place
   on their profile. Each type has a config editor (used in settings) and a
   read-only view (rendered on the profile). Config is persisted as a JSON
   string on the `showcases` table. */

export type WidgetType =
  | "idCard"
  | "favorites"
  | "quote"
  | "review"
  | "list"
  | "favoriteClub"
  | "target"
  | "author";

export const WIDGET_ORDER: WidgetType[] = [
  "idCard",
  "favorites",
  "quote",
  "review",
  "list",
  "favoriteClub",
  "target",
  "author",
];

export const WIDGET_META: Record<WidgetType, { labelKey: string; icon: IconName }> = {
  idCard: { labelKey: "showcase.widget.idCard", icon: "user" },
  favorites: { labelKey: "showcase.widget.favorites", icon: "heart" },
  quote: { labelKey: "showcase.widget.quote", icon: "book" },
  review: { labelKey: "showcase.widget.review", icon: "star" },
  list: { labelKey: "showcase.widget.list", icon: "list" },
  favoriteClub: { labelKey: "showcase.widget.favoriteClub", icon: "library" },
  target: { labelKey: "showcase.widget.target", icon: "calendar" },
  author: { labelKey: "showcase.widget.author", icon: "user" },
};

export type ShowcaseConfig = Record<string, unknown>;

const MAX_FAVORITE_BOOKS = 6;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {children}
    </div>
  );
}

// ── Shared pickers ──────────────────────────────────────────────────

function BookPicker({ onPick, exclude = [] }: { onPick: (id: Id<"books">) => void; exclude?: Id<"books">[] }) {
  const { t } = useT();
  const [q, setQ] = useState("");
  const results = useQuery(api.books.searchLocalBooks, q.trim() ? { query: q.trim() } : "skip");
  const visible = (results ?? []).filter((b) => !exclude.includes(b._id));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Input icon="search" placeholder={t("showcase.bookSearchPlaceholder")} value={q} onChange={(e) => setQ(e.target.value)} />
      {q.trim() && visible.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
          {visible.map((b) => (
            <div
              key={b._id}
              onClick={() => {
                onPick(b._id);
                setQ("");
              }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, borderRadius: "var(--radius-md)", cursor: "pointer", background: "var(--surface-sunken)" }}
            >
              <BookCover src={b.coverUrl || undefined} title={b.title} width={28} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "var(--fs-body-2)", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.title}</div>
                <div style={{ fontSize: "var(--fs-body-3)", color: "var(--text-secondary)" }}>{b.author}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Editors ─────────────────────────────────────────────────────────

function IdCardEditor({ config, onChange }: { config: ShowcaseConfig; onChange: (c: ShowcaseConfig) => void }) {
  const { t } = useT();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const convex = useConvex();
  const [uploading, setUploading] = useState(false);
  const imageUrl = (config.imageUrl as string) ?? "";

  const handleFiles = async (files: FileList | File[] | null | undefined) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = await res.json();
      const url = await convex.query(api.files.getUrl, { storageId });
      if (url) onChange({ ...config, imageUrl: url });
    } finally {
      setUploading(false);
    }
  };

  const field = (key: string, label: string, opts?: { number?: boolean }) => (
    <Input
      label={label}
      type={opts?.number ? "number" : "text"}
      value={(config[key] as string) ?? ""}
      onChange={(e) => onChange({ ...config, [key]: e.target.value })}
    />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <SectionTitle>{t("showcase.idCard.photo")}</SectionTitle>
        <ImageAttachment
          imageUrl={imageUrl}
          setImageUrl={(url) => onChange({ ...config, imageUrl: url })}
          uploading={uploading}
          handleFiles={handleFiles}
        />
      </div>
      {field("name", t("showcase.idCard.name"))}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>{field("age", t("showcase.idCard.age"), { number: true })}</div>
        <div style={{ flex: 1 }}>{field("height", t("showcase.idCard.height"))}</div>
      </div>
      {field("location", t("showcase.idCard.location"))}
      {field("about", t("showcase.idCard.about"))}
    </div>
  );
}

function FavoritesEditor({ config, onChange }: { config: ShowcaseConfig; onChange: (c: ShowcaseConfig) => void }) {
  const { t } = useT();
  const bookIds = ((config.bookIds as Id<"books">[]) ?? []);
  const selected = useQuery(api.books.getBooksByIds, bookIds.length ? { bookIds } : "skip");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {selected && selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {selected.map((b) => (
            <Tag key={b._id} onRemove={() => onChange({ ...config, bookIds: bookIds.filter((id) => id !== b._id) })}>
              {b.title}
            </Tag>
          ))}
        </div>
      )}
      {bookIds.length < MAX_FAVORITE_BOOKS && (
        <BookPicker exclude={bookIds} onPick={(id) => onChange({ ...config, bookIds: [...bookIds, id] })} />
      )}
      <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-3)", margin: 0 }}>{t("showcase.maxBooksHint", { max: MAX_FAVORITE_BOOKS })}</p>
    </div>
  );
}

function QuoteEditor({ config, onChange }: { config: ShowcaseConfig; onChange: (c: ShowcaseConfig) => void }) {
  const { t } = useT();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Input placeholder={t("showcase.quote.placeholder")} value={(config.text as string) ?? ""} onChange={(e) => onChange({ ...config, text: e.target.value })} />
      <Input placeholder={t("showcase.quote.source")} value={(config.source as string) ?? ""} onChange={(e) => onChange({ ...config, source: e.target.value })} />
    </div>
  );
}

function ReviewEditor({ config, onChange }: { config: ShowcaseConfig; onChange: (c: ShowcaseConfig) => void }) {
  const { t } = useT();
  const bookId = (config.bookId as Id<"books">) ?? null;
  const book = useQuery(api.books.getBook, bookId ? { bookId } : "skip");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {bookId && book ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Tag onRemove={() => onChange({ ...config, bookId: undefined })}>{book.title}</Tag>
        </div>
      ) : (
        <BookPicker onPick={(id) => onChange({ ...config, bookId: id })} />
      )}
      {bookId && (
        <>
          <StarRating compact={false} value={(config.rating as number) ?? 0} onRate={(v) => onChange({ ...config, rating: v })} size={22} showValue={false} />
          <Input placeholder={t("showcase.review.placeholder")} value={(config.text as string) ?? ""} onChange={(e) => onChange({ ...config, text: e.target.value })} />
        </>
      )}
    </div>
  );
}

function ListEditor({ config, userId, onChange }: { config: ShowcaseConfig; userId: Id<"users">; onChange: (c: ShowcaseConfig) => void }) {
  const { t } = useT();
  const lists = useQuery(api.lists.getUserLists, { creatorId: userId, includePrivate: true, currentUserId: userId });
  const selected = (config.listId as Id<"lists">) ?? null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <SectionTitle>{t("showcase.pickList")}</SectionTitle>
      {(lists ?? []).map((l) => (
        <button
          key={l._id}
          type="button"
          onClick={() => onChange({ ...config, listId: l._id })}
          style={{
            textAlign: "left",
            padding: "8px 10px",
            borderRadius: "var(--radius-md)",
            border: `1px solid ${selected === l._id ? "var(--accent)" : "var(--border-default)"}`,
            background: selected === l._id ? "var(--accent-tint)" : "var(--surface-card)",
            color: "var(--text-primary)",
            fontSize: "var(--fs-body-2)",
            cursor: "pointer",
          }}
        >
          {l.title}
        </button>
      ))}
    </div>
  );
}

function ClubEditor({ config, userId, onChange }: { config: ShowcaseConfig; userId: Id<"users">; onChange: (c: ShowcaseConfig) => void }) {
  const { t } = useT();
  const clubs = useQuery(api.clubs.getUserClubs, { userId });
  const selected = (config.clubId as Id<"clubs">) ?? null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <SectionTitle>{t("showcase.pickClub")}</SectionTitle>
      {(clubs ?? []).map((c) => (
        <button
          key={c._id}
          type="button"
          onClick={() => onChange({ ...config, clubId: c._id })}
          style={{
            textAlign: "left",
            padding: "8px 10px",
            borderRadius: "var(--radius-md)",
            border: `1px solid ${selected === c._id ? "var(--accent)" : "var(--border-default)"}`,
            background: selected === c._id ? "var(--accent-tint)" : "var(--surface-card)",
            color: "var(--text-primary)",
            fontSize: "var(--fs-body-2)",
            cursor: "pointer",
          }}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}

function AuthorEditor({ config, onChange }: { config: ShowcaseConfig; onChange: (c: ShowcaseConfig) => void }) {
  const { t } = useT();
  const [search, setSearch] = useState("");
  const authorId = (config.authorId as Id<"authors">) ?? null;
  const selected = useQuery(api.authors.getAuthor, authorId ? { authorId } : "skip");
  const results = useQuery(api.authors.searchAuthors, search.trim() ? { query: search.trim() } : "skip");
  if (selected) {
    return <Tag onRemove={() => onChange({ ...config, authorId: undefined })}>{selected.name}</Tag>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Input icon="search" placeholder={t("showcase.authorSearchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
      {(results ?? []).map((a) => (
        <div
          key={a._id}
          onClick={() => {
            onChange({ ...config, authorId: a._id });
            setSearch("");
          }}
          style={{ padding: "8px 10px", borderRadius: "var(--radius-md)", cursor: "pointer", background: "var(--surface-sunken)", fontSize: "var(--fs-body-2)" }}
        >
          {a.name}
        </div>
      ))}
    </div>
  );
}

function TargetEditor() {
  const { t } = useT();
  return <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-3)", margin: 0 }}>{t("showcase.target.hint")}</p>;
}

export function ShowcaseConfigEditor({
  type,
  config,
  userId,
  onChange,
}: {
  type: WidgetType;
  config: ShowcaseConfig;
  userId: Id<"users">;
  onChange: (c: ShowcaseConfig) => void;
}) {
  switch (type) {
    case "idCard":
      return <IdCardEditor config={config} onChange={onChange} />;
    case "favorites":
      return <FavoritesEditor config={config} onChange={onChange} />;
    case "quote":
      return <QuoteEditor config={config} onChange={onChange} />;
    case "review":
      return <ReviewEditor config={config} onChange={onChange} />;
    case "list":
      return <ListEditor config={config} userId={userId} onChange={onChange} />;
    case "favoriteClub":
      return <ClubEditor config={config} userId={userId} onChange={onChange} />;
    case "author":
      return <AuthorEditor config={config} onChange={onChange} />;
    case "target":
      return <TargetEditor />;
    default:
      return null;
  }
}

// ── Views (rendered on the profile) ─────────────────────────────────

function WidgetCard({ titleKey, children }: { titleKey?: string; children: React.ReactNode }) {
  const { t } = useT();
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {titleKey && <SectionTitle>{t(titleKey as Parameters<typeof t>[0])}</SectionTitle>}
      {children}
    </Card>
  );
}

function IdCardView({ config }: { config: ShowcaseConfig }) {
  const { t } = useT();
  const name = (config.name as string) || "";
  const row = (label: string, value?: string) =>
    value ? (
      <div style={{ display: "flex", gap: 8, fontSize: "var(--fs-body-3)" }}>
        <span style={{ width: 56, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", fontSize: 10, paddingTop: 2 }}>{label}</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{value}</span>
      </div>
    ) : null;

  return (
    <Card padding={0} style={{ overflow: "hidden", border: "1px solid var(--border-strong)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "var(--accent-tint)", color: "var(--accent-active)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em" }}>
        <Icon name="user" size={14} color="var(--accent)" />
        {t("showcase.idCard.header")} · KİTAPGECESİ
      </div>
      <div style={{ display: "flex", gap: 16, padding: 16 }}>
        <div style={{ width: 92, height: 116, flex: "none", borderRadius: "var(--radius-md)", overflow: "hidden", background: "var(--surface-sunken)", border: "1px solid var(--border-default)" }}>
          {config.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.imageUrl as string} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" } as CSSProperties} />
          ) : (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-secondary)", opacity: 0.5 }}>
              <Icon name="user" size={32} />
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {name && <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, lineHeight: 1.1 }}>{name}</div>}
          {row(t("showcase.idCard.age"), config.age as string)}
          {row(t("showcase.idCard.height"), config.height as string)}
          {row(t("showcase.idCard.location"), config.location as string)}
        </div>
      </div>
      {config.about ? (
        <p style={{ margin: 0, padding: "0 16px 16px", color: "var(--text-secondary)", fontSize: "var(--fs-body-3)", lineHeight: 1.6 }}>{config.about as string}</p>
      ) : null}
    </Card>
  );
}

function FavoritesView({ config }: { config: ShowcaseConfig }) {
  const router = useRouter();
  const bookIds = ((config.bookIds as Id<"books">[]) ?? []);
  const books = useQuery(api.books.getBooksByIds, bookIds.length ? { bookIds } : "skip");
  if (!bookIds.length) return null;
  return (
    <WidgetCard titleKey="showcase.widget.favorites">
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }} className="kg-hscroll">
        {(books ?? []).map((b) => (
          <BookCover key={b._id} src={b.coverUrl || undefined} title={b.title} width={84} onClick={() => router.push(`/kitap/${b._id}`)} style={{ cursor: "pointer", flex: "none" }} />
        ))}
      </div>
    </WidgetCard>
  );
}

function QuoteView({ config }: { config: ShowcaseConfig }) {
  const text = (config.text as string) || "";
  const source = (config.source as string) || "";
  if (!text) return null;
  return (
    <WidgetCard titleKey="showcase.widget.quote">
      <blockquote style={{ margin: 0, borderLeft: "3px solid var(--accent)", paddingLeft: 14 }}>
        <p style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 20, lineHeight: 1.4, color: "var(--text-primary)" }}>“{text}”</p>
        {source && <footer style={{ marginTop: 8, color: "var(--text-secondary)", fontSize: "var(--fs-body-3)" }}>— {source}</footer>}
      </blockquote>
    </WidgetCard>
  );
}

function ReviewView({ config }: { config: ShowcaseConfig }) {
  const router = useRouter();
  const bookId = (config.bookId as Id<"books">) ?? null;
  const book = useQuery(api.books.getBook, bookId ? { bookId } : "skip");
  if (!bookId || !book) return null;
  return (
    <WidgetCard titleKey="showcase.widget.review">
      <div style={{ display: "flex", gap: 14 }}>
        <BookCover src={book.coverUrl || undefined} title={book.title} width={64} onClick={() => router.push(`/kitap/${book._id}`)} style={{ cursor: "pointer", flex: "none" }} />
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontWeight: "var(--fw-semibold)" as unknown as number }}>{book.title}</div>
          <div style={{ fontSize: "var(--fs-body-3)", color: "var(--text-secondary)" }}>{book.author}</div>
          {typeof config.rating === "number" && config.rating > 0 && <StarRating compact={false} value={config.rating as number} size={16} showValue={false} />}
          {config.text ? <p style={{ margin: "4px 0 0", fontSize: "var(--fs-body-2)", lineHeight: 1.5 }}>{config.text as string}</p> : null}
        </div>
      </div>
    </WidgetCard>
  );
}

function ListView({ config }: { config: ShowcaseConfig }) {
  const router = useRouter();
  const listId = (config.listId as Id<"lists">) ?? null;
  const list = useQuery(api.lists.getList, listId ? { listId } : "skip");
  if (!listId || !list) return null;
  return (
    <WidgetCard titleKey="showcase.widget.list">
      <div
        onClick={() => router.push(`/listeler/${list._id}`)}
        style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
      >
        <div style={{ display: "flex" }}>
          {list.books.slice(0, 4).map((b, i) => (
            <BookCover key={b._id} src={b.coverUrl || undefined} title={b.title} width={40} style={{ marginLeft: i === 0 ? 0 : -16, border: "1px solid var(--border-default)" }} />
          ))}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: "var(--fw-semibold)" as unknown as number }}>{list.title}</div>
          <div style={{ fontSize: "var(--fs-body-3)", color: "var(--text-secondary)" }}>{list.books.length} · ♥ {list.likeCount}</div>
        </div>
      </div>
    </WidgetCard>
  );
}

function ClubView({ config }: { config: ShowcaseConfig }) {
  const router = useRouter();
  const clubId = (config.clubId as Id<"clubs">) ?? null;
  const club = useQuery(api.clubs.getClub, clubId ? { clubId } : "skip");
  if (!clubId || !club) return null;
  return (
    <WidgetCard titleKey="showcase.widget.favoriteClub">
      <div onClick={() => router.push(`/kulup/${club._id}`)} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
        <Avatar src={club.avatarUrl} name={club.name} size={44} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: "var(--fw-semibold)" as unknown as number }}>{club.name}</div>
          <div style={{ fontSize: "var(--fs-body-3)", color: "var(--text-secondary)" }}>{club.memberCount} üye</div>
        </div>
      </div>
    </WidgetCard>
  );
}

function TargetView({ userId }: { userId: Id<"users"> }) {
  const { t } = useT();
  const goal = useQuery(api.users.getReadingGoalStats, { userId });
  if (!goal || !goal.target) return null;
  return (
    <WidgetCard titleKey="showcase.widget.target">
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontFamily: "var(--font-serif)", fontSize: 34, lineHeight: 1 }}>{goal.done}</span>
        <span style={{ color: "var(--text-secondary)" }}>/ {goal.target}</span>
        <span style={{ marginLeft: "auto", color: "var(--accent)", fontWeight: 600 }}>%{goal.pct}</span>
      </div>
      <div style={{ height: 8, borderRadius: "var(--radius-pill)", background: "var(--surface-sunken)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${goal.pct}%`, background: "var(--accent)" }} />
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: "var(--fs-body-3)", color: "var(--text-secondary)" }}>
        <span>{goal.pages.toLocaleString("tr-TR")} {t("contextRail.pages")}</span>
        <span>{goal.reviews} {t("contextRail.reviews")}</span>
        <span>{goal.quotes} {t("contextRail.quotes")}</span>
      </div>
    </WidgetCard>
  );
}

function AuthorView({ config }: { config: ShowcaseConfig }) {
  const router = useRouter();
  const authorId = (config.authorId as Id<"authors">) ?? null;
  const author = useQuery(api.authors.getAuthor, authorId ? { authorId } : "skip");
  if (!authorId || !author) return null;
  return (
    <WidgetCard titleKey="showcase.widget.author">
      <div onClick={() => router.push(`/yazar/${author._id}`)} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
        <Avatar src={author.photoUrl} name={author.name} size={44} />
        <div style={{ fontWeight: "var(--fw-semibold)" as unknown as number }}>{author.name}</div>
      </div>
    </WidgetCard>
  );
}

export function ShowcaseView({ type, config, userId }: { type: WidgetType; config: ShowcaseConfig; userId: Id<"users"> }) {
  switch (type) {
    case "idCard":
      return <IdCardView config={config} />;
    case "favorites":
      return <FavoritesView config={config} />;
    case "quote":
      return <QuoteView config={config} />;
    case "review":
      return <ReviewView config={config} />;
    case "list":
      return <ListView config={config} />;
    case "favoriteClub":
      return <ClubView config={config} />;
    case "target":
      return <TargetView userId={userId} />;
    case "author":
      return <AuthorView config={config} />;
    default:
      return null;
  }
}
