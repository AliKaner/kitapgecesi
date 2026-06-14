"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { BookCard } from "@/components/book/BookCard";
import { FeedPost } from "@/components/feed/FeedPost";
import { useAuth } from "@/lib/auth/AuthProvider";

function ClubComposer({ userId, clubId }: { userId: Id<"users">; clubId: Id<"clubs"> }) {
  const [text, setText] = useState("");
  const createPost = useMutation(api.posts.createPost);

  const share = async () => {
    if (!text.trim()) return;
    await createPost({ authorId: userId, type: "direkt", content: text.trim(), clubId, isSilent: false });
    setText("");
  };

  return (
    <Card padding={18} style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <Avatar size="md" />
        <div style={{ flex: 1 }}>
          <input
            placeholder="Kulüple bir şey paylaş..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 16, color: "var(--text-primary)", padding: "8px 0", fontFamily: "var(--font-sans)" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <Button size="sm" variant="primary" onClick={share}>
              Paylaş
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function KulupDetayPage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params.id as Id<"clubs">;
  const { user } = useAuth();
  const [tab, setTab] = useState("Akış");

  const club = useQuery(api.clubs.getClub, { clubId });
  const membership = useQuery(api.clubs.getMembership, user ? { clubId, userId: user._id } : "skip");
  const feed = useQuery(api.posts.getClubFeed, { clubId, limit: 20 });
  const archive = useQuery(api.clubs.getClubArchive, { clubId });
  const manageMembership = useMutation(api.clubs.manageMembership);
  const updateClubImages = useMutation(api.clubs.updateClubImages);
  const [editingImages, setEditingImages] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  if (club === undefined) return null;
  if (club === null) {
    return <p>Kulüp bulunamadı.</p>;
  }

  const isMember = membership?.status === "active";
  const isPending = membership?.status === "pending";
  const isLeader = membership?.role === "leader";

  const saveImages = async () => {
    if (!user) return;
    await updateClubImages({
      clubId,
      userId: user._id,
      avatarUrl: avatarUrl.trim(),
      bannerUrl: bannerUrl.trim(),
    });
    setEditingImages(false);
  };

  const startEditingImages = () => {
    setAvatarUrl(club.avatarUrl ?? "");
    setBannerUrl(club.bannerUrl ?? "");
    setEditingImages(true);
  };

  return (
    <>
      <button
        onClick={() => router.push("/kulupler")}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "none", cursor: "pointer", color: "var(--text-secondary)", fontFamily: "var(--font-sans)", fontSize: "var(--fs-body-2)", marginBottom: 22, padding: 0 }}
      >
        <Icon name="arrow-left" size={16} />
        Kulüpler
      </button>

      <div style={{ height: 140, borderRadius: "var(--radius-lg)", background: club.bannerUrl ? `url(${club.bannerUrl}) center/cover` : "var(--surface-tint)" }} />

      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginTop: -28, marginBottom: 12, padding: "0 4px" }}>
        <Avatar src={club.avatarUrl} name={club.name} size="lg" ring />
        <div style={{ marginLeft: "auto" }}>
          {isLeader && !editingImages && (
            <Button variant="menu" size="sm" icon="pencil" onClick={startEditingImages}>
              Görselleri Düzenle
            </Button>
          )}
          {user && !isMember && (
            <Button
              variant="primary"
              size="sm"
              disabled={isPending}
              onClick={() => manageMembership({ clubId, userId: user._id, action: "join" })}
            >
              {isPending ? "Onay Bekliyor" : "Katıl"}
            </Button>
          )}
          {user && isMember && membership?.role !== "leader" && (
            <Button variant="menu" size="sm" onClick={() => manageMembership({ clubId, userId: user._id, action: "leave" })}>
              Ayrıl
            </Button>
          )}
        </div>
      </div>

      {editingImages && (
        <Card style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
          <Input label="Profil Fotoğrafı URL" placeholder="https://..." value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
          <Input label="Kapak Resmi URL" hint="Twitter'daki gibi, kulüp sayfasının üst kısmında görünür." placeholder="https://..." value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="primary" size="sm" onClick={saveImages}>
              Kaydet
            </Button>
            <Button variant="menu" size="sm" onClick={() => setEditingImages(false)}>
              Vazgeç
            </Button>
          </div>
        </Card>
      )}

      <div style={{ marginBottom: 8, padding: "0 4px" }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, lineHeight: 1.1, marginBottom: 6 }}>{club.name}</h1>
        <p style={{ color: "var(--text-secondary)" }}>{club.description}</p>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-3)", marginTop: 6 }}>{club.memberCount} üye</p>
      </div>

      {club.activeBook && (
        <Card tone="sunken" style={{ marginBottom: 24 }}>
          <BookCard layout="row" cover={club.activeBook.coverUrl || undefined} title={club.activeBook.title} author={club.activeBook.author} pages={club.activeBook.totalPages} width={70} onClick={() => router.push(`/kitap/${club.activeBook!._id}`)} />
        </Card>
      )}

      <div style={{ marginBottom: 22 }}>
        <Tabs items={["Akış", "Arşiv"]} value={tab} onChange={setTab} />
      </div>

      {tab === "Akış" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {user && isMember && <ClubComposer userId={user._id} clubId={clubId} />}
          {feed?.map((p) => (
            <FeedPost key={p._id} post={p} currentUserId={user?._id} />
          ))}
          {feed && feed.length === 0 && <p style={{ color: "var(--text-secondary)" }}>Henüz gönderi yok.</p>}
        </div>
      )}

      {tab === "Arşiv" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {archive?.map((entry) =>
            entry.book ? (
              <BookCard
                key={entry._id}
                layout="row"
                cover={entry.book.coverUrl || undefined}
                title={entry.book.title}
                author={entry.book.author}
                pages={entry.book.totalPages}
                width={70}
                onClick={() => router.push(`/kitap/${entry.book!._id}`)}
              />
            ) : null
          )}
          {archive && archive.length === 0 && <p style={{ color: "var(--text-secondary)" }}>Arşiv boş.</p>}
        </div>
      )}
    </>
  );
}
