import { useState } from "react";

var VARIANT_MAP = {
  default: {
    color: "var(--text-muted)",
    hoverBg: "var(--bg-hover)",
    hoverColor: "var(--text-secondary)",
    border: "transparent",
  },
  danger: {
    color: "var(--text-faint)",
    hoverBg: "var(--color-error-bg)",
    hoverColor: "var(--color-error)",
    border: "transparent",
  },
  brand: {
    color: "var(--text-muted)",
    hoverBg: "var(--brand-bg)",
    hoverColor: "var(--brand)",
    border: "transparent",
  },
};

var SIZE_MAP = {
  sm: { wh: 36, iconSize: 16 },
  md: { wh: 40, iconSize: 18 },
  header: { wh: 32, iconSize: 14 },
};

export default function ButtonUtility({
  icon, variant, size, onClick, title, ariaLabel, disabled, sx,
}) {
  var [hovered, setHovered] = useState(false);
  var v = VARIANT_MAP[variant] || VARIANT_MAP.default;
  var s = SIZE_MAP[size] || SIZE_MAP.sm;

  var style = {
    width: s.wh,
    height: s.wh,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    border: "1px solid " + v.border,
    borderRadius: "var(--r-md)",
    background: hovered && !disabled ? v.hoverBg : "transparent",
    color: hovered && !disabled ? v.hoverColor : v.color,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    transition: "background 0.15s, color 0.15s, opacity 0.15s, border-color 0.15s",
    flexShrink: 0,
  };

  if (sx) style = Object.assign({}, style, sx);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      title={title}
      aria-label={ariaLabel || title}
      style={style}
      onMouseEnter={function () { setHovered(true); }}
      onMouseLeave={function () { setHovered(false); }}
      onFocus={function () { setHovered(true); }}
      onBlur={function () { setHovered(false); }}
    >
      {icon}
    </button>
  );
}
