"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { FeedPost } from "@/components/feed/FeedPost";
import { useAuth } from "@/lib/auth/AuthProvider";

function Composer({ userId }: { userId: Id<"users"> }) {
  const [tab, setTab] = useState("Kitap Kaydı");
  const [text, setText] = useState("");
  const createPost = useMutation(api.posts.createPost);

  const share = async () => {
    if (!text.trim()) return;
    await createPost({
      authorId: userId,
      type: "direkt",
      content: text.trim(),
      isSilent: false,
    });
    setText("");
  };

  return (
    <Card padding={18} style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <Avatar size="md" />
        <div style={{ flex: 1 }}>
          <input
            placeholder="Neler okuyorsun?"
            value={text}
            onChange={(e) => setText(e.target.value)}
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            <Tabs variant="segmented" size="sm" items={["Kitap Kaydı", "Alıntı", "Kitap Alışverişi"]} value={tab} onChange={setTab} />
            <Button size="sm" variant="primary" onClick={share}>
              Paylaş
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
