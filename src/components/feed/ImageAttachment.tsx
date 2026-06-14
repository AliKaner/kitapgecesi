"use client";

import { CSSProperties, useRef, useState } from "react";
import { useConvex, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Icon } from "../ui/Icon";
import { useT } from "@/lib/i18n/I18nProvider";

/* Image attachment for post composers: pick a file from disk or drag & drop
   it onto the drop zone (or the text field above it). Uploads to Convex file
   storage and resolves to a servable URL stored as the post's mediaUrl. */

export function useImageUpload() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const convex = useConvex();
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | File[] | null | undefined) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await res.json();
      const url = await convex.query(api.files.getUrl, { storageId });
      if (url) setImageUrl(url);
    } finally {
      setUploading(false);
    }
  };

  return { imageUrl, setImageUrl, uploading, handleFiles };
}

export interface ImageAttachmentProps {
  imageUrl: string;
  setImageUrl: (url: string) => void;
  uploading: boolean;
  handleFiles: (files: FileList | File[] | null | undefined) => void;
}

export function ImageAttachment({ imageUrl, setImageUrl, uploading, handleFiles }: ImageAttachmentProps) {
  const { t } = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  if (imageUrl) {
    return (
      <div style={{ position: "relative", width: "fit-content" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" style={{ maxHeight: 160, borderRadius: "var(--radius-md)", display: "block" } as CSSProperties} />
        <button
          type="button"
          onClick={() => setImageUrl("")}
          aria-label={t("common.remove")}
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: "var(--radius-pill)",
            border: "none",
            background: "rgba(0,0,0,0.55)",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          <Icon name="x" size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        border: `1px dashed ${dragOver ? "var(--accent)" : "var(--border-default)"}`,
        borderRadius: "var(--radius-md)",
        padding: "18px 12px",
        textAlign: "center",
        cursor: "pointer",
        color: "var(--text-secondary)",
        fontSize: "var(--fs-body-3)",
        background: dragOver ? "var(--accent-tint)" : "transparent",
        transition: "background var(--dur-fast), border-color var(--dur-fast)",
      } as CSSProperties}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: "none" }}
      />
      <Icon name="image" size={16} />
      {uploading ? t("composer.uploading") : t("composer.imageDropHint")}
    </div>
  );
}
