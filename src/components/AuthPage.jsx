import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  EnvelopeSimple, Lock, Eye, EyeSlash, ArrowRight, ArrowLeft,
  Check, Circle, PaperPlaneTilt, ShieldCheck, ArrowCounterClockwise,
  UserPlus, SignIn, Buildings,
} from "@phosphor-icons/react";
import Button from "./Button";
import { useAuth } from "../context/useAuth";
import { useT } from "../context/useLang";

/* ── Password criteria (matches Supabase config: 14 chars, upper, lower, digit) ── */
var CRITERIA = [
  { id: "length", test: function (pw) { return pw.length >= 14; } },
  { id: "upper", test: function (pw) { return /[A-Z]/.test(pw); } },
  { id: "lower", test: function (pw) { return /[a-z]/.test(pw); } },
  { id: "digit", test: function (pw) { return /[0-9]/.test(pw); } },
];

function getStrength(pw) {
  var score = 0;
  CRITERIA.forEach(function (c) { if (c.test(pw)) score++; });
  if (score <= 1) return { level: "weak", pct: 25, color: "var(--color-error)" };
  if (score <= 2) return { level: "medium", pct: 50, color: "var(--color-warning)" };
  if (score <= 3) return { level: "medium", pct: 75, color: "var(--color-warning)" };
  return { level: "strong", pct: 100, color: "var(--color-success)" };
}

