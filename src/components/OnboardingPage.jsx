import { useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight, ArrowLeft, Check,
  Cloud, ShoppingCart, Storefront, Briefcase, UserCircle, SquaresFour,
} from "@phosphor-icons/react";
import Button from "./Button";
import { SelectDropdown, InfoTip } from "../components";
import { useAuth } from "../context/useAuth";
import { useT } from "../context/useLang";
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

var BIZ_TYPES = [
  { id: "saas", icon: Cloud, color: "#2563EB" },
  { id: "ecommerce", icon: ShoppingCart, color: "#0D9488" },
  { id: "retail", icon: Storefront, color: "#D97706" },
  { id: "services", icon: Briefcase, color: "#E8431A" },
  { id: "freelancer", icon: UserCircle, color: "#7C3AED" },
  { id: "other", icon: SquaresFour, color: "#475569" },
];

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
    <input
      type={type || "text"}
      value={value}
      onChange={readOnly ? undefined : onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      style={{
        width: "100%", height: 44, padding: "0 14px",
        fontSize: 14, color: readOnly ? "var(--text-faint)" : "var(--text-primary)",
        background: readOnly ? "var(--bg-accordion)" : "var(--bg-page)",
        border: "1.5px solid " + (error ? "var(--color-error)" : "var(--border)"),
        borderRadius: "var(--r-md)", outline: "none",
        boxSizing: "border-box", fontFamily: "inherit",
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
      borderRadius: "var(--r-lg)",
      border: active ? "2px solid " + type.color : "1.5px solid var(--border)",
      background: active ? type.color + "12" : "var(--bg-card)",
      cursor: "pointer", textAlign: "center", transition: "all 0.15s",
      display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-2)",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "var(--r-md)",
        background: active ? type.color : "var(--bg-accordion)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}>
        <Icon size={20} weight={active ? "fill" : "duotone"} color={active ? "#fff" : type.color} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: active ? "var(--text-primary)" : "var(--text-secondary)" }}>
        {t["ob_biz_" + type.id] || type.id}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.3 }}>
        {t["ob_biz_" + type.id + "_desc"] || ""}
      </div>
    </button>
  );
}

function ColorSwatch({ accent, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 36, height: 36, borderRadius: "50%",
      background: accent.hex,
      border: selected ? "2.5px solid var(--text-primary)" : "2.5px solid transparent",
      boxShadow: selected ? "0 0 0 2px var(--bg-card)" : "none",
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      transition: "border-color 0.15s, box-shadow 0.15s",
      flexShrink: 0,
    }}>
      {selected ? <Check size={16} weight="bold" color="#fff" /> : null}
    </button>
  );
}

function ProgressDots({ total, current }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: "var(--sp-5)" }}>
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

function Skeleton({ w, h }) {
  return (
    <div style={{
      width: w || "100%", height: h || 14, borderRadius: "var(--r-sm)",
      background: "var(--bg-hover)",
      animation: "pulse 1.5s ease-in-out infinite",
    }} />
  );
}

/* ── Live preview sidebar ── */
function OnboardingPreview({ companyName, legalForm, firstName, lastName, userRole, businessType, accentColor, t }) {
  var initials = ((firstName || "").charAt(0) + (lastName || "").charAt(0)).toUpperCase() || "?";
  var accent = accentColor || ACCENT_PALETTE[0];
  var bizType = BIZ_TYPES.find(function (b) { return b.id === businessType; });
  var legalLabel = LEGAL_FORMS.find(function (f) { return f.value === legalForm; });

  return (
    <div style={{
      width: 300, flexShrink: 0, padding: "var(--sp-6)",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <div style={{
        width: "100%", background: "var(--bg-card)", borderRadius: "var(--r-xl)",
        border: "1px solid var(--border-light)", padding: "var(--sp-6)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-4)",
      }}>
        {/* Avatar */}
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: accent.hex, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 20, fontWeight: 800,
          fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
          transition: "background 0.3s",
        }}>
          {initials}
        </div>

        {/* Company name */}
        {companyName ? (
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", textAlign: "center", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", transition: "all 0.3s" }}>
            {companyName}
          </div>
        ) : <Skeleton w={140} h={18} />}

        {/* Legal form badge */}
        {legalLabel ? (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "3px 10px",
            borderRadius: "var(--r-full, 999px)",
            background: accent.hex + "14", color: accent.hex,
            border: "1px solid " + accent.hex + "30",
            transition: "all 0.3s",
          }}>
            {legalLabel.label}
          </span>
        ) : <Skeleton w={60} h={22} />}

        {/* Person */}
        <div style={{ textAlign: "center" }}>
          {firstName || lastName ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                {[firstName, lastName].filter(Boolean).join(" ")}
              </div>
              {userRole ? <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{userRole}</div> : null}
            </>
          ) : <Skeleton w={100} h={14} />}
        </div>

        {/* Business type */}
        {bizType ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <bizType.icon size={16} weight="duotone" color={bizType.color} />
            <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>
              {t["ob_biz_" + bizType.id] || bizType.id}
            </span>
          </div>
        ) : <Skeleton w={80} h={14} />}

        {/* Color dot */}
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: accent.hex, transition: "background 0.3s" }} />
      </div>

      <div style={{ fontSize: 12, color: "var(--text-faint)", textAlign: "center", marginTop: "var(--sp-4)", lineHeight: 1.5 }}>
        {t.ob_preview_hint || "Votre profil se construit au fil des \u00e9tapes"}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════ */

