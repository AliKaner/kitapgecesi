"use client";

import { CSSProperties, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { IconButton } from "../ui/IconButton";
import { Switch } from "../ui/Switch";
import { Icon } from "../ui/Icon";
import { useT } from "@/lib/i18n/I18nProvider";
import {
  ShowcaseConfig,
  ShowcaseConfigEditor,
  WIDGET_META,
  WIDGET_ORDER,
  WidgetType,
} from "./showcaseWidgets";

interface LocalRow {
  _id: Id<"showcases">;
  widgetType: WidgetType;
  isEnabled: boolean;
  config: ShowcaseConfig;
}

const MAX_ROWS = 12;

export function ShowcaseEditor({ userId }: { userId: Id<"users"> }) {
  const { t } = useT();
  const showcases = useQuery(api.showcases.getAllShowcases, { userId });
  const addShowcase = useMutation(api.showcases.addShowcase);
  const removeShowcase = useMutation(api.showcases.removeShowcase);
  const updateLayout = useMutation(api.showcases.updateShowcaseLayout);

  const [rows, setRows] = useState<LocalRow[] | null>(null);
  const [saved, setSaved] = useState(false);
  const [adding, setAdding] = useState(false);
  const [loadedFrom, setLoadedFrom] = useState<typeof showcases>(undefined);

  // Sync local editable rows from the server query (only when it changes).
  if (showcases !== loadedFrom) {
    setLoadedFrom(showcases);
    if (showcases) {
      setRows(
        showcases
          .filter((s): s is typeof s & { widgetType: WidgetType } => (WIDGET_ORDER as string[]).includes(s.widgetType))
          .map((s) => {
            let parsed: ShowcaseConfig = {};
            try {
              parsed = JSON.parse(s.config);
            } catch {
              parsed = {};
            }
            return { _id: s._id, widgetType: s.widgetType, isEnabled: s.isEnabled, config: parsed };
          })
      );
    }
  }

  if (!rows) return null;

  const move = (index: number, dir: -1 | 1) => {
    const next = [...rows];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);
    setSaved(false);
  };

  const update = (index: number, patch: Partial<LocalRow>) => {
    const next = [...rows];
    next[index] = { ...next[index], ...patch };
    setRows(next);
    setSaved(false);
  };

  const save = async () => {
    await updateLayout({
      userId,
      layouts: rows.map((r, i) => ({
        id: r._id,
        order: i,
        isEnabled: r.isEnabled,
        config: JSON.stringify(r.config),
      })),
    });
    setSaved(true);
  };

  const add = async (type: WidgetType) => {
    setAdding(false);
    await addShowcase({ userId, widgetType: type });
    setSaved(false);
    // The query will refetch and re-seed `rows` via the sync above.
  };

  const remove = async (row: LocalRow) => {
    setRows(rows.filter((r) => r._id !== row._id));
    await removeShowcase({ userId, showcaseId: row._id });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {rows.map((row, i) => (
        <Card key={row._id} style={{ display: "flex", flexDirection: "column", gap: 12 } as CSSProperties}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <IconButton icon="arrow-up" size={28} iconSize={14} label={t("showcase.moveUp")} disabled={i === 0} onClick={() => move(i, -1)} />
              <IconButton icon="arrow-down" size={28} iconSize={14} label={t("showcase.moveDown")} disabled={i === rows.length - 1} onClick={() => move(i, 1)} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
              <Icon name={WIDGET_META[row.widgetType].icon} size={16} color="var(--text-secondary)" />
              <span style={{ fontSize: "var(--fs-body-1)", fontWeight: "var(--fw-semibold)" as unknown as number }}>
                {t(WIDGET_META[row.widgetType].labelKey as Parameters<typeof t>[0])}
              </span>
            </div>
            <Switch checked={row.isEnabled} onChange={(checked) => update(i, { isEnabled: checked })} />
            <IconButton icon="x" size={28} iconSize={15} label={t("showcase.remove")} onClick={() => remove(row)} />
          </div>

          {row.isEnabled && (
            <ShowcaseConfigEditor type={row.widgetType} config={row.config} userId={userId} onChange={(config) => update(i, { config })} />
          )}
        </Card>
      ))}

      {rows.length < MAX_ROWS && (
        <div style={{ position: "relative" }}>
          <Button variant="menu" icon="plus" onClick={() => setAdding((v) => !v)}>
            {t("showcase.add")}
          </Button>
          {adding && (
            <Card style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4, padding: 6 }}>
              {WIDGET_ORDER.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => add(type)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 10px",
                    borderRadius: "var(--radius-md)",
                    border: "none",
                    background: "transparent",
                    color: "var(--text-primary)",
                    fontSize: "var(--fs-body-2)",
                    fontFamily: "var(--font-sans)",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-sunken)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Icon name={WIDGET_META[type].icon} size={16} color="var(--text-secondary)" />
                  {t(WIDGET_META[type].labelKey as Parameters<typeof t>[0])}
                </button>
              ))}
            </Card>
          )}
        </div>
      )}

      <div>
        <Button variant="primary" onClick={save}>
          {saved ? t("common.saved") : t("common.save")}
        </Button>
      </div>
    </div>
  );
}
