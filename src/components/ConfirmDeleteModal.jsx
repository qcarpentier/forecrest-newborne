import { createPortal } from "react-dom";
import { Trash } from "@phosphor-icons/react";

export default function ConfirmDeleteModal({ onConfirm, onCancel, skipNext, setSkipNext, t }) {
  return createPortal(
    <div
      style={{ position: "fixed", inset: 0, background: "var(--overlay-bg)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onCancel}
    >
      <div
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: "var(--sp-6)", width: 360, boxShadow: "var(--shadow-modal)" }}
        onClick={function (e) { e.stopPropagation(); }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-4)" }}>
          <div style={{ width: 40, height: 40, borderRadius: "var(--r-lg)", background: "var(--color-error-bg)", border: "1px solid var(--color-error-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Trash size={18} color="var(--color-error)" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{t.confirm_title}</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.confirm_body}</div>
          </div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-5)", cursor: "pointer" }}>
          <input type="checkbox" checked={skipNext} onChange={function (e) { setSkipNext(e.target.checked); }} style={{ width: 15, height: 15, cursor: "pointer", accentColor: "var(--brand)" }} />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.confirm_skip}</span>
        </label>
        <div style={{ display: "flex", gap: "var(--sp-2)" }}>
          <button onClick={onCancel} style={{ flex: 1, justifyContent: "center", height: 36, padding: "0 var(--sp-4)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)", background: "var(--bg-card)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center" }}>{t.cancel}</button>
          <button onClick={onConfirm} style={{ flex: 1, justifyContent: "center", height: 36, padding: "0 var(--sp-4)", border: "none", borderRadius: "var(--r-md)", background: "var(--color-error)", color: "var(--color-on-brand)", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center" }}>{t.delete}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
