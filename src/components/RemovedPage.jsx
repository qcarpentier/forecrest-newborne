import { createPortal } from "react-dom";
import { ProhibitInset, SignOut, ArrowRight } from "@phosphor-icons/react";
import { Button, Card } from "../components";
import { useAuth } from "../context/useAuth";
import { useT, useLang } from "../context";

export default function RemovedPage() {
  var auth = useAuth();
  var t = useT();
  var ct = t.collab || {};
  var { lang } = useLang();
  var isFr = lang !== "en";

  function handleLogout() {
    if (auth.signOut) auth.signOut();
  }

  function handleSwitchToOwn() {
    /* Clear the shared workspace and reload to own workspace */
    if (auth.setWorkspaceId) auth.setWorkspaceId(null);
    if (auth.setWorkspaceRole) auth.setWorkspaceRole(null);
    window.location.href = "/";
  }

  return createPortal(
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-page)",
      fontFamily: "'DM Sans', Inter, system-ui, sans-serif",
      color: "var(--text-primary)",
      padding: "var(--sp-6)",
    }}>
      <Card sx={{ maxWidth: 460, width: "100%", padding: 0, overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          padding: "var(--sp-6) var(--sp-6) var(--sp-5)",
          background: "var(--bg-accordion)",
          borderBottom: "1px solid var(--border-light)",
          textAlign: "center",
        }}>
          {/* Logo */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            marginBottom: "var(--sp-4)", opacity: 0.5,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: "var(--brand)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800, color: "var(--text-on-brand, #fff)",
              fontFamily: "'Bricolage Grotesque', sans-serif",
            }}>F</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-muted)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>Forecrest</span>
          </div>

          {/* Icon */}
          <div style={{
            width: 52, height: 52, borderRadius: "var(--r-lg)",
            background: "var(--color-error-bg, rgba(220,38,38,0.08))",
            border: "1px solid var(--color-error-border, rgba(220,38,38,0.2))",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "var(--sp-3)",
          }}>
            <ProhibitInset size={24} weight="duotone" color="var(--color-error)" />
          </div>

          <div style={{
            fontSize: 20,
            fontWeight: 800,
            color: "var(--text-primary)",
            fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
            marginBottom: "var(--sp-2)",
          }}>
            {ct.removed_title || (isFr ? "Acc\u00e8s retir\u00e9" : "Access revoked")}
          </div>

          <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
            {ct.removed_desc || (isFr
              ? "Le propri\u00e9taire de cet espace de travail a retir\u00e9 votre acc\u00e8s. Vous ne pouvez plus consulter ni modifier les donn\u00e9es de ce plan financier."
              : "The workspace owner has revoked your access. You can no longer view or edit the data in this financial plan.")}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "var(--sp-5) var(--sp-6)" }}>
          <div style={{
            padding: "var(--sp-3)",
            borderRadius: "var(--r-md)",
            background: "var(--bg-accordion)",
            border: "1px solid var(--border-light)",
            fontSize: 13,
            color: "var(--text-muted)",
            lineHeight: 1.5,
          }}>
            {ct.removed_hint || (isFr
              ? "Si vous pensez qu'il s'agit d'une erreur, contactez le propri\u00e9taire de l'espace pour demander un nouvel acc\u00e8s."
              : "If you believe this is a mistake, contact the workspace owner to request access again.")}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "var(--sp-4) var(--sp-6)",
          borderTop: "1px solid var(--border-light)",
          background: "var(--bg-card)",
        }}>
          <Button color="tertiary" size="md" onClick={handleLogout} iconLeading={<SignOut size={14} />}>
            {ct.removed_logout || (isFr ? "Se d\u00e9connecter" : "Log out")}
          </Button>
          <Button color="primary" size="md" onClick={handleSwitchToOwn} iconTrailing={<ArrowRight size={14} />}>
            {ct.removed_own || (isFr ? "Mon espace" : "My workspace")}
          </Button>
        </div>
      </Card>
    </div>,
    document.body
  );
}
