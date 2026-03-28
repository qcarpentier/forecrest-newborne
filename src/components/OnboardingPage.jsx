import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight, ArrowLeft, Check, Sun, Moon,
  Cloud, ShoppingCart, Storefront, Briefcase, UserCircle, SquaresFour,
  Sparkle, CircleNotch, ChartBar, ShieldCheck, Wallet, Buildings, User,
} from "@phosphor-icons/react";
import Button from "./Button";
import { SelectDropdown, InfoTip, CurrencyInput } from "../components";
import { useAuth } from "../context/useAuth";
import { useT, useLang } from "../context/useLang";
import { useTheme } from "../context/useTheme";
import { ACCENT_PALETTE } from "../constants/colors";

var LEGAL_FORMS = [
  { value: "srl", label: "SRL" },
  { value: "sa", label: "SA" },
  { value: "sc", label: "SC" },
  { value: "snc", label: "SNC" },
  { value: "scomm", label: "SComm" },
  { value: "asbl", label: "ASBL" },
  { value: "ei", label: "Entreprise individuelle" },
  { value: "other", label: "Autre" },
];

var CURRENCIES = [
  { value: "EUR", label: "EUR (\u20ac)" },
  { value: "USD", label: "USD ($)" },
  { value: "CHF", label: "CHF" },
  { value: "GBP", label: "GBP (\u00a3)" },
];

var BIZ_TYPES_COMPANY = [
  { id: "saas", icon: Cloud, color: "#2563EB" },
  { id: "ecommerce", icon: ShoppingCart, color: "#0D9488" },
  { id: "retail", icon: Storefront, color: "#D97706" },
  { id: "services", icon: Briefcase, color: "#E8431A" },
  { id: "other", icon: SquaresFour, color: "#475569" },
];

var BIZ_TYPES_SOLO = [
  { id: "freelancer", icon: UserCircle, color: "#7C3AED" },
  { id: "services", icon: Briefcase, color: "#E8431A" },
  { id: "other", icon: SquaresFour, color: "#475569" },
];

var WELCOME_SLIDES = [
  { icon: ChartBar, color: "#E8431A", key: "revenue" },
  { icon: Wallet, color: "#2563EB", key: "treasury" },
  { icon: ShieldCheck, color: "#0D9488", key: "taxes" },
  { icon: Sparkle, color: "#7C3AED", key: "insights" },
];

var SLIDE_DEFAULTS = {
  revenue: { title: "Mod\u00e9lisez vos revenus", desc: "Sources de revenus, abonnements, projets, commissions \u2014 tout se calcule automatiquement." },
  treasury: { title: "Suivez votre tr\u00e9sorerie", desc: "Cash, burn rate, runway \u2014 visualisez votre sant\u00e9 financi\u00e8re en temps r\u00e9el." },
  taxes: { title: "Fiscalit\u00e9 belge int\u00e9gr\u00e9e", desc: "TVA, ISOC, ONSS, IPP \u2014 calcul\u00e9s selon les barèmes officiels. Codes PCMN inclus." },
  insights: { title: "D\u00e9cisions \u00e9clair\u00e9es", desc: "Ratios, sensibilit\u00e9, projections \u2014 comprenez l'impact de chaque d\u00e9cision sur votre rentabilit\u00e9." },
};

/* ── Sub-components ── */

function Field({ label, hint, error, required, children }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: "var(--sp-1)" }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
          {label}{required ? <span style={{ color: "var(--color-error)", marginLeft: 2 }}>*</span> : null}
        </label>
        {hint ? <InfoTip tip={hint} width={260} /> : null}
      </div>
      {children}
      {error ? <div style={{ fontSize: 12, color: "var(--color-error)", marginTop: 4 }}>{error}</div> : null}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, readOnly, error, type }) {
  return (
    <input type={type || "text"} value={value} onChange={readOnly ? undefined : onChange} placeholder={placeholder} readOnly={readOnly}
      style={{
        width: "100%", height: 44, padding: "0 14px", fontSize: 14,
        color: readOnly ? "var(--text-faint)" : "var(--text-primary)",
        background: readOnly ? "var(--bg-accordion)" : "var(--bg-page)",
        border: "1.5px solid " + (error ? "var(--color-error)" : "var(--border)"),
        borderRadius: "var(--r-md)", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
        cursor: readOnly ? "not-allowed" : undefined,
      }}
    />
  );
}

