"use client";

import { CSSProperties, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { IconButton } from "../ui/IconButton";
import { Input } from "../ui/Input";
import { Switch } from "../ui/Switch";
import { Tag } from "../ui/Tag";
import { useT } from "@/lib/i18n/I18nProvider";

const MAX_FAVORITE_BOOKS = 6;

const WIDGET_LABEL_KEYS = {
  favorites: "showcase.widget.favorites",
  author: "showcase.widget.author",
} as const;

type WidgetType = keyof typeof WIDGET_LABEL_KEYS;

interface LocalRow {
  _id: Id<"showcases">;
  widgetType: WidgetType;
  isEnabled: boolean;
  bookIds: Id<"books">[];
  authorId: Id<"authors"> | null;
}

function FavoritesEditor({ bookIds, onChange }: { bookIds: Id<"books">[]; onChange: (ids: Id<"books">[]) => void }) {
  const { t } = useT();
  const [search, setSearch] = useState("");
  const selected = useQuery(api.books.getBooksByIds, bookIds.length ? { bookIds } : "skip");
  const results = useQuery(api.books.searchLocalBooks, search.trim() ? { query: search.trim() } : "skip");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {selected && selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {selected.map((b) => (
            <Tag key={b._id} onRemove={() => onChange(bookIds.filter((id) => id !== b._id))}>
              {b.title}
            </Tag>
          ))}
        </div>
      )}
      {bookIds.length < MAX_FAVORITE_BOOKS && (
        <>
          <Input icon="search" placeholder={t("showcase.bookSearchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
          {results && results.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
              {results
                .filter((b) => !bookIds.includes(b._id))
                .map((b) => (
                  <div
                    key={b._id}
                    onClick={() => {
                      onChange([...bookIds, b._id]);
                      setSearch("");
                    }}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      background: "var(--surface-sunken)",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "var(--fs-body-2)", color: "var(--text-primary)" }}>{b.title}</div>
                      <div style={{ fontSize: "var(--fs-body-3)", color: "var(--text-secondary)" }}>{b.author}</div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
      <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-3)", margin: 0 }}>
        {t("showcase.maxBooksHint", { max: MAX_FAVORITE_BOOKS })}
      </p>
    </div>
  );
}

function AuthorEditor({ authorId, onChange }: { authorId: Id<"authors"> | null; onChange: (id: Id<"authors"> | null) => void }) {
  const { t } = useT();
  const [search, setSearch] = useState("");
  const selected = useQuery(api.authors.getAuthor, authorId ? { authorId } : "skip");
  const results = useQuery(api.authors.searchAuthors, search.trim() ? { query: search.trim() } : "skip");

  if (selected) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Tag onRemove={() => onChange(null)}>{selected.name}</Tag>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Input icon="search" placeholder={t("showcase.authorSearchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
      {results && results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
          {results.map((a) => (
            <div
              key={a._id}
              onClick={() => {
                onChange(a._id);
                setSearch("");
              }}
              style={{
                padding: "8px 10px",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                background: "var(--surface-sunken)",
                fontSize: "var(--fs-body-2)",
                color: "var(--text-primary)",
              }}
            >
              {a.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ShowcaseEditor({ userId }: { userId: Id<"users"> }) {
  const { t } = useT();
  const showcases = useQuery(api.showcases.getAllShowcases, { userId });
  const ensureDefaults = useMutation(api.showcases.ensureDefaultShowcases);
  const updateLayout = useMutation(api.showcases.updateShowcaseLayout);

  const [rows, setRows] = useState<LocalRow[] | null>(null);
  const [saved, setSaved] = useState(false);
  const [loadedFrom, setLoadedFrom] = useState<typeof showcases>(undefined);

  if (showcases !== loadedFrom) {
    setLoadedFrom(showcases);
    if (showcases && showcases.length > 0) {
      setRows(
        showcases
          .filter((s) => s.widgetType === "favorites" || s.widgetType === "author")
          .map((s) => {
            let parsed: { bookIds?: string[]; authorId?: string } = {};
            try {
              parsed = JSON.parse(s.config);
            } catch {
              parsed = {};
            }
            return {
              _id: s._id,
              widgetType: s.widgetType as WidgetType,
              isEnabled: s.isEnabled,
              bookIds: (parsed.bookIds ?? []) as Id<"books">[],
              authorId: (parsed.authorId ?? null) as Id<"authors"> | null,
            };
          })
      );
    }
  }

  useEffect(() => {
    if (showcases === undefined) return;
    const types = new Set(showcases.map((s) => s.widgetType));
    if (!types.has("favorites") || !types.has("author")) {
      ensureDefaults({ userId });
    }
  }, [showcases, ensureDefaults, userId]);

  if (!rows) return null;

  const move = (index: number, dir: -1 | 1) => {
    const next = [...rows];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);
    setSaved(false);
  };

  const update = (index: number, patch: Partial<LocalRow>) => {
    const next = [...rows];
    next[index] = { ...next[index], ...patch };
    setRows(next);
    setSaved(false);
  };

  const save = async () => {
    await updateLayout({
      userId,
      layouts: rows.map((r, i) => ({
        id: r._id,
        order: i,
        isEnabled: r.isEnabled,
        config: JSON.stringify(r.widgetType === "favorites" ? { bookIds: r.bookIds } : { authorId: r.authorId }),
      })),
    });
    setSaved(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {rows.map((row, i) => (
        <Card key={row._id} style={{ display: "flex", flexDirection: "column", gap: 12 } as CSSProperties}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <IconButton icon="arrow-up" size={28} iconSize={14} label={t("showcase.moveUp")} disabled={i === 0} onClick={() => move(i, -1)} />
              <IconButton icon="arrow-down" size={28} iconSize={14} label={t("showcase.moveDown")} disabled={i === rows.length - 1} onClick={() => move(i, 1)} />
            </div>
            <div style={{ flex: 1, fontSize: "var(--fs-body-1)", fontWeight: "var(--fw-semibold)" as unknown as number }}>
              {t(WIDGET_LABEL_KEYS[row.widgetType])}
            </div>
            <Switch checked={row.isEnabled} onChange={(checked) => update(i, { isEnabled: checked })} />
          </div>

          {row.isEnabled && row.widgetType === "favorites" && (
            <FavoritesEditor bookIds={row.bookIds} onChange={(bookIds) => update(i, { bookIds })} />
          )}
          {row.isEnabled && row.widgetType === "author" && (
            <AuthorEditor authorId={row.authorId} onChange={(authorId) => update(i, { authorId })} />
          )}
        </Card>
      ))}

      <div>
        <Button variant="primary" onClick={save}>
          {saved ? t("common.saved") : t("common.save")}
        </Button>
      </div>
    </div>
  );
}
