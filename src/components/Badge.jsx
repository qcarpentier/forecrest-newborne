import { X } from "@phosphor-icons/react";
import { BADGE_COLORS } from "../constants/colors";

var TIER_VARS = {
  S: { bg: "var(--tier-s-bg)", text: "var(--tier-s-text)", border: "var(--tier-s-border)" },
  A: { bg: "var(--tier-a-bg)", text: "var(--tier-a-text)", border: "var(--tier-a-border)" },
  B: { bg: "var(--tier-b-bg)", text: "var(--tier-b-text)", border: "var(--tier-b-border)" },
  C: { bg: "var(--tier-c-bg)", text: "var(--tier-c-text)", border: "var(--tier-c-border)" },
  D: { bg: "var(--bg-accordion)", text: "var(--text-tertiary)", border: "var(--border-strong)" },
};

var SIZE_MAP = {
  sm: { padding: "3px var(--sp-2)", fontSize: 12, dotSize: 6 },
  md: { padding: "4px var(--sp-3)", fontSize: 13, dotSize: 7 },
  lg: { padding: "5px var(--sp-3)", fontSize: 14, dotSize: 8 },
};

var RADIUS_MAP = {
  pill:    "var(--r-full, 999px)",
  badge:   "var(--r-md)",
  modern:  "var(--r-md)",
};

export default function Badge({ t, tier, color, size, type, dot, icon, onClose, children }) {
  var tierKey = tier || t;
  var s = SIZE_MAP[size] || SIZE_MAP.sm;
  var radius = RADIUS_MAP[type] || RADIUS_MAP.pill;
  var isModern = type === "modern";
  var colors;

  if (tierKey && TIER_VARS[tierKey]) {
    colors = TIER_VARS[tierKey];
  } else if (color && BADGE_COLORS[color]) {
    colors = BADGE_COLORS[color];
  } else if (!tierKey && !color) {
    colors = BADGE_COLORS.gray;
  } else {
    colors = BADGE_COLORS.gray;
  }

  var content = children || (tierKey ? ("Tier " + String(tierKey)) : null);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--sp-1)",
        padding: s.padding,
        borderRadius: radius,
        fontSize: s.fontSize,
        fontWeight: 600,
        lineHeight: 1.2,
        background: colors.bg,
        color: colors.text,
        border: isModern ? "none" : ("1px solid " + colors.border),
        boxShadow: isModern ? "0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px " + colors.border : "none",
        whiteSpace: "nowrap",
      }}
    >
      {dot ? (
        <span style={{
          width: s.dotSize, height: s.dotSize,
          borderRadius: "50%",
          background: colors.text,
          flexShrink: 0,
        }} />
      ) : null}
      {icon ? <span style={{ display: "inline-flex", flexShrink: 0 }}>{icon}</span> : null}
      {content}
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          style={{
            display: "inline-flex", alignItems: "center",
            background: "none", border: "none", padding: 0,
            cursor: "pointer", color: colors.text, marginLeft: 2,
          }}
        >
          <X size={s.fontSize - 2} weight="bold" />
        </button>
      ) : null}
    </span>
  );
}
