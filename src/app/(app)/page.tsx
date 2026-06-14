"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconButton } from "@/components/ui/IconButton";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { FeedPost } from "@/components/feed/FeedPost";
import { ImageAttachment, useImageUpload } from "@/components/feed/ImageAttachment";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

const POST_TYPE_BY_TAB: Record<string, "okuma" | "alinti" | "kitap_alma"> = {
  "Kitap Kaydı": "okuma",
  "Alıntı": "alinti",
  "Kitap Alışverişi": "kitap_alma",
};

type PickedBook = { _id: Id<"books">; title: string; author: string; coverUrl: string };

function Composer({ userId }: { userId: Id<"users"> }) {
  const { t } = useT();
  const [tab, setTab] = useState("Kitap Kaydı");
  const [text, setText] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const { imageUrl, setImageUrl, uploading, handleFiles } = useImageUpload();
  const [bookSearch, setBookSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<PickedBook | null>(null);
  const [pageNumber, setPageNumber] = useState("");
  const createPost = useMutation(api.posts.createPost);

  const isBookLog = tab === "Kitap Kaydı";
  const bookResults = useQuery(
    api.books.searchLocalBooks,
    isBookLog && !selectedBook && bookSearch.trim() ? { query: bookSearch.trim() } : "skip"
  );

  const share = async () => {
    if (!text.trim() && !imageUrl.trim()) return;
    await createPost({
      authorId: userId,
      type: POST_TYPE_BY_TAB[tab] ?? "direkt",
      content: text.trim() || undefined,
      mediaUrls: imageUrl.trim() ? [imageUrl.trim()] : undefined,
      bookIds: selectedBook ? [selectedBook._id] : undefined,
      pageNumber: selectedBook && pageNumber.trim() ? Number(pageNumber) : undefined,
      isSilent: false,
    });
    setText("");
    setImageUrl("");
    setShowImageInput(false);
    setSelectedBook(null);
    setBookSearch("");
    setPageNumber("");
  };

  return (
    <Card padding={18} style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <Avatar size="md" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            placeholder={t("composer.placeholder")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setShowImageInput(true);
              handleFiles(e.dataTransfer.files);
            }}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 16,
              color: "var(--text-primary)",
              padding: "8px 0",
              fontFamily: "var(--font-sans)",
            }}
          />

          {showImageInput && (
            <ImageAttachment imageUrl={imageUrl} setImageUrl={setImageUrl} uploading={uploading} handleFiles={handleFiles} />
          )}

          {isBookLog && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selectedBook ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <Tag onRemove={() => setSelectedBook(null)}>{selectedBook.title}</Tag>
                  <Input
                    type="number"
                    min={1}
                    placeholder={t("composer.pageNumberPlaceholder")}
                    value={pageNumber}
                    onChange={(e) => setPageNumber(e.target.value)}
                    fullWidth={false}
                    style={{ width: 110 }}
                  />
                </div>
              ) : (
                <>
                  <Input
                    icon="search"
                    placeholder={t("composer.bookSearchPlaceholder")}
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                  />
                  {bookResults && bookResults.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                      {bookResults.map((b) => (
                        <div
                          key={b._id}
                          onClick={() => {
                            setSelectedBook({ _id: b._id, title: b.title, author: b.author, coverUrl: b.coverUrl });
                            setBookSearch("");
                          }}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 10px",
                            borderRadius: "var(--radius-md)",
                            cursor: "pointer",
                            background: "var(--surface-sunken)",
                          }}
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
                </>
              )}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Tabs
                variant="segmented"
                size="sm"
                items={[
                  { value: "Kitap Kaydı", label: t("composer.tab.bookLog") },
                  { value: "Alıntı", label: t("composer.tab.quote") },
                  { value: "Kitap Alışverişi", label: t("composer.tab.bookTrade") },
                ]}
                value={tab}
                onChange={(v) => {
                  setTab(v);
                  if (v !== "Kitap Kaydı") {
                    setSelectedBook(null);
                    setBookSearch("");
                    setPageNumber("");
                  }
                }}
              />
              <IconButton
                icon="image"
                label={t("composer.addImage")}
                active={showImageInput}
                onClick={() => setShowImageInput((v) => !v)}
              />
            </div>
            <Button size="sm" variant="primary" onClick={share}>
              {t("common.share")}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function AnasayfaPage() {
  const { user } = useAuth();
  const feed = useQuery(api.posts.getFeed, { limit: 20, cursor: null });

  return (
    <>
      {user && <Composer userId={user._id} />}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {feed?.map((p) => (
          <FeedPost key={p._id} post={p} currentUserId={user?._id} />
        ))}
      </div>
    </>
  );
}
