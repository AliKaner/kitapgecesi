"use client";

import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useT } from "@/lib/i18n/I18nProvider";

export interface RepostModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (content?: string) => void;
}

export function RepostModal({ open, onClose, onSubmit }: RepostModalProps) {
  const { t } = useT();
  const [text, setText] = useState("");

  const handleClose = () => {
    setText("");
    onClose();
  };

  const submit = (content?: string) => {
    onSubmit(content);
    setText("");
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title={t("post.repostModalTitle")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("post.repostQuotePlaceholder")}
          rows={3}
          style={{
            width: "100%",
            border: "1px solid var(--border-default)",
            borderRadius: "10px",
            padding: "10px 12px",
            fontSize: "var(--fs-body-1)",
            fontFamily: "var(--font-sans)",
            background: "var(--surface-card)",
            color: "var(--text-primary)",
            resize: "vertical",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Button
            variant="primary"
            onClick={() => submit(text.trim() || undefined)}
            disabled={!text.trim()}
          >
            {t("post.repostQuote")}
          </Button>
          <Button variant="menu" onClick={() => submit(undefined)}>
            {t("post.repostPlain")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
