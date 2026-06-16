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
import { BookCover } from "@/components/book/BookCover";
import { FeedPost } from "@/components/feed/FeedPost";
import { ImageAttachment, useImageUpload } from "@/components/feed/ImageAttachment";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

interface PickedBook {
  _id: Id<"books">;
  title: string;
  author: string;
  coverUrl: string;
}

function BookSearchPicker({ onPick, excludeIds }: { onPick: (book: PickedBook) => void; excludeIds: Set<string> }) {
  const { t } = useT();
  const [q, setQ] = useState("");
  const results = useQuery(api.books.searchLocalBooks, q.trim() ? { query: q.trim() } : "skip");
  const visible = (results ?? []).filter((b) => !excludeIds.has(b._id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Input icon="search" placeholder={t("kulup.bookSearchPlaceholder")} value={q} onChange={(e) => setQ(e.target.value)} />
      {q.trim() && visible.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 240, overflowY: "auto" }}>
          {visible.map((b) => (
            <div
              key={b._id}
              onClick={() => {
                onPick({ _id: b._id, title: b.title, author: b.author, coverUrl: b.coverUrl });
                setQ("");
              }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, borderRadius: "var(--radius-md)", cursor: "pointer", background: "var(--surface-sunken)" }}
            >
              <BookCover src={b.coverUrl || undefined} title={b.title} width={32} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "var(--fs-body-2)", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.title}</div>
                <div style={{ fontSize: "var(--fs-body-3)", color: "var(--text-secondary)" }}>{b.author}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClubBookManager({ clubId, userId }: { clubId: Id<"clubs">; userId: Id<"users"> }) {
  const { t } = useT();
  const [mode, setMode] = useState<"none" | "set" | "poll">("none");
  const [question, setQuestion] = useState("");
  const [pollBooks, setPollBooks] = useState<PickedBook[]>([]);
  const setActiveBook = useMutation(api.clubs.setActiveBook);
  const createPoll = useMutation(api.clubs.createPoll);

  const reset = () => {
    setMode("none");
    setQuestion("");
    setPollBooks([]);
  };

  const startPoll = async () => {
    if (pollBooks.length < 2) return;
    await createPoll({ clubId, userId, question: question.trim(), bookIds: pollBooks.map((b) => b._id) });
    reset();
  };

  if (mode === "none") {
    return (
      <Card style={{ marginBottom: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontWeight: "var(--fw-semibold)" as unknown as number }}>{t("kulup.bookOfMonth")}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant="menu" size="sm" icon="book" onClick={() => setMode("set")}>{t("kulup.setBook")}</Button>
          <Button variant="menu" size="sm" icon="list" onClick={() => setMode("poll")}>{t("kulup.startPoll")}</Button>
        </div>
      </Card>
    );
  }

  if (mode === "set") {
    return (
      <Card style={{ marginBottom: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontWeight: "var(--fw-semibold)" as unknown as number }}>{t("kulup.setBook")}</div>
        <BookSearchPicker
          excludeIds={new Set()}
          onPick={async (b) => {
            await setActiveBook({ clubId, userId, bookId: b._id });
            reset();
          }}
        />
        <Button variant="menu" size="sm" onClick={reset}>{t("common.cancel")}</Button>
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: 18, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontWeight: "var(--fw-semibold)" as unknown as number }}>{t("kulup.startPoll")}</div>
      <Input label={t("kulup.pollQuestion")} placeholder={t("kulup.pollQuestionPlaceholder")} value={question} onChange={(e) => setQuestion(e.target.value)} />
      {pollBooks.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {pollBooks.map((b) => (
            <div key={b._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, borderRadius: "var(--radius-md)", background: "var(--surface-sunken)" }}>
              <BookCover src={b.coverUrl || undefined} title={b.title} width={28} />
              <div style={{ flex: 1, fontSize: "var(--fs-body-2)" }}>{b.title}</div>
              <IconButton icon="x" size={28} label={t("common.remove")} onClick={() => setPollBooks((prev) => prev.filter((p) => p._id !== b._id))} />
            </div>
          ))}
        </div>
      )}
      <BookSearchPicker excludeIds={new Set(pollBooks.map((b) => b._id))} onPick={(b) => setPollBooks((prev) => [...prev, b])} />
      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="primary" size="sm" onClick={startPoll} disabled={pollBooks.length < 2}>{t("kulup.startPoll")}</Button>
        <Button variant="menu" size="sm" onClick={reset}>{t("common.cancel")}</Button>
      </div>
    </Card>
  );
}

