import { useState } from "react";
import { createPortal } from "react-dom";
import { Tree, ArrowRight } from "@phosphor-icons/react";
import Button from "./Button";
import AuthModal from "./AuthModal";
import { useT } from "../context/useLang";

export default function AuthWall() {
  var t = useT().auth;
  var [showAuth, setShowAuth] = useState(false);
  var [defaultTab, setDefaultTab] = useState("login");

  function openLogin() {
    setDefaultTab("login");
    setShowAuth(true);
  }

  function openSignup() {
    setDefaultTab("signup");
    setShowAuth(true);
  }

  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 900,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-page)",
    }}>
      {/* Fake dashboard skeleton behind */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.4,
        filter: "blur(6px)", pointerEvents: "none",
        overflow: "hidden",
      }}>
        {/* Sidebar skeleton */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 240,
          background: "var(--bg-card)", borderRight: "1px solid var(--border-light)",
        }}>
          <div style={{ padding: 20 }}>
            <div style={{ width: 120, height: 24, borderRadius: "var(--r-sm)", background: "var(--border-light)", marginBottom: 32 }} />
            {[1, 2, 3, 4, 5, 6, 7].map(function (i) {
              return <div key={i} style={{ width: 140 + (i % 3) * 20, height: 14, borderRadius: "var(--r-sm)", background: "var(--bg-accordion)", marginBottom: 12 }} />;
            })}
          </div>
        </div>
        {/* Content skeleton */}
        <div style={{ marginLeft: 240, padding: 32 }}>
          <div style={{ width: 200, height: 28, borderRadius: "var(--r-sm)", background: "var(--border-light)", marginBottom: 8 }} />
          <div style={{ width: 320, height: 14, borderRadius: "var(--r-sm)", background: "var(--bg-accordion)", marginBottom: 32 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
            {[1, 2, 3].map(function (i) {
              return <div key={i} style={{ height: 90, borderRadius: "var(--r-lg)", background: "var(--bg-card)", border: "1px solid var(--border-light)" }} />;
            })}
          </div>
          <div style={{ height: 300, borderRadius: "var(--r-lg)", background: "var(--bg-card)", border: "1px solid var(--border-light)" }} />
        </div>
      </div>

      {/* Auth card */}
      <div style={{
        position: "relative", zIndex: 1,
        width: 420, maxWidth: "90vw",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-xl)",
        boxShadow: "var(--shadow-modal)",
        padding: "var(--sp-8)",
        textAlign: "center",
      }}>
        {/* Logo */}
        <div style={{
          width: 56, height: 56, borderRadius: "var(--r-lg)", margin: "0 auto var(--sp-5)",
          background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Tree size={28} weight="bold" color="var(--color-on-brand)" />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 var(--sp-2)",
          fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", letterSpacing: "-0.5px",
        }}>
          {t.auth_wall_title}
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 var(--sp-6)", lineHeight: 1.5 }}>
          {t.auth_wall_subtitle}
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
          <Button color="primary" size="xl" onClick={openSignup} iconTrailing={<ArrowRight size={18} />} sx={{ width: "100%", justifyContent: "center" }}>
            {t.auth_wall_signup}
          </Button>
          <Button color="tertiary" size="lg" onClick={openLogin} sx={{ width: "100%", justifyContent: "center" }}>
            {t.auth_wall_login}
          </Button>
        </div>

        {/* Footer */}
        <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: "var(--sp-5)", lineHeight: 1.4 }}>
          {t.auth_wall_footer}
        </p>
      </div>

      {/* Auth modal */}
      <AuthModal open={showAuth} onClose={function () { setShowAuth(false); }} initialTab={defaultTab} />
    </div>,
    document.body
  );
}
