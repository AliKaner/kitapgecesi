import { Icon, IconName } from "./Icon";
import { useT } from "@/lib/i18n/I18nProvider";

export type RoleBadgeKey = "founder" | "vip" | "admin" | "yazar";

const ROLE_BADGE_CONFIG: Record<RoleBadgeKey, { icon: IconName; color: string; labelKey: "roleBadge.founder" | "roleBadge.vip" | "roleBadge.admin" | "roleBadge.yazar" }> = {
  founder: { icon: "crown", color: "#C8881F", labelKey: "roleBadge.founder" },
  vip: { icon: "star", color: "#A855F7", labelKey: "roleBadge.vip" },
  admin: { icon: "shield", color: "#C0432F", labelKey: "roleBadge.admin" },
  yazar: { icon: "feather", color: "#2A6FDB", labelKey: "roleBadge.yazar" },
};

export function RoleBadges({ badges, size = 15 }: { badges?: RoleBadgeKey[] | null; size?: number }) {
  const { t } = useT();
  if (!badges || badges.length === 0) return null;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {badges.map((key) => {
        const cfg = ROLE_BADGE_CONFIG[key];
        if (!cfg) return null;
        return (
          <span key={key} title={t(cfg.labelKey)} style={{ display: "inline-flex", color: cfg.color }}>
            <Icon name={cfg.icon} size={size} fill />
          </span>
        );
      })}
    </span>
  );
}