function ClubPoll({ clubId, userId, isLeader }: { clubId: Id<"clubs">; userId?: Id<"users">; isLeader: boolean }) {
  const { t } = useT();
  const poll = useQuery(api.clubs.getActivePoll, { clubId, userId: userId ?? undefined });
  const voteOnPoll = useMutation(api.clubs.voteOnPoll);
  const closePoll = useMutation(api.clubs.closePoll);

  if (!poll) return null;

  return (
    <Card style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontWeight: "var(--fw-semibold)" as unknown as number }}>{poll.question}</div>
        <span style={{ fontSize: "var(--fs-body-3)", color: "var(--text-secondary)" }}>{t("kulup.voteCount", { count: poll.totalVotes })}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {poll.options.map((opt) => {
          const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
          const mine = poll.myVote === opt.bookId;
          return (
            <button
              key={opt.bookId}
              type="button"
              disabled={!userId}
              onClick={() => userId && voteOnPoll({ pollId: poll._id, userId, bookId: opt.bookId })}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 8,
                borderRadius: "var(--radius-md)",
                border: `1px solid ${mine ? "var(--accent)" : "var(--border-default)"}`,
                background: "var(--surface-card)",
                cursor: userId ? "pointer" : "default",
                overflow: "hidden",
                textAlign: "left",
              }}
            >
              <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: mine ? "var(--accent-tint)" : "var(--surface-sunken)", transition: "width var(--dur-base) var(--ease-out)", zIndex: 0 }} />
              <BookCover src={opt.book?.coverUrl || undefined} title={opt.book?.title ?? ""} width={28} style={{ position: "relative", zIndex: 1 }} />
              <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: "var(--fs-body-2)", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opt.book?.title ?? "—"}</div>
              </div>
              <span style={{ position: "relative", zIndex: 1, fontSize: "var(--fs-body-3)", fontWeight: "var(--fw-medium)" as unknown as number, color: mine ? "var(--accent)" : "var(--text-secondary)" }}>{pct}%</span>
            </button>
          );
        })}
      </div>
      {isLeader && userId && (
        <Button variant="menu" size="sm" onClick={() => closePoll({ pollId: poll._id, userId, setAsActiveBook: true })}>
          {t("kulup.closePoll")}
        </Button>
      )}
    </Card>
  );
}

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
  const avatarUpload = useImageUpload();
  const bannerUpload = useImageUpload();

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
      avatarUrl: avatarUpload.imageUrl.trim(),
      bannerUrl: bannerUpload.imageUrl.trim(),
    });
    setEditingImages(false);
  };

  const startEditingImages = () => {
    avatarUpload.setImageUrl(club.avatarUrl ?? "");
    bannerUpload.setImageUrl(club.bannerUrl ?? "");
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

      <div style={{ marginBottom: 8, padding: "0 4px" }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, lineHeight: 1.1, marginBottom: 6 }}>{club.name}</h1>
        <p style={{ color: "var(--text-secondary)" }}>{club.description}</p>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--fs-body-3)", marginTop: 6 }}>{t("kulup.memberCount", { count: club.memberCount })}</p>
      </div>

      {isLeader && (
        <div style={{ marginTop: 14, marginBottom: 18, padding: "0 4px" }}>
          {!editingImages && (
            <Button variant="menu" size="sm" icon="pencil" onClick={startEditingImages}>
              {t("kulup.editImages")}
            </Button>
          )}
          {editingImages && (
            <Card style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: "var(--fs-body-3)", fontWeight: "var(--fw-medium)" as unknown as number, color: "var(--text-secondary)", marginBottom: 7 }}>{t("ayarlar.profilFoto")}</div>
                <ImageAttachment imageUrl={avatarUpload.imageUrl} setImageUrl={avatarUpload.setImageUrl} uploading={avatarUpload.uploading} handleFiles={avatarUpload.handleFiles} />
              </div>
              <div>
                <div style={{ fontSize: "var(--fs-body-3)", fontWeight: "var(--fw-medium)" as unknown as number, color: "var(--text-secondary)", marginBottom: 7 }}>{t("ayarlar.profilBanner")}</div>
                <ImageAttachment imageUrl={bannerUpload.imageUrl} setImageUrl={bannerUpload.setImageUrl} uploading={bannerUpload.uploading} handleFiles={bannerUpload.handleFiles} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="primary" size="sm" onClick={saveImages}>{t("common.save")}</Button>
                <Button variant="menu" size="sm" onClick={() => setEditingImages(false)}>{t("common.cancel")}</Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {isLeader && user && <ClubBookManager clubId={clubId} userId={user._id} />}

      <ClubPoll clubId={clubId} userId={user?._id} isLeader={isLeader} />

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
