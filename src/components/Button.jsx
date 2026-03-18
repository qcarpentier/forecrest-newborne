import { useState } from "react";
import { SpinnerGap } from "@phosphor-icons/react";

var COLOR_MAP = {
  primary: {
    bg: "var(--brand)", color: "var(--color-on-brand)",
    border: "var(--brand)", hoverBg: "var(--brand-hover)",
  },
  secondary: {
    bg: "var(--brand-bg)", color: "var(--brand)",
    border: "var(--brand-border)", hoverBg: "var(--brand-bg-hover, var(--brand-bg))",
  },
  tertiary: {
    bg: "transparent", color: "var(--text-secondary)",
    border: "transparent", hoverBg: "var(--bg-hover)",
  },
  "primary-destructive": {
    bg: "var(--color-error)", color: "#fff",
    border: "var(--color-error)", hoverBg: "var(--color-error-hover, var(--color-error))",
  },
  "secondary-destructive": {
    bg: "var(--color-error-bg)", color: "var(--color-error)",
    border: "var(--color-error-border)", hoverBg: "var(--color-error-bg)",
  },
  "tertiary-destructive": {
    bg: "transparent", color: "var(--color-error)",
    border: "transparent", hoverBg: "var(--color-error-bg)",
  },
  "link-color": {
    bg: "transparent", color: "var(--brand)",
    border: "transparent", hoverBg: "transparent",
  },
  "link-gray": {
    bg: "transparent", color: "var(--text-muted)",
    border: "transparent", hoverBg: "transparent",
  },
};

var SIZE_MAP = {
  sm: { height: 30, fontSize: 12, px: "var(--sp-3)", gap: "var(--sp-1)", iconSize: 14 },
  md: { height: 36, fontSize: 13, px: "var(--sp-4)", gap: "var(--sp-2)", iconSize: 16 },
  lg: { height: 40, fontSize: 14, px: "var(--sp-5)", gap: "var(--sp-2)", iconSize: 18 },
  xl: { height: 44, fontSize: 15, px: "var(--sp-6)", gap: "var(--sp-2)", iconSize: 20 },
};

export default function Button({
  color, size, isLoading, isDisabled, iconLeading, iconTrailing,
  href, onClick, type, sx, children, title, ariaLabel,
}) {
  var [hovered, setHovered] = useState(false);
  var c = COLOR_MAP[color] || COLOR_MAP.primary;
  var s = SIZE_MAP[size] || SIZE_MAP.md;
  var disabled = isDisabled || isLoading;
  var isLink = color === "link-color" || color === "link-gray";

  var baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: s.gap,
    height: isLink ? "auto" : s.height,
    padding: isLink ? 0 : ("0 " + s.px),
    fontSize: s.fontSize,
    fontWeight: 600,
    fontFamily: "inherit",
    lineHeight: 1,
    border: isLink ? "none" : ("1px solid " + c.border),
    borderRadius: isLink ? 0 : "var(--r-md)",
    background: hovered && !disabled ? c.hoverBg : c.bg,
    color: c.color,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "background 0.15s, border-color 0.15s, opacity 0.15s",
    textDecoration: isLink && hovered ? "underline" : "none",
    whiteSpace: "nowrap",
    userSelect: "none",
  };

  var style = sx ? Object.assign({}, baseStyle, sx) : baseStyle;

  var spinner = isLoading ? (
    <SpinnerGap
      size={s.iconSize}
      weight="bold"
      style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}
    />
  ) : null;

  var content = (
    <>
      {isLoading ? spinner : (iconLeading || null)}
      {children}
      {!isLoading && iconTrailing ? iconTrailing : null}
    </>
  );

  var handlers = {
    onMouseEnter: function () { setHovered(true); },
    onMouseLeave: function () { setHovered(false); },
  };

  if (href && !disabled) {
    return (
      <a
        href={href}
        style={style}
        title={title}
        aria-label={ariaLabel}
        {...handlers}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type={type || "button"}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      style={style}
      title={title}
      aria-label={ariaLabel}
      aria-busy={isLoading || undefined}
      {...handlers}
    >
      {content}
    </button>
  );
}
