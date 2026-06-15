"use client";

import { CSSProperties, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { SectionHead } from "@/components/layout/Screen";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { RoleBadges } from "@/components/ui/RoleBadges";
import { BookCard } from "@/components/book/BookCard";
import { FeedPost } from "@/components/feed/FeedPost";
import { Tabs } from "@/components/ui/Tabs";
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

const LIBRARY_GROUPS: { status: "reading" | "want" | "read"; labelKey: "kitap.status.reading" | "kitap.status.want" | "kitap.status.read" }[] = [
  { status: "reading", labelKey: "kitap.status.reading" },
  { status: "want", labelKey: "kitap.status.want" },
  { status: "read", labelKey: "kitap.status.read" },
];

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

export default function PublicProfilePage() {
  const { t } = useT();
  const router = useRouter();
  const params = useParams<{ username: string }>();
  const username = params.username;
  const TABS = ["Profil", "Aktivite", "Kitaplık", "Rozetler"];
  const [tab, setTab] = useState(TABS[0]);
  const { user } = useAuth();

  const profile = useQuery(api.users.getUserProfile, { username });
  const showcases = useQuery(api.showcases.getUserShowcases, profile ? { userId: profile._id } : "skip");
  const library = useQuery(api.library.getUserLibrary, profile ? { userId: profile._id } : "skip");
  const badges = useQuery(api.badges.getUserBadges, profile ? { userId: profile._id } : "skip");
  const userPosts = useQuery(api.posts.getUserPosts, profile ? { authorId: profile._id, limit: 20 } : "skip");
  const isFollowing = useQuery(
    api.follows.isFollowing,
    user && profile && user._id !== profile._id ? { followerId: user._id, followingId: profile._id } : "skip"
  );
  const toggleFollow = useMutation(api.follows.toggleFollow);

  const isOwnProfile = !!user && !!profile && user._id === profile._id;

  useEffect(() => {
    if (isOwnProfile) router.replace("/profil");
  }, [isOwnProfile, router]);

  if (profile === undefined || user === undefined) return null;
  if (profile === null) return <p style={{ color: "var(--text-secondary)" }}>{t("post.notFound")}</p>;
  if (isOwnProfile) return null;

  return (
    <>
      <div
        style={{
          height: 180,
          borderRadius: "var(--radius-lg)",
          background: profile.bannerUrl ? `url(${profile.bannerUrl}) center/cover` : "var(--surface-tint)",
        }}
      />
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginTop: -44, marginBottom: 12, padding: "0 4px" }}>
        <Avatar src={profile.profileImageUrl || undefined} name={profile.name} size="xl" ring />
        {user && (
          <Button
            variant={isFollowing ? "menu" : "primary"}
            style={{ marginLeft: "auto" }}
            onClick={() => toggleFollow({ followerId: user._id, followingId: profile._id })}
          >
            {isFollowing ? t("common.following") : t("common.follow")}
          </Button>
        )}
      </div>
      <div style={{ marginBottom: 28, padding: "0 4px" }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, lineHeight: 1.1, display: "flex", alignItems: "center", gap: 10 }}>
          {profile.name}
          <RoleBadges badges={profile.roleBadges} size={20} />
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>@{profile.username} · {t("profil.reader")}</p>
        <div style={{ display: "flex", gap: 18, marginTop: 10 }}>
          <span style={{ fontSize: "var(--fs-body-2)" }}>
            <strong>{profile.followingCount ?? 0}</strong>{" "}
            <span style={{ color: "var(--text-secondary)" }}>{t("profil.following")}</span>
          </span>
          <span style={{ fontSize: "var(--fs-body-2)" }}>
            <strong>{profile.followerCount ?? 0}</strong>{" "}
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
              <StatTile label={t("profil.stat.level")} value={String(profile.level ?? 1)} />
              <StatTile label={t("profil.stat.yaprak")} value={(profile.yaprak ?? 0).toLocaleString("tr-TR")} />
              <StatTile label={t("profil.stat.trustScore")} value={String(profile.trustScore ?? 0)} />
              <StatTile label={t("profil.stat.xp")} value={(profile.xp ?? 0).toLocaleString("tr-TR")} />
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
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {LIBRARY_GROUPS.map((group) => {
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
        </div>
      )}

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
