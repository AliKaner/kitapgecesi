"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { ScreenTitle } from "@/components/layout/Screen";
import { Switch } from "@/components/ui/Switch";
import { Tag } from "@/components/ui/Tag";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function YeniListePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isRanked, setIsRanked] = useState(false);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<{ _id: Id<"books">; title: string; author: string }[]>([]);

  const results = useQuery(api.books.searchLocalBooks, search.trim() ? { query: search.trim() } : "skip");
  const createList = useMutation(api.lists.createList);

  const addBook = (b: { _id: Id<"books">; title: string; author: string }) => {
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
      <ScreenTitle>Yeni Liste</ScreenTitle>
      <Card style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
        <Input label="Başlık" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Açıklama" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Switch label="Gizli liste" checked={isPrivate} onChange={setIsPrivate} />
        <Switch label="Sıralı liste" checked={isRanked} onChange={setIsRanked} />
      </Card>

      <Card style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
        <Input label="Kitap ara" icon="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kitap adı veya yazar..." />
        {results && results.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 240, overflowY: "auto" }}>
            {results.map((b) => (
              <div
                key={b._id}
                onClick={() => addBook(b)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: "var(--radius-md)", cursor: "pointer", background: "var(--surface-sunken)" }}
              >
                <div>
                  <div style={{ fontSize: "var(--fs-body-2)", color: "var(--text-primary)" }}>{b.title}</div>
                  <div style={{ fontSize: "var(--fs-body-3)", color: "var(--text-secondary)" }}>{b.author}</div>
                </div>
                <Icon name="plus" size={16} />
              </div>
            ))}
          </div>
        )}
        {picked.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {picked.map((b) => (
              <Tag key={b._id} onRemove={() => removeBook(b._id)}>
                {b.title}
              </Tag>
            ))}
          </div>
        )}
      </Card>

      <Button variant="primary" onClick={submit} disabled={!title.trim()}>
        Listeyi Oluştur
      </Button>
    </>
  );
}
