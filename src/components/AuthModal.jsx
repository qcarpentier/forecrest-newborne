import { useState } from "react";
import { Tree, EnvelopeSimple, Lock, Eye, EyeSlash } from "@phosphor-icons/react";
import Modal, { ModalBody, ModalFooter } from "./Modal";
import Button from "./Button";
import ExplainerBox from "./ExplainerBox";
import { useAuth } from "../context/useAuth";
import { useT } from "../context/useLang";

var TABS = ["login", "signup", "magic"];

export default function AuthModal({ open, onClose, initialTab }) {
  var t = useT().auth;
  var auth = useAuth();
  var [authTab, setAuthTab] = useState(initialTab || "login");
  var [email, setEmail] = useState("");
  var [password, setPassword] = useState("");
  var [confirmPw, setConfirmPw] = useState("");
  var [showPw, setShowPw] = useState(false);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState(null);
  var [magicSent, setMagicSent] = useState(false);

  function reset() {
    setEmail("");
    setPassword("");
    setConfirmPw("");
    setError(null);
    setMagicSent(false);
    setShowPw(false);
  }

  function switchTab(nextTab) {
    setAuthTab(nextTab);
    setError(null);
    setMagicSent(false);
  }

  function handleClose() {
    reset();
    setAuthTab("login");
    onClose();
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (authTab === "login") {
      auth.signIn(email, password)
        .then(function () { setLoading(false); handleClose(); })
        .catch(function (err) { setLoading(false); setError(err.message); });
    } else if (authTab === "signup") {
      if (password !== confirmPw) {
        setError(t.auth_error_mismatch);
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError(t.auth_error_weak_password);
        setLoading(false);
        return;
      }
      auth.signUp(email, password)
        .then(function () { setLoading(false); handleClose(); })
        .catch(function (err) { setLoading(false); setError(err.message); });
    } else if (authTab === "magic") {
      auth.signInMagicLink(email)
        .then(function () { setLoading(false); setMagicSent(true); })
        .catch(function (err) { setLoading(false); setError(err.message); });
    }
  }

  var tabLabels = {
    login: t.auth_login,
    signup: t.auth_signup,
    magic: t.auth_magic_link,
  };

  return (
    <Modal open={open} onClose={handleClose} size="md" title={tabLabels[authTab]}
      icon={<div style={{
        width: 36, height: 36, borderRadius: "var(--r-md)",
        background: "var(--brand-bg)", border: "1px solid var(--brand-border)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Tree size={18} weight="duotone" color="var(--brand)" />
      </div>}
    >
      <ModalBody>
        {/* Tab switcher */}
        <div style={{
          display: "flex", gap: "var(--sp-1)", marginBottom: "var(--sp-5)",
          background: "var(--bg-accordion)", borderRadius: "var(--r-md)",
          padding: 3, border: "1px solid var(--border-light)",
        }}>
          {TABS.map(function (t_key) {
            var active = authTab === t_key;
            return (
              <button
                key={t_key}
                type="button"
                onClick={function () { switchTab(t_key); }}
                style={{
                  flex: 1, padding: "var(--sp-2) var(--sp-3)",
                  fontSize: 12, fontWeight: active ? 600 : 500,
                  color: active ? "var(--text-primary)" : "var(--text-muted)",
                  background: active ? "var(--bg-card)" : "transparent",
                  border: active ? "1px solid var(--border-light)" : "1px solid transparent",
                  borderRadius: "var(--r-sm)",
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                {tabLabels[t_key]}
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error ? (
          <div style={{ marginBottom: "var(--sp-4)" }}>
            <ExplainerBox variant="error" title={t.auth_error_title}>
              {error}
            </ExplainerBox>
          </div>
        ) : null}

        {/* Magic link sent */}
        {magicSent ? (
          <div style={{ marginBottom: "var(--sp-4)" }}>
            <ExplainerBox variant="tip" title={t.auth_magic_link_sent}>
              {t.auth_magic_link_sent_body}
            </ExplainerBox>
          </div>
        ) : null}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: "var(--sp-4)" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
              {t.auth_email}
            </label>
            <div style={{ position: "relative" }}>
              <EnvelopeSimple size={16} weight="duotone" color="var(--text-faint)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="email"
                value={email}
                onChange={function (e) { setEmail(e.target.value); }}
                placeholder={t.auth_email_placeholder}
                required
                autoComplete="email"
                style={{
                  width: "100%", height: 40, paddingLeft: 36, paddingRight: 12,
                  fontSize: 13, color: "var(--text-primary)",
                  background: "var(--bg-page)", border: "1px solid var(--border)",
                  borderRadius: "var(--r-md)", outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Password (login + signup) */}
          {authTab !== "magic" ? (
            <div style={{ marginBottom: "var(--sp-4)" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                {t.auth_password}
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} weight="duotone" color="var(--text-faint)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={function (e) { setPassword(e.target.value); }}
                  placeholder="••••••••"
                  required
                  autoComplete={authTab === "login" ? "current-password" : "new-password"}
                  style={{
                    width: "100%", height: 40, paddingLeft: 36, paddingRight: 40,
                    fontSize: 13, color: "var(--text-primary)",
                    background: "var(--bg-page)", border: "1px solid var(--border)",
                    borderRadius: "var(--r-md)", outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={function () { setShowPw(!showPw); }}
                  style={{
                    position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", padding: 4,
                    display: "flex", alignItems: "center",
                  }}
                >
                  {showPw
                    ? <EyeSlash size={16} color="var(--text-faint)" />
                    : <Eye size={16} color="var(--text-faint)" />}
                </button>
              </div>
            </div>
          ) : null}

          {/* Confirm password (signup only) */}
          {authTab === "signup" ? (
            <div style={{ marginBottom: "var(--sp-4)" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
                {t.auth_confirm_password}
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} weight="duotone" color="var(--text-faint)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type={showPw ? "text" : "password"}
                  value={confirmPw}
                  onChange={function (e) { setConfirmPw(e.target.value); }}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  style={{
                    width: "100%", height: 40, paddingLeft: 36, paddingRight: 12,
                    fontSize: 13, color: "var(--text-primary)",
                    background: "var(--bg-page)", border: "1px solid var(--border)",
                    borderRadius: "var(--r-md)", outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          ) : null}

          <ModalFooter compact>
            <Button color="tertiary" size="md" onClick={handleClose}>
              {t.auth_cancel}
            </Button>
            <Button color="primary" size="md" type="submit" isLoading={loading}>
              {authTab === "login" ? t.auth_submit_login : null}
              {authTab === "signup" ? t.auth_submit_signup : null}
              {authTab === "magic" ? t.auth_send_link : null}
            </Button>
          </ModalFooter>
        </form>
      </ModalBody>
    </Modal>
  );
}
