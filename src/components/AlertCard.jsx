/**
 * AlertCard — Contextual alert card with modern design.
 *
 * Props:
 *   color    : "info" | "success" | "warning" | "error" | "brand"
 *   title    : string (required)
 *   children : description JSX (can include FinanceLink, text, etc.)
 *   icon     : Phosphor icon component (optional, auto-picked from color)
 *   actions  : JSX node for action buttons (optional)
 *   onClose  : function — shows close button if provided (optional)
 *   compact  : boolean — reduce padding (optional)
 */
import { Info, CheckCircle, Warning, XCircle, Megaphone, X } from "@phosphor-icons/react";
import { ALERT_VARIANTS } from "../constants/colors";

var ICON_MAP = {
  info: Info,
  success: CheckCircle,
  warning: Warning,
  error: XCircle,
  brand: Megaphone,
};

export default function AlertCard({ color, title, children, icon, actions, onClose, compact }) {
  var variant = ALERT_VARIANTS[color] || ALERT_VARIANTS.info;
  var IconComp = icon || ICON_MAP[color] || Info;
  var pad = compact ? "var(--sp-3)" : "var(--sp-4)";

  return (
    <div style={{
      background: variant.bg,
      border: "1px solid " + variant.border,
      borderRadius: "var(--r-lg)",
      padding: pad,
      display: "flex",
      gap: "var(--sp-3)",
      alignItems: "flex-start",
      position: "relative",
    }}>
      {/* Icon */}
      <div style={{
        width: 32, height: 32, borderRadius: "var(--r-md)",
        background: variant.border,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <IconComp size={16} weight="duotone" color={variant.accent} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: variant.accent,
          marginBottom: children ? 4 : 0,
          lineHeight: 1.3,
        }}>
          {title}
        </div>
        {children ? (
          <div style={{
            fontSize: 12, color: "var(--text-secondary)",
            lineHeight: 1.6,
          }}>
            {children}
          </div>
        ) : null}
        {actions ? (
          <div style={{
            display: "flex", gap: "var(--sp-2)", marginTop: "var(--sp-3)",
            alignItems: "center",
          }}>
            {actions}
          </div>
        ) : null}
      </div>

      {/* Close button */}
      {onClose ? (
        <button
          onClick={onClose}
          title="Fermer"
          style={{
            width: 24, height: 24, borderRadius: "var(--r-full)",
            border: "1px solid " + variant.border,
            background: variant.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0, padding: 0,
            transition: "background 0.15s",
          }}
          onMouseEnter={function (e) { e.currentTarget.style.background = variant.border; }}
          onMouseLeave={function (e) { e.currentTarget.style.background = variant.bg; }}
        >
          <X size={12} weight="bold" color={variant.accent} />
        </button>
      ) : null}
    </div>
  );
}
