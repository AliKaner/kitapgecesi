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
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

type CoverStackProps = {
  books: (Doc<"books"> | null)[];
};

const COVER_W = 100;
const COVER_H = 160;
const STEP_X = 28;
const STEP_Y = 12;

const CoverStack = (props: CoverStackProps) => {
  const visible = props.books.filter((b): b is Doc<"books"> => !!b).slice(0, 5);
  if (visible.length === 0) {
    return (
      <div style={{ height: COVER_H, display: "flex", alignItems: "center", color: "var(--text-secondary)", fontSize: "var(--fs-body-3)" }}>
        Empty Collection
      </div>
    );
  }
  return (
    <div style={{ position: "relative", width: "100%", height: COVER_H + STEP_Y * (visible.length - 1) }}>
      {visible.map((b, i) => (
        <div
          key={b._id}
          style={{
            position: "absolute",
            left: i * STEP_X,
            top: i * STEP_Y,
            // First book stays on top; later ones cascade down and behind.
            zIndex: visible.length - i,
          }}
        >
          <BookCover
            src={b.coverUrl || undefined}
            title={b.title}
            width={COVER_W}
            ratio={COVER_H / COVER_W}
            shadow
            style={{ border: "1px solid rgba(0,0,0,0.08)" }}
          />
        </div>
      ))}
    </div>
  );
};

type ListType = {
  _id: Id<"lists">;
  title: string;
  description: string;
  previewBooks: (Doc<"books"> | null)[];
  bookCount: number;
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
      padding={0}
      onClick={onClick}
      style={{
        position: "relative",
        width: 290,
        height: 260,
        overflow: "hidden",
        cursor: "pointer",
      } as React.CSSProperties}
    >
      <div style={{ position: "absolute", top: 18, left: 18, right: 18 }}>
        <CoverStack books={list.previewBooks as Doc<"books">[]} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "34px 16px 14px",
          background: "linear-gradient(to bottom, transparent, var(--surface-card) 42%)",
        }}
      >
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
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8 }}>
          <button
            type="button"
            onClick={onLike}
            aria-label={t("common.like")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              border: "none",
              background: "none",
              padding: 0,
              cursor: "pointer",
              color: list.isLiked ? "var(--accent)" : "var(--text-secondary)",
              fontSize: "var(--fs-body-3)",
              fontVariantNumeric: "tabular-nums",
            } as React.CSSProperties}
          >
            <Icon name="heart" size={16} fill={list.isLiked} />
            {list.likeCount}
          </button>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--text-secondary)", fontSize: "var(--fs-body-3)" }}>
            <Icon name="book" size={16} />
            {t("liste.bookCount", { count: list.bookCount })}
          </span>
          <div style={{ flex: 1 }} />
          <IconButton
            icon="share"
            variant="outline"
            onClick={onShare}
            size={32}
            label={t("common.share")}
            style={{ borderColor: "var(--border-default)" }}
          />
        </div>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 290px)", gap: 16, justifyContent: "center" }}>
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
