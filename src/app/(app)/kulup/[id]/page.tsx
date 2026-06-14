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
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { BookCard } from "@/components/book/BookCard";
import { FeedPost } from "@/components/feed/FeedPost";
import { ImageAttachment, useImageUpload } from "@/components/feed/ImageAttachment";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

function ClubComposer({ userId, clubId }: { userId: Id<"users">; clubId: Id<"clubs"> }) {
  const { t } = useT();
  const [text, setText] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const { imageUrl, setImageUrl, uploading, handleFiles } = useImageUpload();
  const createPost = useMutation(api.posts.createPost);

  const share = async () => {
    if (!text.trim() && !imageUrl.trim()) return;
    await createPost({
      authorId: userId,
      type: "direkt",
      content: text.trim() || undefined,
      mediaUrls: imageUrl.trim() ? [imageUrl.trim()] : undefined,
      clubId,
      isSilent: false,
    });
    setText("");
    setImageUrl("");
    setShowImageInput(false);
  };

  return (
    <Card padding={18} style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <Avatar size="md" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            placeholder={t("kulup.composerPlaceholder")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setShowImageInput(true);
              handleFiles(e.dataTransfer.files);
            }}
            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 16, color: "var(--text-primary)", padding: "8px 0", fontFamily: "var(--font-sans)" }}
          />
          {showImageInput && (
            <ImageAttachment imageUrl={imageUrl} setImageUrl={setImageUrl} uploading={uploading} handleFiles={handleFiles} />
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <IconButton
              icon="image"
              label={t("composer.addImage")}
              active={showImageInput}
              onClick={() => setShowImageInput((v) => !v)}
            />
            <Button size="sm" variant="primary" onClick={share}>
              {t("common.share")}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function KulupDetayPage() {
  const { t } = useT();
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
    return <p>{t("kulup.notFound")}</p>;
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
        {t("nav.kulupler")}
      </button>

      <div style={{ height: 140, borderRadius: "var(--radius-lg)", background: club.bannerUrl ? `url(${club.bannerUrl}) center/cover` : "var(--surface-tint)" }} />

      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginTop: -28, marginBottom: 12, padding: "0 4px" }}>
        <Avatar src={club.avatarUrl} name={club.name} size="lg" ring />
        <div style={{ marginLeft: "auto" }}>
          {isLeader && !editingImages && (
            <Button variant="menu" size="sm" icon="pencil" onClick={startEditingImages}>
              {t("kulup.editImages")}
            </Button>
          )}
          {user && !isMember && (
            <Button
              variant="primary"
              size="sm"
              disabled={isPending}
              onClick={() => manageMembership({ clubId, userId: user._id, action: "join" })}
            >
              {isPending ? t("kulup.pending") : t("kulup.join")}
            </Button>
          )}
          {user && isMember && membership?.role !== "leader" && (
            <Button variant="menu" size="sm" onClick={() => manageMembership({ clubId, userId: user._id, action: "leave" })}>
              {t("kulup.leave")}
            </Button>
          )}
        </div>
      </div>

      {editingImages && (
        <Card style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
          <Input label={t("image.profileUrl")} placeholder="https://..." value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
          <Input label={t("image.bannerUrl")} hint={t("image.bannerHint.club")} placeholder="https://..." value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="primary" size="sm" onClick={saveImages}>
              {t("common.save")}
            </Button>
            <Button variant="menu" size="sm" onClick={() => setEditingImages(false)}>
              {t("common.cancel")}
            </Button>
          </div>
        </Card>
      )}

      <div style={{ marginBottom: 8, padding: "0 4px" }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, lineHeight: 1.1, marginBottom: 6 }}>{club.name}</h1>
        <p style={{ color: "var(--text-secondary)" }}>{club.description}</p>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-3)", marginTop: 6 }}>{t("kulup.memberCount", { count: club.memberCount })}</p>
      </div>

      {club.activeBook && (
        <Card tone="sunken" style={{ marginBottom: 24 }}>
          <BookCard layout="row" cover={club.activeBook.coverUrl || undefined} title={club.activeBook.title} author={club.activeBook.author} pages={club.activeBook.totalPages} width={70} onClick={() => router.push(`/kitap/${club.activeBook!._id}`)} />
        </Card>
      )}

      <div style={{ marginBottom: 22 }}>
        <Tabs
          items={[
            { value: "Akış", label: t("kulup.tab.feed") },
            { value: "Arşiv", label: t("kulup.tab.archive") },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === "Akış" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {user && isMember && <ClubComposer userId={user._id} clubId={clubId} />}
          {feed?.map((p) => (
            <FeedPost key={p._id} post={p} currentUserId={user?._id} />
          ))}
          {feed && feed.length === 0 && <p style={{ color: "var(--text-secondary)" }}>{t("kulup.noPosts")}</p>}
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
          {archive && archive.length === 0 && <p style={{ color: "var(--text-secondary)" }}>{t("kulup.emptyArchive")}</p>}
        </div>
      )}
    </>
  );
}
