import { Info, Lightbulb, Warning, XCircle, X, Sparkle } from "@phosphor-icons/react";

var VARIANTS = {
  info: {
    bg: "var(--bg-accordion)",
    border: "var(--border)",
    accent: "var(--color-info)",
    iconBg: "var(--color-info-bg)",
    iconBorder: "var(--color-info-border)",
    Icon: Info,
  },
  warning: {
    bg: "var(--bg-accordion)",
    border: "var(--border)",
    accent: "var(--color-warning)",
    iconBg: "var(--color-warning-bg)",
    iconBorder: "var(--color-warning-border)",
    Icon: Warning,
  },
  tip: {
    bg: "var(--bg-accordion)",
    border: "var(--border)",
    accent: "var(--brand)",
    iconBg: "var(--brand-bg)",
    iconBorder: "var(--brand-border)",
    Icon: Sparkle,
  },
  error: {
    bg: "var(--color-error-bg)",
    border: "var(--color-error-border)",
    accent: "var(--color-error)",
    iconBg: "var(--color-error-bg)",
    iconBorder: "var(--color-error-border)",
    Icon: XCircle,
  },
};

export default function ExplainerBox({ title, children, variant, icon, onClose }) {
  var v = VARIANTS[variant] || VARIANTS.info;
  var IconComp = icon || v.Icon;

  return (
    <div style={{
      position: "relative",
      display: "flex", gap: "var(--sp-3)", alignItems: "flex-start",
      padding: "var(--sp-4)", marginBottom: "var(--gap-lg)",
      background: v.bg, border: "1px solid " + v.border,
      borderRadius: "var(--r-lg)",
    }}>
      {/* Icon circle */}
      <div style={{
        width: 36, height: 36, borderRadius: "var(--r-md)", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: v.iconBg, border: "1px solid " + v.iconBorder,
      }}>
        <IconComp size={18} weight="duotone" color={v.accent} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, paddingRight: onClose ? 24 : 0 }}>
        {title ? (
          <div style={{
            fontSize: 14, fontWeight: 700, color: "var(--text-primary)",
            marginBottom: "var(--sp-1)", lineHeight: 1.3,
            fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
          }}>
            {title}
          </div>
        ) : null}
        <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
          {children}
        </div>
      </div>

      {/* Close button */}
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute", top: "var(--sp-3)", right: "var(--sp-3)",
            background: "none", border: "none", cursor: "pointer",
            display: "flex", padding: "var(--sp-1)", color: "var(--text-faint)",
            borderRadius: "var(--r-sm)",
          }}
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}
