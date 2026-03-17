import { Info, X } from "@phosphor-icons/react";
import { useT } from "../context";

export default function Banner({ visible, onClose }) {
  var t = useT();
  if (!visible) return null;

  return (
    <div
      style={{
        background: "var(--color-info-bg)",
        borderBottom: "1px solid var(--color-info-border)",
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
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
          <Info size={14} weight="fill" color="var(--color-info)" />
          <span style={{ fontSize: 13, color: "var(--color-info)" }}>
            {t.banner.info}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: "var(--sp-1)" }}
        >
          <X size={14} color="var(--color-info)" />
        </button>
      </div>
    </div>
  );
}
