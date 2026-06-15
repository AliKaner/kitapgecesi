"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { FeedPost } from "@/components/feed/FeedPost";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useT } from "@/lib/i18n/I18nProvider";

export default function PostPage() {
  const { t } = useT();
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const post = useQuery(api.posts.getPost, { postId: params.id as Id<"posts"> });

  if (post === undefined || user === undefined) return null;
  if (post === null) return <p style={{ color: "var(--text-secondary)" }}>{t("post.notFound")}</p>;

  return <FeedPost post={post} currentUserId={user?._id} />;
}
