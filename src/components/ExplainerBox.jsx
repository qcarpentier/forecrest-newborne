import { Info, Lightbulb, Warning, XCircle, X } from "@phosphor-icons/react";

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
  error: {
    bg: "var(--color-error-bg)",
    border: "var(--color-error-border)",
    accent: "var(--color-error)",
    Icon: XCircle,
  },
};

export default function ExplainerBox({ title, children, variant, icon, onClose }) {
  var v = VARIANTS[variant] || VARIANTS.info;
  var IconComp = icon || v.Icon;

  return (
    <div style={{
      position: "relative",
      padding: "var(--sp-4)", marginBottom: "var(--gap-lg)",
      background: v.bg, border: "1px solid " + v.border,
      borderRadius: "var(--r-lg)", borderLeft: "3px solid " + v.accent,
    }}>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute", top: "var(--sp-2)", right: "var(--sp-2)",
            background: "none", border: "none", cursor: "pointer",
            display: "flex", padding: "var(--sp-1)", color: v.accent,
          }}
        >
          <X size={14} weight="bold" />
        </button>
      ) : null}
      {title ? (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", fontSize: 13, fontWeight: 600, color: v.accent, marginBottom: "var(--sp-2)", paddingRight: onClose ? 24 : 0 }}>
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
