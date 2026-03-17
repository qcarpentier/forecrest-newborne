import { Info, Lightbulb, Warning } from "@phosphor-icons/react";

var VARIANTS = {
  info: {
    bg: "var(--color-success-bg)",
    border: "var(--color-success-border)",
    accent: "var(--color-success)",
    Icon: Info,
  },
  warning: {
    bg: "var(--color-warning-bg)",
    border: "var(--color-warning-border)",
    accent: "var(--color-warning)",
    Icon: Warning,
  },
  tip: {
    bg: "var(--brand-bg)",
    border: "var(--brand-border)",
    accent: "var(--brand)",
    Icon: Lightbulb,
  },
};

export default function ExplainerBox({ title, children, variant }) {
  var v = VARIANTS[variant] || VARIANTS.info;
  var IconComp = v.Icon;

  return (
    <div style={{
      padding: "var(--sp-4)", marginBottom: "var(--gap-lg)",
      background: v.bg, border: "1px solid " + v.border,
      borderRadius: "var(--r-lg)", borderLeft: "3px solid " + v.accent,
    }}>
      {title ? (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", fontSize: 13, fontWeight: 600, color: v.accent, marginBottom: "var(--sp-2)" }}>
          <IconComp size={15} weight="fill" />
          {title}
        </div>
      ) : null}
      <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.65 }}>
        {children}
      </div>
    </div>
  );
}
