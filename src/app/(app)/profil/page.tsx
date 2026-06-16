"use client";

import { CSSProperties, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { SectionHead } from "@/components/layout/Screen";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { Tag } from "@/components/ui/Tag";
import { Icon } from "@/components/ui/Icon";
import { RoleBadges } from "@/components/ui/RoleBadges";
import { BookCard } from "@/components/book/BookCard";
import { FeedPost } from "@/components/feed/FeedPost";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 28 }}>{value}</div>
      <div style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-3)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function JournalTab({ userId }: { userId: import("../../../../convex/_generated/dataModel").Id<"users"> }) {
  const { t } = useT();
  const [range, setRange] = useState("week");
  const [content, setContent] = useState("");
  const [pages, setPages] = useState("");
  const entries = useQuery(api.journal.getEntries, { userId, range: range as "day" | "week" | "month" | "year" });
  const addEntry = useMutation(api.journal.addEntry);

  const submit = async () => {
    if (!content.trim()) return;
    await addEntry({
      userId,
      content: content.trim(),
      pagesRead: pages ? Number(pages) : undefined,
    });
    setContent("");
    setPages("");
  };

  return (
    <div>
      <Card style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
        <Input
          label={t("profil.journal.prompt")}
          placeholder={t("profil.journal.placeholder")}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ maxWidth: 160 }}>
            <Input
              label={t("profil.journal.pages")}
              type="number"
              placeholder="0"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
            />
          </div>
          <Button variant="primary" onClick={submit} disabled={!content.trim()}>
            {t("profil.journal.add")}
          </Button>
        </div>
      </Card>

      <div style={{ marginBottom: 18 }}>
        <Tabs
          items={[
            { value: "day", label: t("profil.range.day") },
            { value: "week", label: t("profil.range.week") },
            { value: "month", label: t("profil.range.month") },
            { value: "year", label: t("profil.range.year") },
          ]}
          value={range}
          onChange={setRange}
          variant="segmented"
          size="sm"
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(entries ?? []).map((e) => (
          <Card key={e._id} tone="sunken" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", fontSize: "var(--fs-body-3)" }}>
              <span>{new Date(e.createdAt).toLocaleString("tr-TR")}</span>
              {e.pagesRead != null && <span>{t("kitap.pages", { count: e.pagesRead })}</span>}
            </div>
            <p style={{ fontSize: "var(--fs-body-2)" }}>{e.content}</p>
            {e.book && (
              <Tag size="sm" icon="book">
                {e.book.title}
              </Tag>
            )}
          </Card>
        ))}
        {entries && entries.length === 0 && <p style={{ color: "var(--text-secondary)" }}>{t("profil.journal.empty")}</p>}
      </div>
    </div>
  );
}

function FavoritesShowcase({ bookIds, router }: { bookIds: Id<"books">[]; router: ReturnType<typeof useRouter> }) {
  const { t } = useT();
  const books = useQuery(api.books.getBooksByIds, bookIds.length ? { bookIds } : "skip");

  return (
    <section>
      <SectionHead title={t("profil.favorites")} />
      {books && books.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 124px)", gap: "22px 20px" }}>
          {books.map((b) => (
            <BookCard key={b._id} cover={b.coverUrl || undefined} title={b.title} author={b.author} width={124} onClick={() => router.push(`/kitap/${b._id}`)} />
          ))}
        </div>
      ) : (
        <p style={{ color: "var(--text-secondary)" }}>{t("showcase.favorites.empty")}</p>
      )}
    </section>
  );
}

function AuthorShowcase({ authorId, router }: { authorId: Id<"authors">; router: ReturnType<typeof useRouter> }) {
  const { t } = useT();
  const author = useQuery(api.authors.getAuthor, { authorId });

  if (!author) return null;

  return (
    <section>
      <SectionHead title={t("showcase.author.title")} />
      <Card hover style={{ display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }} onClick={() => router.push(`/yazar/${authorId}`)}>
        <Avatar name={author.name} size="lg" />
        <div>
          <div style={{ fontSize: "var(--fs-h3)", fontWeight: 600 }}>{author.name}</div>
          <div style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-3)" }}>{t("yazar.books")}</div>
        </div>
      </Card>
    </section>
  );
}

