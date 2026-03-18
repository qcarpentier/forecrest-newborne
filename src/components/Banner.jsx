import { Info, CheckCircle, Warning, XCircle, Megaphone, X } from "@phosphor-icons/react";
import { useT } from "../context";
import { ALERT_VARIANTS } from "../constants/colors";

var ICON_MAP = {
  info: Info,
  success: CheckCircle,
  warning: Warning,
  error: XCircle,
  brand: Megaphone,
};

export default function Banner({ visible, onClose, color, title, description, icon }) {
  var t = useT();
  if (!visible) return null;

  var variant = ALERT_VARIANTS[color] || ALERT_VARIANTS.info;
  var IconComp = icon || ICON_MAP[color] || Info;
  var text = description || t.banner.info;

  return (
    <div
      style={{
        background: variant.bg,
        borderBottom: "1px solid " + variant.border,
      }}
    >
      <div
        style={{
          maxWidth: "var(--page-max)",
          margin: "0 auto",
          padding: "var(--sp-2) var(--page-px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--sp-3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", flex: 1, minWidth: 0 }}>
          <IconComp size={14} weight="fill" color={variant.accent} style={{ flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            {title ? (
              <div style={{ fontSize: 13, fontWeight: 600, color: variant.accent }}>{title}</div>
            ) : null}
            <span style={{ fontSize: 13, color: variant.accent }}>
              {text}
            </span>
          </div>
        </div>
        {onClose ? (
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: "var(--sp-1)", flexShrink: 0 }}
          >
            <X size={14} color={variant.accent} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
