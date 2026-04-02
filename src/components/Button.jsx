import { useState } from "react";
import { Loading01 } from "@untitledui/icons";
import { cx } from "../utils";

var COLOR_MAP = {
  primary: {
    bg: "var(--brand)", color: "var(--color-on-brand)",
    border: "var(--brand)", hoverBg: "var(--brand-hover)", hoverBorder: "var(--brand-hover)",
    shadow: "var(--shadow-xs)",
  },
  secondary: {
    bg: "var(--bg-card)", color: "var(--text-primary)",
    border: "var(--border)", hoverBg: "var(--bg-hover)", hoverBorder: "var(--input-border-hover)",
    shadow: "var(--shadow-xs)",
  },
  tertiary: {
    bg: "transparent", color: "var(--text-secondary)",
    border: "transparent", hoverBg: "var(--brand-bg)", hoverBorder: "transparent",
    shadow: "none",
  },
  "primary-destructive": {
    bg: "var(--color-error)", color: "#fff",
    border: "var(--color-error)", hoverBg: "var(--color-error-hover, var(--color-error))", hoverBorder: "var(--color-error-hover, var(--color-error))",
    shadow: "var(--shadow-xs)",
  },
  "secondary-destructive": {
    bg: "var(--bg-card)", color: "var(--color-error)",
    border: "var(--color-error-border)", hoverBg: "var(--color-error-bg)", hoverBorder: "var(--color-error-border)",
    shadow: "var(--shadow-xs)",
  },
  "tertiary-destructive": {
    bg: "transparent", color: "var(--color-error)",
    border: "transparent", hoverBg: "var(--color-error-bg)", hoverBorder: "transparent",
    shadow: "none",
  },
  "link-color": {
    bg: "transparent", color: "var(--brand)",
    border: "transparent", hoverBg: "transparent", hoverBorder: "transparent",
    shadow: "none",
  },
  "link-gray": {
    bg: "transparent", color: "var(--text-muted)",
    border: "transparent", hoverBg: "transparent", hoverBorder: "transparent",
    shadow: "none",
  },
};

var SIZE_MAP = {
  sm: { height: "var(--control-height-sm)", fontSize: 12, px: "var(--sp-3)", gap: "var(--sp-1)", iconSize: 14 },
  md: { height: "var(--control-height-md)", fontSize: 13, px: "var(--sp-4)", gap: "var(--sp-2)", iconSize: 16 },
  lg: { height: "var(--control-height-md)", fontSize: 14, px: "var(--sp-5)", gap: "var(--sp-2)", iconSize: 18 },
  xl: { height: "var(--control-height-lg)", fontSize: 15, px: "var(--sp-6)", gap: "var(--sp-2)", iconSize: 20 },
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
    gap: s.gap,
    height: isLink ? "auto" : s.height,
    padding: isLink ? 0 : ("0 " + s.px),
    fontSize: s.fontSize,
    border: isLink ? "none" : ("1px solid " + (hovered && !disabled ? c.hoverBorder : c.border)),
    background: hovered && !disabled ? c.hoverBg : c.bg,
    color: c.color,
    opacity: disabled ? 0.5 : 1,
    textDecoration: isLink && hovered ? "underline" : "none",
    boxShadow: isLink ? "none" : c.shadow,
    fontFamily: "inherit",
    transform: hovered && !disabled && !isLink ? "translateY(-1px)" : "translateY(0)",
  };

  var style = sx ? Object.assign({}, baseStyle, sx) : baseStyle;
  var className = cx(
    "inline-flex items-center justify-center whitespace-nowrap font-semibold leading-none transition-all duration-150",
    "select-none focus-visible:outline-none",
    isLink ? "rounded-none" : "rounded-[var(--r-md)]",
    disabled ? "cursor-not-allowed" : "cursor-pointer"
  );

  var spinner = isLoading ? (
    <Loading01 className="shrink-0 animate-spin" style={{ width: s.iconSize, height: s.iconSize }} />
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
        className={className}
        style={style}
        title={title}
        aria-label={ariaLabel}
        onClick={onClick}
        {...handlers}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type={type || "button"}
      className={className}
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
