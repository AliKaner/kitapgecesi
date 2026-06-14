"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc } from "../../../../convex/_generated/dataModel";
import { ScreenTitle } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { BookCover } from "@/components/book/BookCover";
import { useAuth } from "@/lib/auth/AuthProvider";

function CoverStack({ books }: { books: Doc<"books">[] }) {
  const slots = [0, 1, 2, 3];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 4, width: 96, height: 96, flex: "none" }}>
      {slots.map((i) => {
        const b = books[i];
        return (
          <div key={i} style={{ width: "100%", height: "100%", borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--bg-book-image)" }}>
            {b && <BookCover src={b.coverUrl || undefined} title={b.title} width={46} ratio={1} shadow={false} style={{ width: "100%", height: "100%", borderRadius: 0 }} />}
          </div>
        );
      })}
    </div>
  );
}

export default function ListelerPage() {
  const [tab, setTab] = useState("Listelerim");
  const router = useRouter();
  const { user } = useAuth();
  const lists = useQuery(api.lists.getUserLists, user ? { creatorId: user._id, includePrivate: true } : "skip");

  return (
    <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <ScreenTitle>Listeler</ScreenTitle>
          <Button variant="primary" size="sm" icon="plus" onClick={() => router.push("/listeler/yeni")}>
            Yeni Liste
          </Button>
        </div>
        <div style={{ marginBottom: 26 }}>
          <Tabs items={["Listelerim", "Kaydedilenler", "Takip Edilen"]} value={tab} onChange={setTab} />
        </div>

        {tab === "Listelerim" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {(lists ?? []).map((l) => (
              <Card key={l._id} hover style={{ display: "flex", gap: 18, cursor: "pointer" } as React.CSSProperties} onClick={() => router.push(`/listeler/${l._id}`)}>
                <CoverStack books={l.previewBooks as Doc<"books">[]} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: "var(--fs-h3)", fontWeight: 600, marginBottom: 4 }}>{l.title}</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-2)", marginBottom: 8 }}>{l.description}</p>
                  <span style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-3)" }}>
                    {l.previewBooks.length} kitap · {l.likeCount} beğeni
                  </span>
                </div>
              </Card>
            ))}
            {lists && lists.length === 0 && <p style={{ color: "var(--text-secondary)" }}>Henüz bir listeniz yok.</p>}
          </div>
        )}

        {tab === "Kaydedilenler" && <p style={{ color: "var(--text-secondary)" }}>Henüz kaydedilen liste yok.</p>}
        {tab === "Takip Edilen" && <p style={{ color: "var(--text-secondary)" }}>Takip ettiğiniz liste yok.</p>}
    </>
  );
}