function BizCard({ type, selected, onClick, t }) {
  var Icon = type.icon;
  var active = selected;
  return (
    <button onClick={onClick} style={{
      flex: "1 1 calc(33.33% - 8px)", minWidth: 130, padding: "var(--sp-4) var(--sp-3)",
      borderRadius: "var(--r-lg)", border: active ? "2px solid " + type.color : "1.5px solid var(--border)",
      background: active ? type.color + "12" : "var(--bg-card)",
      cursor: "pointer", textAlign: "center", transition: "all 0.15s",
      display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-2)",
    }}>
      <div style={{ width: 40, height: 40, borderRadius: "var(--r-md)", background: active ? type.color : "var(--bg-accordion)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
        <Icon size={20} weight={active ? "fill" : "duotone"} color={active ? "#fff" : type.color} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: active ? "var(--text-primary)" : "var(--text-secondary)" }}>{t["ob_biz_" + type.id] || type.id}</div>
      <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.3 }}>{t["ob_biz_" + type.id + "_desc"] || ""}</div>
    </button>
  );
}

function ColorSwatch({ accent, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 36, height: 36, borderRadius: "50%", background: accent.hex,
      border: selected ? "2.5px solid var(--text-primary)" : "2.5px solid transparent",
      boxShadow: selected ? "0 0 0 2px var(--bg-card)" : "none",
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      transition: "border-color 0.15s, box-shadow 0.15s", flexShrink: 0,
    }}>
      {selected ? <Check size={16} weight="bold" color="#fff" /> : null}
    </button>
  );
}

function ProgressDots({ total, current }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: "var(--sp-5)" }}>
      {Array.from({ length: total }).map(function (_, i) {
        return <div key={i} style={{ width: i === current ? 24 : 8, height: 8, borderRadius: 4, background: i <= current ? "var(--brand)" : "var(--border-light)", opacity: i < current ? 0.4 : 1, transition: "all 0.3s ease" }} />;
      })}
    </div>
  );
}

function Skeleton({ w, h }) {
  return <div style={{ width: w || "100%", height: h || 14, borderRadius: "var(--r-sm)", background: "var(--bg-hover)", animation: "pulse 1.5s ease-in-out infinite" }} />;
}

/* ── Welcome carrousel (full-card slides) ── */
function WelcomeCarousel({ onFinish, onSkip, t }) {
  var [idx, setIdx] = useState(0);
  var timerRef = useRef(null);
  var slide = WELCOME_SLIDES[idx];
  var Icon = slide.icon;
  var info = SLIDE_DEFAULTS[slide.key] || {};

  function startTimer() {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(function () {
      setIdx(function (s) {
        if (s >= WELCOME_SLIDES.length - 1) { clearInterval(timerRef.current); return s; }
        return s + 1;
      });
    }, 4000);
  }

  useEffect(function () { startTimer(); return function () { clearInterval(timerRef.current); }; }, []);

  function goNext() {
    clearInterval(timerRef.current);
    if (idx >= WELCOME_SLIDES.length - 1) { onFinish(); }
    else { setIdx(function (s) { return s + 1; }); startTimer(); }
  }

  return (
    <div style={{ width: 480, maxWidth: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", boxShadow: "0 8px 32px rgba(0,0,0,0.06)", padding: "var(--sp-8) var(--sp-6)", textAlign: "center" }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: "var(--sp-6)" }}>
        <div style={{ width: 40, height: 40, borderRadius: "var(--r-lg)", background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontSize: 20, fontWeight: 800, fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", lineHeight: 1 }}>F</span>
        </div>
        <span style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", letterSpacing: "-0.5px" }}>Forecrest</span>
      </div>

      {/* Slide content */}
      <div style={{ minHeight: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--sp-4)" }}>
        <div style={{
          width: 64, height: 64, borderRadius: "var(--r-xl)",
          background: slide.color + "14", border: "1px solid " + slide.color + "30",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.4s ease",
        }}>
          <Icon size={30} weight="duotone" color={slide.color} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: 0, fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", letterSpacing: "-0.5px", transition: "all 0.3s" }}>
          {t["ob_slide_" + slide.key + "_title"] || info.title || ""}
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0, lineHeight: 1.6, maxWidth: 360 }}>
          {t["ob_slide_" + slide.key + "_desc"] || info.desc || ""}
        </p>
      </div>

      {/* Dots */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "var(--sp-5) 0" }}>
        {WELCOME_SLIDES.map(function (_, i) {
          return <div key={i} onClick={function () { setIdx(i); clearInterval(timerRef.current); }} style={{ width: i === idx ? 24 : 8, height: 8, borderRadius: 4, background: i === idx ? "var(--brand)" : i < idx ? "var(--brand)" : "var(--border-light)", opacity: i < idx ? 0.4 : 1, transition: "all 0.3s", cursor: "pointer" }} />;
        })}
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "var(--sp-3)", justifyContent: "center" }}>
        <Button color="tertiary" size="lg" onClick={onSkip}>
          {t.ob_skip || "Passer"}
        </Button>
        <Button color="primary" size="lg" onClick={goNext} iconTrailing={<ArrowRight size={16} />}>
          {idx >= WELCOME_SLIDES.length - 1 ? (t.ob_continue || "Continuer") : (t.ob_next_slide || "Suivant")}
        </Button>
      </div>
    </div>
  );
}