export default function OnboardingPage({ onComplete }) {
  var t = useT().onboarding || {};
  var auth = useAuth();

  var [step, setStep] = useState(0);
  var [companyName, setCompanyName] = useState("");
  var [legalForm, setLegalForm] = useState("");
  var [tvaNumber, setTvaNumber] = useState("");
  var [firstName, setFirstName] = useState("");
  var [lastName, setLastName] = useState("");
  var [userRole, setUserRole] = useState("");
  var [phone, setPhone] = useState("");
  var [businessType, setBusinessType] = useState("");
  var [accentIdx, setAccentIdx] = useState(0);
  var [fieldErrors, setFieldErrors] = useState({});

  var email = auth.user ? auth.user.email : "";
  var accent = ACCENT_PALETTE[accentIdx] || ACCENT_PALETTE[0];

  function validate() {
    var errs = {};
    if (step === 0) {
      if (!companyName.trim() || companyName.trim().length < 2) errs.companyName = t.ob_err_company || "Nom requis (min. 2 caract\u00e8res)";
      if (!legalForm) errs.legalForm = t.ob_err_legal || "Forme juridique requise";
      if (tvaNumber.trim() && !/^BE\s?0?\d{3}\.?\d{3}\.?\d{3}$/.test(tvaNumber.trim())) errs.tvaNumber = t.ob_err_tva || "Format : BE0123.456.789";
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
    if (step < 3) {
      setStep(function (s) { return s + 1; });
    } else {
      onComplete({
        companyName: companyName.trim(),
        legalForm: legalForm,
        tvaNumber: tvaNumber.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        userRole: userRole.trim(),
        email: email,
        phone: phone.trim(),
        businessType: businessType,
        accentColor: accent.id,
      });
    }
  }

  function handleBack() {
    setStep(function (s) { return Math.max(0, s - 1); });
    setFieldErrors({});
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleNext();
  }

  var titles = [
    { title: t.ob_step1_title || "Votre entreprise", sub: t.ob_step1_sub || "Commen\u00e7ons par les informations de base." },
    { title: t.ob_step2_title || "Responsable l\u00e9gal", sub: t.ob_step2_sub || "Qui g\u00e8re cette entreprise ?" },
    { title: t.ob_step3_title || "Type d'activit\u00e9", sub: t.ob_step3_sub || "Quel est votre mod\u00e8le \u00e9conomique ?" },
    { title: t.ob_step4_title || "Personnalisation", sub: t.ob_step4_sub || "Choisissez la couleur de votre espace." },
  ];
  var pg = titles[step] || titles[0];

  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 900,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-page)", padding: "var(--sp-4)", overflowY: "auto",
    }} onKeyDown={handleKeyDown}>

      <div style={{ display: "flex", gap: "var(--sp-4)", alignItems: "flex-start", maxWidth: 840, width: "100%" }}>

        {/* ── Form panel ── */}
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
            <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", letterSpacing: "-0.5px" }}>
              Forecrest
            </span>
          </div>

          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: "var(--sp-5)" }}>
            <h1 style={{ fontSize: 21, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 var(--sp-1)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", letterSpacing: "-0.5px" }}>
              {pg.title}
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>{pg.sub}</p>
          </div>

          {/* ── Step 0: Entreprise ── */}
          {step === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
              <Field label={t.ob_company_name || "Nom de l'entreprise"} required error={fieldErrors.companyName} hint={t.ob_hint_company || "Le nom commercial de votre projet ou soci\u00e9t\u00e9."}>
                <TextInput value={companyName} onChange={function (e) { setCompanyName(e.target.value); setFieldErrors({}); }} placeholder="Ex: Mon Entreprise" error={fieldErrors.companyName} />
              </Field>
              <Field label={t.ob_legal_form || "Forme juridique"} required error={fieldErrors.legalForm} hint={t.ob_hint_legal || "La structure l\u00e9gale de votre entreprise. La SRL est la plus courante en Belgique."}>
                <SelectDropdown value={legalForm} onChange={function (v) { setLegalForm(v); setFieldErrors({}); }} options={LEGAL_FORMS} placeholder={t.ob_legal_placeholder || "Choisir..."} width="100%" />
              </Field>
              <Field label={t.ob_tva || "Num\u00e9ro TVA"} hint={t.ob_hint_tva || "Votre num\u00e9ro d'entreprise belge. Vous le recevrez lors de l'inscription \u00e0 la BCE."} error={fieldErrors.tvaNumber}>
                <TextInput value={tvaNumber} onChange={function (e) { setTvaNumber(e.target.value); setFieldErrors({}); }} placeholder="BE0123.456.789" error={fieldErrors.tvaNumber} />
              </Field>
            </div>
          ) : null}

          {/* ── Step 1: Responsable ── */}
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
              <Field label={t.ob_role || "Fonction"} hint={t.ob_hint_role || "Votre r\u00f4le dans l'entreprise (ex: g\u00e9rant, CEO)."}>
                <TextInput value={userRole} onChange={function (e) { setUserRole(e.target.value); }} placeholder="CEO / G\u00e9rant" />
              </Field>
              <Field label="Email">
                <TextInput value={email} readOnly />
              </Field>
              <Field label={t.ob_phone || "T\u00e9l\u00e9phone"}>
                <TextInput value={phone} onChange={function (e) { setPhone(e.target.value); }} placeholder="+32 400 00 00 00" type="tel" />
              </Field>
            </div>
          ) : null}

          {/* ── Step 2: Activité ── */}
          {step === 2 ? (
            <div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-3)" }}>
                {BIZ_TYPES.map(function (bt) {
                  return <BizCard key={bt.id} type={bt} selected={businessType === bt.id} onClick={function () { setBusinessType(bt.id); setFieldErrors({}); }} t={t} />;
                })}
              </div>
              {fieldErrors.businessType ? <div style={{ fontSize: 12, color: "var(--color-error)", marginTop: "var(--sp-2)", textAlign: "center" }}>{fieldErrors.businessType}</div> : null}
            </div>
          ) : null}

          {/* ── Step 3: Couleur ── */}
          {step === 3 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-5)" }}>
              <div style={{ display: "flex", gap: "var(--sp-3)", flexWrap: "wrap", justifyContent: "center" }}>
                {ACCENT_PALETTE.map(function (a, i) {
                  return <ColorSwatch key={a.id} accent={a} selected={accentIdx === i} onClick={function () { setAccentIdx(i); }} />;
                })}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {accent.label}
              </div>
            </div>
          ) : null}

          {/* Buttons */}
          <div style={{ display: "flex", gap: "var(--sp-3)", marginTop: "var(--sp-5)" }}>
            {step > 0 ? (
              <Button color="tertiary" size="lg" onClick={handleBack} iconLeading={<ArrowLeft size={16} />} sx={{ flex: "0 0 auto" }}>
                {t.ob_back || "Retour"}
              </Button>
            ) : null}
            <Button
              color="primary" size="lg" onClick={handleNext}
              iconTrailing={step < 3 ? <ArrowRight size={16} /> : <Check size={16} weight="bold" />}
              sx={{ flex: 1, justifyContent: "center" }}
            >
              {step < 3 ? (t.ob_continue || "Continuer") : (t.ob_finish || "Commencer")}
            </Button>
          </div>

          <ProgressDots total={4} current={step} />
        </div>

        {/* ── Preview sidebar (desktop only) ── */}
        <div className="resp-hide-mobile">
          <OnboardingPreview
            companyName={companyName}
            legalForm={legalForm}
            firstName={firstName}
            lastName={lastName}
            userRole={userRole}
            businessType={businessType}
            accentColor={accent}
            t={t}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
