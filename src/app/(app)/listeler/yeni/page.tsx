"use client";

import { CSSProperties, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { BookCover } from "@/components/book/BookCover";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { ScreenTitle } from "@/components/layout/Screen";
import { Switch } from "@/components/ui/Switch";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

interface PickedBook {
  _id: Id<"books">;
  title: string;
  author: string;
  coverUrl?: string;
}

function BookRow({ number, book, action }: { number: number; book: PickedBook; action: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 10px",
        borderRadius: "var(--radius-md)",
        background: "var(--surface-sunken)",
      }}
    >
      <span
        style={{
          width: 24,
          flex: "none",
          textAlign: "center",
          fontSize: "var(--fs-body-2)",
          fontWeight: "var(--fw-medium)",
          color: "var(--text-secondary)",
          fontVariantNumeric: "tabular-nums",
        } as CSSProperties}
      >
        {number}
      </span>
      <BookCover src={book.coverUrl || undefined} title={book.title} width={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--fs-body-2)", color: "var(--text-primary)" }}>{book.title}</div>
        <div style={{ fontSize: "var(--fs-body-3)", color: "var(--text-secondary)" }}>{book.author}</div>
      </div>
      {action}
    </div>
  );
}

export default function YeniListePage() {
  const { t } = useT();
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isRanked, setIsRanked] = useState(false);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<PickedBook[]>([]);

  const results = useQuery(api.books.searchLocalBooks, search.trim() ? { query: search.trim() } : "skip");
  const createList = useMutation(api.lists.createList);

  const addBook = (b: PickedBook) => {
    if (picked.some((p) => p._id === b._id)) return;
    setPicked((prev) => [...prev, b]);
  };

  const removeBook = (id: Id<"books">) => {
    setPicked((prev) => prev.filter((p) => p._id !== id));
  };

  const submit = async () => {
    if (!user || !title.trim()) return;
    const listId = await createList({
      title: title.trim(),
      description: description.trim(),
      creatorId: user._id,
      isPrivate,
      isRanked,
      bookIds: picked.map((p) => p._id),
    });
    router.push(`/listeler/${listId}`);
  };

  return (
    <>
      <ScreenTitle>{t("listeler.new")}</ScreenTitle>
      <Card style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
        <Input label={t("liste.fields.title")} value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label={t("liste.fields.description")} value={description} onChange={(e) => setDescription(e.target.value)} />
        <Switch label={t("liste.fields.private")} checked={isPrivate} onChange={setIsPrivate} />
        <Switch label={t("liste.fields.ranked")} checked={isRanked} onChange={setIsRanked} />
      </Card>

      <Card style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
        <Input label={t("liste.searchBooks")} icon="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("liste.searchPlaceholder")} />
        {results && results.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
            {results.map((b, i) => (
              <div key={b._id} onClick={() => addBook(b)} style={{ cursor: "pointer" }}>
                <BookRow number={i + 1} book={b} action={<Icon name="plus" size={16} />} />
              </div>
            ))}
          </div>
        )}
        {picked.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {picked.map((b, i) => (
              <BookRow
                key={b._id}
                number={i + 1}
                book={b}
                action={
                  <button
                    type="button"
                    onClick={() => removeBook(b._id)}
                    aria-label={t("common.remove")}
                    style={{ border: "none", background: "none", padding: 0, cursor: "pointer", color: "var(--text-secondary)", lineHeight: 0 }}
                  >
                    <Icon name="x" size={16} />
                  </button>
                }
              />
            ))}
          </div>
        )}
      </Card>

      <Button variant="primary" onClick={submit} disabled={!title.trim()}>
        {t("liste.create")}
      </Button>
    </>
  );
}
