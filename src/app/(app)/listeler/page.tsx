"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc } from "../../../../convex/_generated/dataModel";
import { ScreenTitle } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CompactFilter } from "@/components/ui/CompactFilter";
import { BookCover } from "@/components/book/BookCover";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

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
  const { t } = useT();
  const [tab, setTab] = useState("Listelerim");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("yeni");
  const router = useRouter();
  const { user } = useAuth();
  const lists = useQuery(api.lists.getUserLists, user ? { creatorId: user._id, includePrivate: true } : "skip");

  const visibleLists = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr");
    let list = q
      ? (lists ?? []).filter((l) => l.title.toLocaleLowerCase("tr").includes(q))
      : [...(lists ?? [])];
    if (sort === "alfabetik") {
      list.sort((a, b) => a.title.localeCompare(b.title, "tr"));
    } else if (sort === "begeni") {
      list.sort((a, b) => b.likeCount - a.likeCount);
    } else {
      list.sort((a, b) => b._creationTime - a._creationTime);
    }
    return list;
  }, [lists, search, sort]);

  return (
    <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <ScreenTitle>{t("nav.listeler")}</ScreenTitle>
          <Button variant="primary" size="sm" icon="plus" onClick={() => router.push("/listeler/yeni")}>
            {t("listeler.new")}
          </Button>
        </div>
        <CompactFilter
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={t("listeler.searchPlaceholder")}
          selects={[
            {
              value: tab,
              onChange: setTab,
              icon: "bookmark",
              ariaLabel: t("listeler.tab.mine"),
              options: [
                { value: "Listelerim", label: t("listeler.tab.mine") },
                { value: "Kaydedilenler", label: t("listeler.tab.saved") },
                { value: "Takip Edilen", label: t("listeler.tab.following") },
              ],
            },
            {
              value: sort,
              onChange: setSort,
              icon: "list",
              ariaLabel: t("kitaplar.sort.yeni"),
              options: [
                { value: "yeni", label: t("kitaplar.sort.yeni") },
                { value: "begeni", label: t("listeler.sort.begeni") },
                { value: "alfabetik", label: t("kitaplar.sort.alfabetik") },
              ],
            },
          ]}
        />

        {tab === "Listelerim" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {visibleLists.map((l) => (
              <Card key={l._id} hover style={{ display: "flex", gap: 18, cursor: "pointer" } as React.CSSProperties} onClick={() => router.push(`/listeler/${l._id}`)}>
                <CoverStack books={l.previewBooks as Doc<"books">[]} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: "var(--fs-h3)", fontWeight: 600, marginBottom: 4 }}>{l.title}</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-2)", marginBottom: 8 }}>{l.description}</p>
                  <span style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-3)" }}>
                    {t("listeler.preview", { books: l.previewBooks.length, likes: l.likeCount })}
                  </span>
                </div>
              </Card>
            ))}
            {lists && visibleLists.length === 0 && <p style={{ color: "var(--text-secondary)" }}>{t("listeler.empty.mine")}</p>}
          </div>
        )}

        {tab === "Kaydedilenler" && <p style={{ color: "var(--text-secondary)" }}>{t("listeler.empty.saved")}</p>}
        {tab === "Takip Edilen" && <p style={{ color: "var(--text-secondary)" }}>{t("listeler.empty.following")}</p>}
    </>
  );
}
