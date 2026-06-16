"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { ScreenTitle } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CompactFilter } from "@/components/ui/CompactFilter";
import { BookCover } from "@/components/book/BookCover";
import { IconButton } from "@/components/ui/IconButton";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

type CoverStackProps = {
  books: (Doc<"books"> | null)[];
};

const CoverStack = (props: CoverStackProps) => {
  const books = props.books;
  const slots = [0, 1, 2, 3, 4];
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: 140,
        width: "100%",
        background: "var(--surface-sunken)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        padding: "12px 16px",
        position: "relative",
      }}
    >
      {slots.map((i) => {
        const b = books[i];
        if (!b) return null;
        return (
          <div
            key={b._id}
            style={{
              marginLeft: i === 0 ? 0 : -28,
              zIndex: i,
              position: "relative",
            }}
          >
            <BookCover
              src={b.coverUrl || undefined}
              title={b.title}
              width={68}
              ratio={1.5}
              shadow={true}
              style={{
                border: "1px solid rgba(0,0,0,0.08)",
              }}
            />
          </div>
        );
      })}
      {books.length === 0 && (
        <div style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-3)" }}>
          Empty Collection
        </div>
      )}
    </div>
  );
};

type ListType = {
  _id: Id<"lists">;
  title: string;
  description: string;
  previewBooks: (Doc<"books"> | null)[];
  likeCount: number;
  isLiked?: boolean;
};

type ListCardProps = {
  list: ListType;
  onClick: () => void;
  onLike: (e: React.MouseEvent) => void;
  onShare: (e: React.MouseEvent) => void;
  t: ReturnType<typeof useT>["t"];
};

const ListCard = (props: ListCardProps) => {
  const { list, onClick, onLike, onShare, t } = props;
  return (
    <Card
      hover
      padding={12}
      style={{
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        height: "100%",
        justifyContent: "space-between",
      } as React.CSSProperties}
      onClick={onClick}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <CoverStack books={list.previewBooks as Doc<"books">[]} />
        <div style={{ padding: "0 4px" }}>
          <h3
            style={{
              fontSize: "var(--fs-body-1)",
              fontWeight: "var(--fw-semibold)" as unknown as number,
              color: "var(--text-primary)",
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            } as React.CSSProperties}
          >
            {list.title}
          </h3>
          {list.description ? (
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "var(--fs-body-3)",
                lineHeight: 1.4,
                marginTop: 4,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                minHeight: 34,
              } as React.CSSProperties}
            >
              {list.description}
            </p>
          ) : (
            <div style={{ minHeight: 38 }} />
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 12,
          padding: "0 4px",
        }}
      >
        <IconButton
          icon="heart"
          variant="outline"
          count={list.likeCount}
          active={list.isLiked}
          onClick={onLike}
          size={36}
          label={t("common.like")}
          style={{
            borderColor: "var(--border-default)",
          }}
        />
        <IconButton
          icon="share"
          variant="outline"
          onClick={onShare}
          size={36}
          label={t("common.share")}
          style={{
            borderColor: "var(--border-default)",
          }}
        />
      </div>
    </Card>
  );
};

export default function ListelerPage() {
  const { t } = useT();
  const [tab, setTab] = useState("Listelerim");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("yeni");
  const router = useRouter();
  const { user } = useAuth();
  const lists = useQuery(
    api.lists.getUserLists,
    user ? { creatorId: user._id, includePrivate: true, currentUserId: user._id } : "skip"
  );
  const likeTarget = useMutation(api.posts.likeTarget);

  const visibleLists = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr");
    const list = q
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

  const handleLike = (e: React.MouseEvent, listId: Id<"lists">) => {
    e.stopPropagation();
    if (user) {
      likeTarget({ userId: user._id, targetType: "list", targetId: listId });
    }
  };

  const handleShare = (e: React.MouseEvent, listId: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}/listeler/${listId}`;
    if (navigator.share) {
      navigator.share({
        title: t("nav.listeler"),
        url: url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert(t("common.saved"));
    }
  };

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
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {visibleLists.map((l) => (
              <ListCard
                key={l._id}
                list={l}
                onClick={() => router.push(`/listeler/${l._id}`)}
                onLike={(e) => handleLike(e, l._id)}
                onShare={(e) => handleShare(e, l._id)}
                t={t}
              />
            ))}
          </div>
          {lists && visibleLists.length === 0 && (
            <p style={{ color: "var(--text-secondary)", marginTop: 14 }}>{t("listeler.empty.mine")}</p>
          )}
        </>
      )}

      {tab === "Kaydedilenler" && <p style={{ color: "var(--text-secondary)" }}>{t("listeler.empty.saved")}</p>}
      {tab === "Takip Edilen" && <p style={{ color: "var(--text-secondary)" }}>{t("listeler.empty.following")}</p>}
    </>
  );
}