/* ── Entity choice screen ── */
function EntityChoice({ onChoose, t }) {
  return (
    <div style={{ width: 480, maxWidth: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", boxShadow: "0 8px 32px rgba(0,0,0,0.06)", padding: "var(--sp-8) var(--sp-6)", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: "var(--sp-5)" }}>
        <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontSize: 18, fontWeight: 800, fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", lineHeight: 1 }}>F</span>
        </div>
        <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", letterSpacing: "-0.5px" }}>Forecrest</span>
      </div>

      <h2 style={{ fontSize: 21, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 var(--sp-1)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
        {t.ob_choose_entity || "Quel est votre profil ?"}
      </h2>
      <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 var(--sp-6)" }}>
        {t.ob_choose_entity_sub || "Nous adapterons votre exp\u00e9rience."}
      </p>

      <div style={{ display: "flex", gap: "var(--sp-3)", justifyContent: "center" }}>
        {[
          { id: "solo", icon: User, color: "var(--brand)", bg: "var(--brand-bg)", label: t.ob_entity_solo || "Ind\u00e9pendant", desc: t.ob_entity_solo_desc || "Activit\u00e9 en nom propre" },
          { id: "company", icon: Buildings, color: "var(--color-info)", bg: "var(--color-info-bg)", label: t.ob_entity_company || "Entreprise", desc: t.ob_entity_company_desc || "SRL, SA, SC, ASBL..." },
        ].map(function (opt) {
          var Icon = opt.icon;
          return (
            <button key={opt.id} onClick={function () { onChoose(opt.id); }} style={{
              flex: 1, padding: "var(--sp-5) var(--sp-4)", borderRadius: "var(--r-lg)",
              border: "1.5px solid var(--border)", background: "var(--bg-card)", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-3)",
              transition: "all 0.15s",
            }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: opt.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={26} weight="duotone" color={opt.color} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>{opt.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Finish animation ── */
function FinishScreen({ companyName, accent, onDone }) {
  var [progress, setProgress] = useState(0);
  useEffect(function () {
    var steps = [20, 45, 70, 90, 100];
    var i = 0;
    function tick() {
      if (i < steps.length) { setProgress(steps[i]); i++; setTimeout(tick, 400 + Math.random() * 300); }
      else { setTimeout(onDone, 600); }
    }
    setTimeout(tick, 300);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-5)", padding: "var(--sp-8) 0", textAlign: "center" }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: progress >= 100 ? "var(--color-success-bg)" : (accent ? accent.hex + "14" : "var(--brand-bg)"),
        border: "1px solid " + (progress >= 100 ? "var(--color-success-border)" : (accent ? accent.hex + "30" : "var(--brand-border)")),
        display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.5s",
      }}>
        {progress >= 100 ? <Check size={28} weight="bold" color="var(--color-success)" /> : <CircleNotch size={28} weight="bold" color={accent ? accent.hex : "var(--brand)"} style={{ animation: "spin 0.8s linear infinite" }} />}
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", marginBottom: "var(--sp-1)" }}>
          {progress >= 100 ? "C'est parti !" : "Pr\u00e9paration de votre espace..."}
        </div>
        <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
          {progress >= 100 ? (companyName || "Votre tableau de bord") + " est pr\u00eat." : "Configuration en cours..."}
        </div>
      </div>
      <div style={{ width: 200, height: 6, borderRadius: 3, background: "var(--bg-hover)", overflow: "hidden" }}>
        <div style={{ width: progress + "%", height: "100%", background: progress >= 100 ? "var(--color-success)" : (accent ? accent.hex : "var(--brand)"), borderRadius: 3, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

/* ── Preview sidebar ── */
function OnboardingPreview({ companyName, legalForm, firstName, lastName, userRole, businessType, accentColor, entityType, t }) {
  var companyInitials = (companyName || "").split(" ").map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase() || "?";
  var accent = accentColor || ACCENT_PALETTE[0];
  var allBiz = BIZ_TYPES_COMPANY.concat(BIZ_TYPES_SOLO);
  var bizType = allBiz.find(function (b) { return b.id === businessType; });
  var legalLabel = entityType === "solo" ? { label: "Ind\u00e9pendant" } : LEGAL_FORMS.find(function (f) { return f.value === legalForm; });

  return (
    <div style={{ width: 300, flexShrink: 0, padding: "var(--sp-6)", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", background: "var(--bg-card)", borderRadius: "var(--r-xl)", border: "1px solid var(--border-light)", padding: "var(--sp-6)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-4)" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: accent.hex, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 800, fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", transition: "background 0.3s" }}>
          {companyInitials}
        </div>
        {companyName ? <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", textAlign: "center", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>{companyName}</div> : <Skeleton w={140} h={18} />}
        {legalLabel ? <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: "var(--r-full, 999px)", background: accent.hex + "14", color: accent.hex, border: "1px solid " + accent.hex + "30" }}>{legalLabel.label}</span> : <Skeleton w={60} h={22} />}
        <div style={{ textAlign: "center" }}>
          {firstName || lastName ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{[firstName, lastName].filter(Boolean).join(" ")}</div>
              {userRole ? <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{userRole}</div> : null}
            </>
          ) : <Skeleton w={100} h={14} />}
        </div>
        {bizType ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <bizType.icon size={16} weight="duotone" color={bizType.color} />
            <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{t["ob_biz_" + bizType.id] || bizType.id}</span>
          </div>
        ) : <Skeleton w={80} h={14} />}
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: accent.hex, transition: "background 0.3s" }} />
      </div>
      <div style={{ fontSize: 12, color: "var(--text-faint)", textAlign: "center", marginTop: "var(--sp-4)", lineHeight: 1.5 }}>
        {t.ob_preview_hint || "Votre profil se construit au fil des \u00e9tapes."}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════ */

export default function OnboardingPage({ onComplete }) {
  var t = useT().onboarding || {};
  var auth = useAuth();
  var { lang, toggleLang } = useLang();
  var { dark, toggle: toggleTheme } = useTheme();

  var [phase, setPhase] = useState("welcome"); /* welcome | entity | form | finish */
  var [entityType, setEntityType] = useState(""); /* solo | company */
  var [step, setStep] = useState(0);
  var [companyName, setCompanyName] = useState("");
  var [legalForm, setLegalForm] = useState("");
  var [tvaNumber, setTvaNumber] = useState("");
  var [address, setAddress] = useState("");
  var [capitalSocial, setCapitalSocial] = useState(0);
  var [currency, setCurrency] = useState("EUR");
  var [firstName, setFirstName] = useState("");
  var [lastName, setLastName] = useState("");
  var [userRole, setUserRole] = useState("");
  var [phone, setPhone] = useState("");
  var [businessType, setBusinessType] = useState("");
  var [accentIdx, setAccentIdx] = useState(0);
  var [fieldErrors, setFieldErrors] = useState({});

  var isSolo = entityType === "solo";
  var email = auth.user ? auth.user.email : "";
  var accent = ACCENT_PALETTE[accentIdx] || ACCENT_PALETTE[0];
  var bizTypes = isSolo ? BIZ_TYPES_SOLO : BIZ_TYPES_COMPANY;

  var STEPS = isSolo
    ? ["project", "person", "activity", "customize"]
    : ["company", "person", "activity", "customize"];

  function handleChooseEntity(type) {
    setEntityType(type);
    if (type === "solo") {
      setLegalForm("ei");
      setBusinessType("freelancer");
    }
    setPhase("form");
  }

  function validate() {
    var errs = {};
    if (step === 0) {
      if (!companyName.trim() || companyName.trim().length < 2) errs.companyName = t.ob_err_company || "Nom requis (min. 2 caract\u00e8res)";
      if (!isSolo && !legalForm) errs.legalForm = t.ob_err_legal || "Forme juridique requise";
    }
    if (step === 1) {
      if (!firstName.trim()) errs.firstName = t.ob_err_firstname || "Pr\u00e9nom requis";
      if (!lastName.trim()) errs.lastName = t.ob_err_lastname || "Nom requis";
    }
    if (step === 2) {
      if (!businessType) errs.businessType = t.ob_err_biztype || "S\u00e9lectionnez un type d'activit\u00e9";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (!validate()) return;
    if (step < STEPS.length - 1) { setStep(function (s) { return s + 1; }); }
    else { setPhase("finish"); }
  }

  function handleFinishDone() {
    onComplete({
      companyName: companyName.trim(),
      legalForm: isSolo ? "ei" : legalForm,
      tvaNumber: tvaNumber.trim(),
      address: address.trim(),
      capitalSocial: capitalSocial,
      currency: currency,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      userName: firstName.trim() + " " + lastName.trim(),
      userRole: userRole.trim(),
      email: email,
      phone: phone.trim(),
      businessType: businessType,
      accentColor: accent.id,
    });
  }

  function handleBack() {
    if (step === 0) { setPhase("entity"); setEntityType(""); }
    else { setStep(function (s) { return Math.max(0, s - 1); }); }
    setFieldErrors({});
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && phase === "form") handleNext();
  }

  var stepTitles = isSolo
    ? [
        { title: t.ob_solo_step1_title || "Votre activit\u00e9", sub: t.ob_solo_step1_sub || "Comment s'appelle votre projet ?" },
        { title: t.ob_step2_title || "Vos coordonn\u00e9es", sub: t.ob_step2_sub || "Qui \u00eates-vous ?" },
        { title: t.ob_step3_title || "Type d'activit\u00e9", sub: t.ob_step3_sub || "Que faites-vous ?" },
        { title: t.ob_step4_title || "Personnalisation", sub: t.ob_step4_sub || "Adaptez Forecrest \u00e0 votre image." },
      ]
    : [
        { title: t.ob_step1_title || "Votre entreprise", sub: t.ob_step1_sub || "Les informations de base de votre projet." },
        { title: t.ob_step2_title || "Responsable l\u00e9gal", sub: t.ob_step2_sub || "Qui g\u00e8re cette entreprise ?" },
        { title: t.ob_step3_title || "Type d'activit\u00e9", sub: t.ob_step3_sub || "Quel est votre mod\u00e8le \u00e9conomique ?" },
        { title: t.ob_step4_title || "Personnalisation", sub: t.ob_step4_sub || "Adaptez Forecrest \u00e0 votre image." },
      ];
  var pg = stepTitles[step] || stepTitles[0];

  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 900,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-page)", padding: "var(--sp-4)", overflowY: "auto",
    }} onKeyDown={handleKeyDown}>

      {/* ── Welcome carrousel ── */}
      {phase === "welcome" ? <WelcomeCarousel onFinish={function () { setPhase("entity"); }} onSkip={function () { setPhase("entity"); }} t={t} /> : null}

      {/* ── Entity choice ── */}
      {phase === "entity" ? <EntityChoice onChoose={handleChooseEntity} t={t} /> : null}

      {/* ── Finish animation ── */}
      {phase === "finish" ? (
        <div style={{ width: 480, maxWidth: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", boxShadow: "0 8px 32px rgba(0,0,0,0.06)", padding: "var(--sp-8) var(--sp-6)" }}>
          <FinishScreen companyName={companyName} accent={accent} onDone={handleFinishDone} />
        </div>
      ) : null}

      {/* ── Form ── */}
      {phase === "form" ? (
        <div style={{ display: "flex", gap: "var(--sp-4)", alignItems: "flex-start", maxWidth: 840, width: "100%" }}>
          <div style={{
            flex: 1, minWidth: 0, maxWidth: 480,
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "var(--r-xl)", boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
            padding: "var(--sp-8) var(--sp-6)",
          }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: "var(--sp-5)" }}>
              <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: accent.hex, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.3s" }}>
                <span style={{ color: "#fff", fontSize: 18, fontWeight: 800, fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", lineHeight: 1 }}>F</span>
              </div>
              <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", letterSpacing: "-0.5px" }}>Forecrest</span>
            </div>

            <div style={{ textAlign: "center", marginBottom: "var(--sp-5)" }}>
              <h1 style={{ fontSize: 21, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 var(--sp-1)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", letterSpacing: "-0.5px" }}>{pg.title}</h1>
              <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>{pg.sub}</p>
            </div>

            {/* ── Step 0: Company/Project ── */}
            {step === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
                <Field label={isSolo ? (t.ob_project_name || "Nom de votre activit\u00e9") : (t.ob_company_name || "Nom de l'entreprise")} required error={fieldErrors.companyName} hint={isSolo ? (t.ob_hint_project || "Le nom sous lequel vous travaillez.") : (t.ob_hint_company || "Le nom commercial de votre projet ou soci\u00e9t\u00e9.")}>
                  <TextInput value={companyName} onChange={function (e) { setCompanyName(e.target.value); setFieldErrors({}); }} placeholder={isSolo ? "Ex: John Doe Consulting" : "Ex: Mon Entreprise"} error={fieldErrors.companyName} />
                </Field>
                <Field label={t.ob_legal_form || "Forme juridique"} required={!isSolo} error={fieldErrors.legalForm} hint={!isSolo ? (t.ob_hint_legal || "La structure l\u00e9gale de votre entreprise. La SRL est la plus courante en Belgique.") : null}>
                  {isSolo ? (
                    <TextInput value="Entreprise individuelle" readOnly />
                  ) : (
                    <SelectDropdown value={legalForm} onChange={function (v) { setLegalForm(v); setFieldErrors({}); }} options={LEGAL_FORMS.filter(function (f) { return f.value !== "ei"; })} placeholder={t.ob_legal_placeholder || "Choisir..."} width="100%" />
                  )}
                </Field>
                <Field label={t.ob_tva || "N\u00b0 TVA / BCE"} hint={t.ob_hint_tva || "Votre num\u00e9ro d'entreprise belge. Vous le recevrez lors de l'inscription \u00e0 la BCE."}>
                  <TextInput value={tvaNumber} onChange={function (e) { setTvaNumber(e.target.value); }} placeholder="BE0123.456.789" />
                </Field>
                {!isSolo ? (
                  <>
                    <Field label={t.ob_address || "Adresse du si\u00e8ge social"} hint={t.ob_hint_address || "L'adresse officielle de votre entreprise."}>
                      <TextInput value={address} onChange={function (e) { setAddress(e.target.value); }} placeholder="Rue de l'Industrie 26, 6000 Charleroi" />
                    </Field>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
                      <Field label={t.ob_capital || "Capital social"} hint={t.ob_hint_capital || "Le montant inscrit aux statuts. Pas de minimum l\u00e9gal pour les SRL depuis 2019."}>
                        <CurrencyInput value={capitalSocial} onChange={setCapitalSocial} suffix={"€"} width="100%" />
                      </Field>
                      <Field label={t.ob_currency || "Devise"}>
                        <SelectDropdown value={currency} onChange={setCurrency} options={CURRENCIES} width="100%" />
                      </Field>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}

            {/* ── Step 1: Person ── */}
            {step === 1 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
                  <Field label={t.ob_firstname || "Pr\u00e9nom"} required error={fieldErrors.firstName}>
                    <TextInput value={firstName} onChange={function (e) { setFirstName(e.target.value); setFieldErrors({}); }} placeholder="John" error={fieldErrors.firstName} />
                  </Field>
                  <Field label={t.ob_lastname || "Nom"} required error={fieldErrors.lastName}>
                    <TextInput value={lastName} onChange={function (e) { setLastName(e.target.value); setFieldErrors({}); }} placeholder="Doe" error={fieldErrors.lastName} />
                  </Field>
                </div>
                <Field label={t.ob_role || "Fonction"} hint={t.ob_hint_role || "Votre r\u00f4le (ex: g\u00e9rant, CEO, fondateur)."}>
                  <TextInput value={userRole} onChange={function (e) { setUserRole(e.target.value); }} placeholder={isSolo ? "Ind\u00e9pendant" : "CEO / G\u00e9rant"} />
                </Field>
                <Field label="Email">
                  <TextInput value={email || "john.doe@mail.com"} readOnly />
                </Field>
                <Field label={t.ob_phone || "T\u00e9l\u00e9phone"}>
                  <TextInput value={phone} onChange={function (e) { setPhone(e.target.value); }} placeholder="+32 400 00 00 00" type="tel" />
                </Field>
              </div>
            ) : null}

            {/* ── Step 2: Activity ── */}
            {step === 2 ? (
              <div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-3)" }}>
                  {bizTypes.map(function (bt) {
                    return <BizCard key={bt.id} type={bt} selected={businessType === bt.id} onClick={function () { setBusinessType(bt.id); setFieldErrors({}); }} t={t} />;
                  })}
                </div>
                {fieldErrors.businessType ? <div style={{ fontSize: 12, color: "var(--color-error)", marginTop: "var(--sp-2)", textAlign: "center" }}>{fieldErrors.businessType}</div> : null}
              </div>
            ) : null}

            {/* ── Step 3: Customize ── */}
            {step === 3 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
                <Field label={t.ob_accent_color || "Couleur d'accent"}>
                  <div style={{ display: "flex", gap: "var(--sp-3)", flexWrap: "wrap", justifyContent: "center", padding: "var(--sp-2) 0" }}>
                    {ACCENT_PALETTE.map(function (a, i) {
                      return <ColorSwatch key={a.id} accent={a} selected={accentIdx === i} onClick={function () { setAccentIdx(i); }} />;
                    })}
                  </div>
                </Field>
                <Field label={t.ob_theme || "Apparence"}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[{ dark: false, icon: Sun, label: "Clair" }, { dark: true, icon: Moon, label: "Sombre" }].map(function (o) {
                      var active = dark === o.dark;
                      var Icon = o.icon;
                      return (
                        <button key={String(o.dark)} onClick={function () { if (dark !== o.dark) toggleTheme(window.innerWidth / 2, window.innerHeight / 2); }} style={{
                          display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: "var(--r-md)",
                          border: active ? "1px solid var(--brand)" : "1px solid var(--border)",
                          background: active ? "var(--brand-bg)" : "transparent",
                          color: active ? "var(--brand)" : "var(--text-secondary)",
                          fontSize: 12, fontWeight: active ? 600 : 400, cursor: "pointer", fontFamily: "inherit",
                        }}>
                          <Icon size={14} weight={active ? "fill" : "regular"} /> {o.label}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <Field label={t.ob_language || "Langue"}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[{ id: "fr", label: "Fran\u00e7ais" }, { id: "en", label: "English" }].map(function (o) {
                      var active = lang === o.id;
                      return (
                        <button key={o.id} onClick={function () { if (lang !== o.id) toggleLang(); }} style={{
                          display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: "var(--r-md)",
                          border: active ? "1px solid var(--brand)" : "1px solid var(--border)",
                          background: active ? "var(--brand-bg)" : "transparent",
                          color: active ? "var(--brand)" : "var(--text-secondary)",
                          fontSize: 12, fontWeight: active ? 600 : 400, cursor: "pointer", fontFamily: "inherit",
                        }}>{o.label}</button>
                      );
                    })}
                  </div>
                </Field>
              </div>
            ) : null}

            {/* Buttons */}
            <div style={{ display: "flex", gap: "var(--sp-3)", marginTop: "var(--sp-5)" }}>
              <Button color="tertiary" size="lg" onClick={handleBack} iconLeading={<ArrowLeft size={16} />} sx={{ flex: "0 0 auto" }}>
                {t.ob_back || "Retour"}
              </Button>
              <Button color="primary" size="lg" onClick={handleNext}
                iconTrailing={step < STEPS.length - 1 ? <ArrowRight size={16} /> : <Sparkle size={16} weight="fill" />}
                sx={{ flex: 1, justifyContent: "center" }}>
                {step < STEPS.length - 1 ? (t.ob_continue || "Continuer") : (t.ob_finish || "Lancer Forecrest")}
              </Button>
            </div>

            <ProgressDots total={STEPS.length} current={step} />
          </div>

          <div className="resp-hide-mobile">
            <OnboardingPreview companyName={companyName} legalForm={legalForm} firstName={firstName} lastName={lastName} userRole={userRole} businessType={businessType} accentColor={accent} entityType={entityType} t={t} />
          </div>
        </div>
      ) : null}
    </div>,
    document.body
  );
}