export default function ProfilPage() {
  const { t } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const TABS = ["Profil", "Aktivite", "Kitaplık", "Okuma Listesi", "Günlük", "Rozetler"];
  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState(initialTab && TABS.includes(initialTab) ? initialTab : "Profil");
  const [libFilter, setLibFilter] = useState<"all" | "reading" | "read">("all");
  const { user } = useAuth();
  const profile = useQuery(api.users.getUserProfile, user ? { username: user.username } : "skip");
  const showcases = useQuery(api.showcases.getUserShowcases, user ? { userId: user._id } : "skip");
  const library = useQuery(api.library.getUserLibrary, user ? { userId: user._id } : "skip");
  const badges = useQuery(api.badges.getUserBadges, user ? { userId: user._id } : "skip");
  const userPosts = useQuery(api.posts.getUserPosts, user ? { authorId: user._id, limit: 20 } : "skip");

  if (user === undefined) return null;

  return (
    <>
      <div
        style={{
          height: 180,
          borderRadius: "var(--radius-lg)",
          background: user?.bannerUrl ? `url(${user.bannerUrl}) center/cover` : "var(--surface-tint)",
        }}
      />
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginTop: -44, marginBottom: 12, padding: "0 4px" }}>
        <Avatar src={user?.profileImageUrl || undefined} name={user?.name} size="xl" ring />
        <Button variant="menu" icon="pencil" style={{ marginLeft: "auto" }} onClick={() => router.push("/ayarlar?tab=profil")}>
          {t("common.edit")}
        </Button>
      </div>
      <div style={{ marginBottom: 28, padding: "0 4px" }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, lineHeight: 1.1, display: "flex", alignItems: "center", gap: 10 }}>
          {user?.name}
          <RoleBadges badges={user?.roleBadges} size={20} />
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>@{user?.username} · {t("profil.reader")}</p>
        <div style={{ display: "flex", gap: 18, marginTop: 10 }}>
          <span style={{ fontSize: "var(--fs-body-2)" }}>
            <strong>{profile?.followingCount ?? 0}</strong>{" "}
            <span style={{ color: "var(--text-secondary)" }}>{t("profil.following")}</span>
          </span>
          <span style={{ fontSize: "var(--fs-body-2)" }}>
            <strong>{profile?.followerCount ?? 0}</strong>{" "}
            <span style={{ color: "var(--text-secondary)" }}>{t("profil.followers")}</span>
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Tabs
          items={[
            { value: "Profil", label: t("profil.tab.profile") },
            { value: "Aktivite", label: t("profil.tab.activity") },
            { value: "Kitaplık", label: t("profil.tab.library") },
            { value: "Okuma Listesi", label: t("profil.tab.wishlist") },
            { value: "Günlük", label: t("profil.tab.journal") },
            { value: "Rozetler", label: t("profil.tab.badges") },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === "Profil" && (
        <>
          <Card title={t("profil.librarySummary")} tone="sunken" style={{ marginBottom: 32 }}>
            <div style={{ display: "flex" }}>
              <StatTile label={t("profil.stat.level")} value={String(user?.level ?? 1)} />
              <StatTile label={t("profil.stat.yaprak")} value={(user?.yaprak ?? 0).toLocaleString("tr-TR")} />
              <StatTile label={t("profil.stat.trustScore")} value={String(user?.trustScore ?? 0)} />
              <StatTile label={t("profil.stat.xp")} value={(user?.xp ?? 0).toLocaleString("tr-TR")} />
            </div>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {(showcases ?? []).map((s) => {
              let config: { bookIds?: string[]; authorId?: string } = {};
              try {
                config = JSON.parse(s.config);
              } catch {
                config = {};
              }
              if (s.widgetType === "favorites") {
                return <FavoritesShowcase key={s._id} bookIds={(config.bookIds ?? []) as Id<"books">[]} router={router} />;
              }
              if (s.widgetType === "author" && config.authorId) {
                return <AuthorShowcase key={s._id} authorId={config.authorId as Id<"authors">} router={router} />;
              }
              return null;
            })}
          </div>
        </>
      )}

      {tab === "Aktivite" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {(userPosts ?? []).map((p) => (
            <FeedPost key={p._id} post={p} currentUserId={user?._id} />
          ))}
          {userPosts && userPosts.length === 0 && <p style={{ color: "var(--text-secondary)" }}>{t("profil.noActivity")}</p>}
        </div>
      )}

      {tab === "Kitaplık" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {(() => {
            const readCount = (library ?? []).filter((e) => e.status === "read").length;
            const readingCount = (library ?? []).filter((e) => e.status === "reading").length;
            const groups = (libFilter === "all"
              ? (["reading", "read"] as const)
              : ([libFilter] as const)
            ).map((status) => ({
              status,
              labelKey: status === "reading" ? ("kitap.status.reading" as const) : ("kitap.status.read" as const),
            }));
            return (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, justifyContent: "space-between" }}>
                  <Tabs
                    variant="segmented"
                    size="sm"
                    items={[
                      { value: "all", label: t("profil.library.all") },
                      { value: "reading", label: t("kitap.status.reading") },
                      { value: "read", label: t("kitap.status.read") },
                    ]}
                    value={libFilter}
                    onChange={(v) => setLibFilter(v as "all" | "reading" | "read")}
                  />
                  <span style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-3)" }}>
                    {t("profil.library.readSummary", { count: readCount })}
                    {readingCount > 0 && ` · ${t("profil.library.readingSummary", { count: readingCount })}`}
                  </span>
                </div>

                {groups.map((group) => {
                  const items = (library ?? []).filter((e) => e.status === group.status && e.book);
                  return (
                    <section key={group.status}>
                      <SectionHead title={`${t(group.labelKey)} (${items.length})`} />
                      {items.length > 0 ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 124px)", gap: "22px 20px" }}>
                          {items.map((e) => (
                            <BookCard
                              key={e._id}
                              cover={e.book!.coverUrl || undefined}
                              title={e.book!.title}
                              author={e.book!.author}
                              width={124}
                              onClick={() => router.push(`/kitap/${e.book!._id}`)}
                            />
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: "var(--text-secondary)" }}>{t("profil.noBooksInGroup")}</p>
                      )}
                    </section>
                  );
                })}
              </>
            );
          })()}
        </div>
      )}

      {tab === "Okuma Listesi" && (
        <div>
          {(() => {
            const items = (library ?? []).filter((e) => e.status === "want" && e.book);
            if (items.length === 0) {
              return <p style={{ color: "var(--text-secondary)" }}>{t("profil.wishlist.empty")}</p>;
            }
            return (
              <>
                <SectionHead title={`${t("kitap.status.want")} (${items.length})`} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 124px)", gap: "22px 20px" }}>
                  {items.map((e) => (
                    <BookCard
                      key={e._id}
                      cover={e.book!.coverUrl || undefined}
                      title={e.book!.title}
                      author={e.book!.author}
                      width={124}
                      onClick={() => router.push(`/kitap/${e.book!._id}`)}
                    />
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {tab === "Günlük" && user && <JournalTab userId={user._id} />}

      {tab === "Rozetler" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {(badges ?? []).map((b) => (
            <Card
              key={b.key}
              tone={b.earned ? "tint" : "sunken"}
              style={{ display: "flex", alignItems: "center", gap: 14, opacity: b.earned ? 1 : 0.45 } as CSSProperties}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: b.earned ? "var(--accent-tint)" : "var(--surface-sunken)",
                  flex: "none",
                }}
              >
                <Icon name={b.icon} size={22} color={b.earned ? "var(--accent)" : "var(--text-secondary)"} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: "var(--fw-semibold)" as unknown as number, fontSize: "var(--fs-body-1)" }}>{b.name}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-3)" }}>{b.description}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