function allCriteriaMet(pw) {
  return CRITERIA.every(function (c) { return c.test(pw); });
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/* ── Sub-components ── */

function PasswordCriteria({ password, t }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: "var(--sp-3)" }}>
      {CRITERIA.map(function (c) {
        var met = c.test(password);
        return (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            {met ? <Check size={14} weight="bold" color="var(--color-success)" /> : <Circle size={14} color="var(--text-ghost)" />}
            <span style={{ color: met ? "var(--color-success)" : "var(--text-faint)", fontWeight: met ? 500 : 400 }}>
              {t["auth_criteria_" + c.id]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StrengthBar({ password, t }) {
  var s = getStrength(password);
  return (
    <div style={{ marginTop: "var(--sp-2)" }}>
      <div style={{ height: 4, borderRadius: 2, background: "var(--border-light)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: s.pct + "%", background: s.color, borderRadius: 2, transition: "width 0.3s, background 0.3s" }} />
      </div>
      <div style={{ fontSize: 11, color: s.color, marginTop: 4, fontWeight: 500 }}>{t["auth_strength_" + s.level]}</div>
    </div>
  );
}

function ProgressDots({ total, current }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: "var(--sp-6)" }}>
      {Array.from({ length: total }).map(function (_, i) {
        var active = i === current;
        var done = i < current;
        return (
          <div key={i} style={{
            width: active ? 24 : 8, height: 8, borderRadius: 4,
            background: (active || done) ? "var(--brand)" : "var(--border-light)",
            opacity: done ? 0.4 : 1, transition: "all 0.3s ease",
          }} />
        );
      })}
    </div>
  );
}

function InputField({ type, value, onChange, placeholder, icon, error, autoFocus, autoComplete, trailing }) {
  var Icon = icon;
  return (
    <div>
      <div style={{ position: "relative" }}>
        {Icon ? <Icon size={16} weight="duotone" color={error ? "var(--color-error)" : "var(--text-faint)"} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} /> : null}
        <input
          type={type || "text"} value={value} onChange={onChange} placeholder={placeholder}
          autoFocus={autoFocus} autoComplete={autoComplete}
          style={{
            width: "100%", height: 48, paddingLeft: Icon ? 42 : 14, paddingRight: trailing ? 48 : 14,
            fontSize: 14, color: "var(--text-primary)",
            background: "var(--bg-page)", border: "1.5px solid " + (error ? "var(--color-error)" : "var(--border)"),
            borderRadius: "var(--r-md)", outline: "none", boxSizing: "border-box",
            transition: "border-color 0.15s", fontFamily: "inherit",
          }}
        />
        {trailing}
      </div>
      {error ? <div style={{ fontSize: 12, color: "var(--color-error)", marginTop: 6, lineHeight: 1.3 }}>{error}</div> : null}
    </div>
  );
}

/* ══════════════════════════════════════════ */
/* ── Main component ── */
/* ══════════════════════════════════════════ */

export default function AuthPage() {
  var t = useT().auth;
  var auth = useAuth();
  var lang = (localStorage.getItem("forecrest_lang") || "fr");

  var [showLanding, setShowLanding] = useState(true);
  var [mode, setMode] = useState("signup");
  var [step, setStep] = useState(0);
  var [email, setEmail] = useState("");
  var [password, setPassword] = useState("");
  var [showPw, setShowPw] = useState(false);
  var [error, setError] = useState(null);
  var [infoMsg, setInfoMsg] = useState(null);
  var [fieldErrors, setFieldErrors] = useState({});
  var [loading, setLoading] = useState(false);
  var [resendCooldown, setResendCooldown] = useState(0);
  var cooldownRef = useRef(null);
  var [emailConfirmed, setEmailConfirmed] = useState(false);
  var [linkError, setLinkError] = useState(null);

  /* ── Detect email confirmation OR error from Supabase redirect ── */
  useEffect(function () {
    var hash = window.location.hash;
    var rawParams = hash ? hash.replace(/^#/, "") : "";

    /* Check for error in hash (invalid/expired link) */
    if (rawParams.indexOf("error=") >= 0 || rawParams.indexOf("error_description=") >= 0) {
      var hashParams = new URLSearchParams(rawParams);
      var errDesc = hashParams.get("error_description") || hashParams.get("error") || "";
      var decoded = decodeURIComponent(errDesc.replace(/\+/g, " "));
      setLinkError(decoded || (lang === "fr" ? "Le lien est invalide ou a expiré." : "The link is invalid or has expired."));
      window.history.replaceState(null, "", window.location.pathname);
      return;
    }

    /* Check for error in query params */
    var qParams = new URLSearchParams(window.location.search);
    if (qParams.get("error") || qParams.get("error_description")) {
      var qDesc = qParams.get("error_description") || qParams.get("error") || "";
      setLinkError(decodeURIComponent(qDesc) || (lang === "fr" ? "Le lien est invalide ou a expiré." : "The link is invalid or has expired."));
      window.history.replaceState(null, "", window.location.pathname);
      return;
    }

    /* Success: email confirmed */
    if (hash && (hash.indexOf("type=signup") >= 0 || hash.indexOf("type=email") >= 0)) {
      setEmailConfirmed(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
    if (qParams.get("type") === "signup" || qParams.get("type") === "email") {
      setEmailConfirmed(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  /* ── Clean workspace hash from URL to prevent workspace injection ── */
  useEffect(function () {
    var hash = window.location.hash;
    if (hash && hash.indexOf("#/") === 0 && hash.indexOf("type=") < 0 && hash.indexOf("error=") < 0) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  /* ── Resend cooldown timer ── */
  useEffect(function () {
    if (resendCooldown <= 0) return;
    cooldownRef.current = setTimeout(function () {
      setResendCooldown(function (v) { return v - 1; });
    }, 1000);
    return function () { clearTimeout(cooldownRef.current); };
  }, [resendCooldown]);

  /* ── Mode switch ── */
  function switchToLogin() { setMode("login"); setStep(0); setPassword(""); setError(null); setInfoMsg(null); setFieldErrors({}); }
  function switchToSignup() { setMode("signup"); setStep(0); setPassword(""); setError(null); setInfoMsg(null); setFieldErrors({}); }
  function switchToMagic() { setMode("magic"); setStep(0); setError(null); setInfoMsg(null); setFieldErrors({}); }

  function goBack() {
    if (step === 0) { setShowLanding(true); setError(null); setInfoMsg(null); return; }
    setStep(function (s) { return Math.max(0, s - 1); });
    setError(null);
    setFieldErrors({});
  }

  /* ── Steps per mode (signup: no role step) ── */
  var signupSteps = ["email", "password", "verify", "welcome"];
  var loginSteps = ["email", "password"];
  var magicSteps = ["email", "verify"];
  var steps = mode === "signup" ? signupSteps : mode === "login" ? loginSteps : magicSteps;
  var currentStepId = steps[step] || "email";

  /* ── Validate & advance ── */
  function handleNext() {
    setError(null);
    setInfoMsg(null);
    setFieldErrors({});

    if (currentStepId === "email") {
      if (!isValidEmail(email)) {
        setFieldErrors({ email: t.auth_error_email_format });
        return;
      }
      if (mode === "magic") {
        setLoading(true);
        auth.signInMagicLink(email)
          .then(function () { setLoading(false); setStep(1); setResendCooldown(30); })
          .catch(function (err) { setLoading(false); setError(err.message); });
        return;
      }
      /* signup + login: advance to password step */
      setStep(function (s) { return s + 1; });
      return;
    }

    if (currentStepId === "password") {
      if (mode === "signup") {
        if (!allCriteriaMet(password)) {
          setFieldErrors({ password: t.auth_error_password_criteria });
          return;
        }
        if (password.trim().toLowerCase() === email.trim().toLowerCase()) {
          setFieldErrors({ password: lang === "fr" ? "Le mot de passe ne peut pas être identique à l'adresse email." : "Password cannot be the same as your email address." });
          return;
        }
        setLoading(true);
        auth.signUp(email, password, { role: "founder" })
          .then(function (data) {
            setLoading(false);

            /* Supabase returns user with empty identities when email already exists
               (security: doesn't error, returns fake success) */
            var user = data && data.user;
            if (user && user.identities && user.identities.length === 0) {
              setMode("login");
              setStep(1);
              setPassword("");
              setInfoMsg(lang === "fr"
                ? "Un compte avec cette adresse existe déjà. Connectez-vous ou réinitialisez votre mot de passe."
                : "An account with this email already exists. Please sign in or reset your password.");
              return;
            }

            if (data && data.session) {
              setStep(function (s) { return s + 2; });
            } else {
              setStep(function (s) { return s + 1; });
              setResendCooldown(30);
            }
          })
          .catch(function (err) {
            setLoading(false);
            var msg = (err.message || "").toLowerCase();
            if (msg.indexOf("already") >= 0 || msg.indexOf("registered") >= 0 || msg.indexOf("exists") >= 0) {
              setMode("login");
              setStep(1);
              setPassword("");
              setInfoMsg(t.auth_error_email_exists);
            } else {
              setError(err.message);
            }
          });
        return;
      }
      if (mode === "login") {
        if (!password) {
          setFieldErrors({ password: t.auth_error_password_empty });
          return;
        }
        setLoading(true);
        auth.signIn(email, password)
          .then(function () { setLoading(false); })
          .catch(function (err) { setLoading(false); setError(err.message); });
        return;
      }
    }

    if (currentStepId === "verify") {
      if (mode === "signup") {
        setLoading(true);
        auth.signUp(email, password, { role: "founder" })
          .then(function () { setLoading(false); setResendCooldown(30); })
          .catch(function (err) { setLoading(false); setError(err.message); });
      } else {
        setLoading(true);
        auth.signInMagicLink(email)
          .then(function () { setLoading(false); setResendCooldown(30); })
          .catch(function (err) { setLoading(false); setError(err.message); });
      }
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !loading) handleNext();
  }

  /* ── Titles ── */
  function getTitle() {
    if (mode === "login") return step === 0 ? t.auth_page_login_title : t.auth_page_login_password;
    if (mode === "magic") return step === 0 ? t.auth_page_magic_title : t.auth_page_magic_sent;
    var titles = [t.auth_page_signup_title, t.auth_page_password_title, t.auth_page_verify_title, t.auth_page_welcome_title];
    return titles[step] || "";
  }

  function getSubtitle() {
    if (mode === "login") return step === 0 ? t.auth_page_login_subtitle : "";
    if (mode === "magic") return step === 0 ? t.auth_page_magic_subtitle : t.auth_page_magic_sent_body;
    var subs = [t.auth_page_signup_subtitle, t.auth_page_password_subtitle, t.auth_page_verify_subtitle, t.auth_page_welcome_subtitle];
    return subs[step] || "";
  }

  /* ── Password show/hide toggle ── */
  var pwToggle = (
    <button onClick={function () { setShowPw(!showPw); }} type="button" style={{
      position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
      background: "none", border: "none", cursor: "pointer", padding: 4,
      display: "flex", alignItems: "center",
    }}>
      {showPw ? <EyeSlash size={18} color="var(--text-faint)" /> : <Eye size={18} color="var(--text-faint)" />}
    </button>
  );

  /* ══════════════════════════════════════════ */

  /* ── Invalid/expired link screen ── */
  if (linkError) {
    return createPortal(
      <div style={{
        position: "fixed", inset: 0, zIndex: 900,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg-page)", padding: "var(--sp-4)",
      }}>
        <div style={{
          width: 440, maxWidth: "100%",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "var(--r-xl)", boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
          padding: "var(--sp-8) var(--sp-6)", textAlign: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: "var(--sp-5)" }}>
            <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 18, fontWeight: 800, fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", lineHeight: 1 }}>F</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>Forecrest</span>
          </div>
          <div style={{
            width: 56, height: 56, borderRadius: "var(--r-full)",
            background: "var(--color-error-bg)", border: "2px solid var(--color-error-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto var(--sp-4)",
          }}>
            <span style={{ fontSize: 24 }}>!</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-2)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {lang === "fr" ? "Lien invalide ou expiré" : "Invalid or expired link"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "var(--sp-5)" }}>
            {lang === "fr"
              ? "Ce lien de connexion n'est plus valide. Il a peut-être expiré ou a déjà été utilisé. Veuillez vous reconnecter."
              : "This login link is no longer valid. It may have expired or already been used. Please sign in again."}
          </div>
          <button
            type="button"
            onClick={function () { setLinkError(null); }}
            style={{
              width: "100%", height: 44, borderRadius: "var(--r-md)",
              background: "var(--brand)", color: "#fff", border: "none",
              fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
            }}
          >
            {lang === "fr" ? "Se connecter" : "Sign in"}
          </button>
        </div>
      </div>,
      document.body
    );
  }

  /* ── Email confirmed screen ── */
  if (emailConfirmed) {
    return createPortal(
      <div style={{
        position: "fixed", inset: 0, zIndex: 900,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg-page)", padding: "var(--sp-4)",
      }}>
        <div style={{
          width: 440, maxWidth: "100%",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "var(--r-xl)", boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
          padding: "var(--sp-8) var(--sp-6)", textAlign: "center",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: "var(--sp-5)" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "var(--r-md)",
              background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#fff", fontSize: 18, fontWeight: 800, fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", lineHeight: 1 }}>F</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>Forecrest</span>
          </div>

          {/* Success icon */}
          <div style={{
            width: 56, height: 56, borderRadius: "var(--r-full)",
            background: "var(--color-success-bg, rgba(22,163,74,0.08))",
            border: "1px solid var(--color-success-border, rgba(22,163,74,0.2))",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: "var(--sp-4)",
          }}>
            <ShieldCheck size={28} weight="duotone" color="var(--color-success)" />
          </div>

          <h1 style={{
            fontSize: 22, fontWeight: 800, margin: "0 0 var(--sp-2) 0",
            fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
            color: "var(--text-primary)",
          }}>
            {t.auth_confirmed_title || "Compte confirm\u00e9 !"}
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 var(--sp-5) 0", lineHeight: 1.5 }}>
            {t.auth_confirmed_desc || "Votre adresse email a \u00e9t\u00e9 v\u00e9rifi\u00e9e avec succ\u00e8s. Vous pouvez maintenant vous connecter."}
          </p>

          <Button
            color="primary"
            size="lg"
            onClick={function () { setEmailConfirmed(false); setMode("login"); setStep(0); }}
            iconTrailing={<ArrowRight size={16} />}
            sx={{ width: "100%" }}
          >
            {t.auth_confirmed_btn || "Se connecter"}
          </Button>
        </div>
      </div>,
      document.body
    );
  }

  /* ── Landing screen with 3 option cards ── */
  if (showLanding && !emailConfirmed && !linkError) {
    return createPortal(
      <div style={{
        position: "fixed", inset: 0, zIndex: 900,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg-page)", padding: "var(--sp-4)", overflowY: "auto",
      }}>
        <div style={{ width: 720, maxWidth: "100%", textAlign: "center" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: "var(--sp-4)" }}>
            <div style={{ width: 40, height: 40, borderRadius: "var(--r-md)", background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 20, fontWeight: 800, fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", lineHeight: 1 }}>F</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>Forecrest</span>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 var(--sp-2)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
            {lang === "fr" ? "Bienvenue sur Forecrest" : "Welcome to Forecrest"}
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-muted)", margin: "0 0 var(--sp-6)", lineHeight: 1.6 }}>
            {lang === "fr"
              ? "Construisez votre plan financier simplement.\nSuivez notre assistant pas à pas pour lancer votre projet en toute sérénité."
              : "Build your financial plan simply.\nFollow our step-by-step assistant to launch your project with confidence."}
          </p>

          {/* 3 option cards — left-aligned, bigger, real buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--sp-4)" }}>
            {[
              {
                id: "login", icon: SignIn, iconBg: "var(--bg-accordion)", iconBorder: "var(--border)", iconColor: "var(--text-muted)",
                title: lang === "fr" ? "J'ai déjà un compte" : "I have an account",
                desc: lang === "fr" ? "Connectez-vous pour continuer votre projet." : "Sign in to continue your project.",
                btn: lang === "fr" ? "Se connecter" : "Sign in", btnColor: "tertiary",
                border: "1px solid var(--border)", disabled: false,
                onClick: function () { setMode("login"); setStep(0); setShowLanding(false); },
              },
              {
                id: "signup", icon: UserPlus, iconBg: "var(--brand-bg)", iconBorder: "var(--brand-border)", iconColor: "var(--brand)",
                title: lang === "fr" ? "Créer un compte" : "Create an account",
                desc: lang === "fr" ? "Enregistrez votre progression et accédez à toutes les fonctionnalités." : "Save your progress and access all features.",
                btn: lang === "fr" ? "S'inscrire" : "Sign up", btnColor: "primary",
                border: "2px solid var(--brand)", disabled: false,
                onClick: function () { setMode("signup"); setStep(0); setShowLanding(false); },
              },
              {
                id: "accountant", icon: Buildings, iconBg: "var(--bg-card)", iconBorder: "var(--border)", iconColor: "var(--text-faint)",
                title: lang === "fr" ? "Cabinet comptable" : "Accounting firm",
                desc: lang === "fr" ? "Gérez les plans financiers de vos clients." : "Manage your clients' financial plans.",
                btn: "Coming soon", btnColor: "disabled",
                border: "1px solid var(--border)", disabled: true,
              },
            ].map(function (card) {
              var Icon = card.icon;
              return (
                <div key={card.id} style={{
                  padding: "var(--sp-6) var(--sp-5)", background: card.disabled ? "var(--bg-accordion)" : "var(--bg-card)",
                  border: card.border, borderRadius: "var(--r-xl)", opacity: card.disabled ? 0.55 : 1,
                  display: "flex", flexDirection: "column", gap: "var(--sp-3)",
                  textAlign: "left", cursor: card.disabled ? "not-allowed" : "default",
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: "var(--r-lg)", background: card.iconBg, border: "1px solid " + card.iconBorder, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={22} weight="duotone" color={card.iconColor} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, flex: 1 }}>
                    {card.desc}
                  </div>
                  {card.disabled ? (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-faint)", padding: "4px 12px", background: "var(--bg-card)", borderRadius: 99, border: "1px solid var(--border)", alignSelf: "flex-start" }}>
                      Coming soon
                    </span>
                  ) : (
                    <Button color={card.btnColor} size="lg" onClick={card.onClick} iconTrailing={<ArrowRight size={16} />} sx={{ alignSelf: "flex-start" }}>
                      {card.btn}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 900,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-page)", padding: "var(--sp-4)", overflowY: "auto",
    }} onKeyDown={handleKeyDown} tabIndex={-1}>

      {/* ── Card ── */}
      <div style={{
        width: 440, maxWidth: "100%",
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "var(--r-xl)", boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
        padding: "var(--sp-8) var(--sp-6)",
      }}>
        {/* Logo + title */}
        <div style={{ textAlign: "center", marginBottom: "var(--sp-6)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: "var(--sp-4)" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "var(--r-md)",
              background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#fff", fontSize: 18, fontWeight: 800, fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", lineHeight: 1 }}>F</span>
            </div>
            <span style={{
              fontSize: 20, fontWeight: 800, color: "var(--text-primary)",
              fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", letterSpacing: "-0.5px",
            }}>
              Forecrest
            </span>
          </div>
          <h1 style={{
            fontSize: 21, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 var(--sp-1)",
            fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", letterSpacing: "-0.5px",
          }}>
            {getTitle()}
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
            {getSubtitle()}
          </p>
        </div>

        {/* Info message (blue) */}
        {infoMsg ? (
          <div style={{
            padding: "var(--sp-3) var(--sp-4)", marginBottom: "var(--sp-4)",
            background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)",
            borderRadius: "var(--r-md)", fontSize: 13, color: "var(--color-info)", lineHeight: 1.4,
          }}>
            {infoMsg}
          </div>
        ) : null}

        {/* Global error (red) */}
        {error ? (
          <div style={{
            padding: "var(--sp-3) var(--sp-4)", marginBottom: "var(--sp-4)",
            background: "var(--color-error-bg)", border: "1px solid var(--color-error-border)",
            borderRadius: "var(--r-md)", fontSize: 13, color: "var(--color-error)", lineHeight: 1.4,
          }}>
            {error}
          </div>
        ) : null}

        {/* ── Step: Email ── */}
        {currentStepId === "email" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
            <InputField
              type="email" value={email}
              onChange={function (e) { setEmail(e.target.value); setFieldErrors({}); }}
              placeholder={t.auth_email_placeholder} icon={EnvelopeSimple}
              error={fieldErrors.email} autoFocus autoComplete="email"
            />
            <Button color="primary" size="xl" onClick={handleNext} isLoading={loading} iconTrailing={<ArrowRight size={18} />} sx={{ width: "100%", justifyContent: "center" }}>
              {t.auth_page_continue}
            </Button>
            <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
              {mode === "signup" ? (
                <span>{t.auth_page_has_account} <button onClick={switchToLogin} style={{ background: "none", border: "none", color: "var(--brand)", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>{t.auth_page_login_link}</button></span>
              ) : (
                <span>{t.auth_page_no_account} <button onClick={switchToSignup} style={{ background: "none", border: "none", color: "var(--brand)", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>{t.auth_page_signup_link}</button></span>
              )}
            </div>
            {mode === "login" ? (
              <div style={{ textAlign: "center" }}>
                <button onClick={switchToMagic} style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", textDecoration: "underline" }}>
                  {t.auth_page_magic_alt}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ── Step: Password ── */}
        {currentStepId === "password" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
            <InputField
              type={showPw ? "text" : "password"} value={password}
              onChange={function (e) { setPassword(e.target.value); setFieldErrors({}); }}
              placeholder="••••••••••••••" icon={Lock}
              error={fieldErrors.password} autoFocus
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              trailing={pwToggle}
            />
            {mode === "signup" ? (
              <>
                <StrengthBar password={password} t={t} />
                <PasswordCriteria password={password} t={t} />
              </>
            ) : null}
            <div style={{ display: "flex", gap: "var(--sp-3)" }}>
              <Button color="tertiary" size="lg" onClick={goBack} iconLeading={<ArrowLeft size={16} />} sx={{ flex: "0 0 auto" }}>
                {t.auth_page_back}
              </Button>
              <Button
                color="primary" size="lg" onClick={handleNext} isLoading={loading}
                isDisabled={mode === "signup" && !allCriteriaMet(password)}
                iconTrailing={mode === "login" ? <ArrowRight size={16} /> : <ShieldCheck size={16} />}
                sx={{ flex: 1, justifyContent: "center" }}
              >
                {mode === "login" ? t.auth_page_login_btn : t.auth_page_create_account}
              </Button>
            </div>
            {mode === "login" ? (
              <div style={{ textAlign: "center" }}>
                <button onClick={switchToMagic} style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", textDecoration: "underline" }}>
                  {t.auth_page_forgot_password}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ── Step: Verify ── */}
        {currentStepId === "verify" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-4)", textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "var(--brand-bg)", border: "1px solid var(--brand-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <PaperPlaneTilt size={24} weight="duotone" color="var(--brand)" />
            </div>
            <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
              {t.auth_page_verify_sent} <strong style={{ color: "var(--text-primary)" }}>{email}</strong>
            </div>
            <div style={{ display: "flex", gap: "var(--sp-3)" }}>
              <Button color="secondary" size="md" onClick={handleNext} isLoading={loading} isDisabled={resendCooldown > 0} iconLeading={<ArrowCounterClockwise size={14} />}>
                {resendCooldown > 0 ? t.auth_page_resend_in + " " + resendCooldown + "s" : t.auth_page_resend}
              </Button>
              <Button color="tertiary" size="md" onClick={function () { setStep(0); setError(null); setInfoMsg(null); }}>
                {t.auth_page_change_email}
              </Button>
            </div>
          </div>
        ) : null}

        {/* ── Step: Welcome ── */}
        {currentStepId === "welcome" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-4)", textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Check size={24} weight="bold" color="var(--color-success)" />
            </div>
            <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
              {t.auth_page_welcome_body}
            </div>
          </div>
        ) : null}

        {/* Progress dots */}
        {steps.length > 2 && currentStepId !== "welcome" ? (
          <ProgressDots total={steps.length - 1} current={step} />
        ) : null}

        {/* In-card footer */}
        <div style={{ textAlign: "center", marginTop: "var(--sp-5)", fontSize: 11, color: "var(--text-faint)", lineHeight: 1.4 }}>
          {t.auth_wall_footer}
        </div>
      </div>

      {/* Page footer — self-hosted hint (outside card) */}
      <div style={{
        position: "fixed", bottom: 24, left: 0, right: 0,
        textAlign: "center", fontSize: 11, color: "var(--text-faint)", lineHeight: 1.4,
      }}>
        {t.auth_page_selfhosted_hint}{" "}
        <a href="https://github.com/thomasvoituron/forecrest" target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 500 }}>
          GitHub
        </a>
      </div>
    </div>,
    document.body
  );
}
