import { useState } from "react";
import { createPortal } from "react-dom";
import {
  User, ArrowRight, ShieldCheck, Sparkle, Check,
  CalendarBlank, GenderIntersex,
} from "@phosphor-icons/react";
import { Button, Card, Badge, Select } from "../components";
import { Checkbox } from "../components/Modal";
import { useAuth } from "../context/useAuth";
import { useT, useLang } from "../context";
import useBreakpoint from "../hooks/useBreakpoint";

var PRO_FEATURES = [
  { fr: "Jusqu'\u00e0 10 membres par espace", en: "Up to 10 members per workspace" },
  { fr: "Jusqu'\u00e0 3 emplacements comptable", en: "Up to 3 accountant slots" },
  { fr: "Jusqu'\u00e0 5 emplacements accompagnateur", en: "Up to 5 advisor slots" },
  { fr: "Modules Marketing & Production", en: "Marketing & Production modules" },
  { fr: "Support prioritaire", en: "Priority support" },
];

export default function AccountSetupPage({ onComplete }) {
  var auth = useAuth();
  var t = useT();
  var { lang } = useLang();
  var isFr = lang !== "en";
  var bp = useBreakpoint();
  var isMobile = bp.isMobile;
  var isTabletDown = bp.isTabletDown;

  var [firstName, setFirstName] = useState("");
  var [lastName, setLastName] = useState("");
  var [birthDate, setBirthDate] = useState("");
  var [gender, setGender] = useState("");
  var [acceptedTerms, setAcceptedTerms] = useState(false);
  var [saving, setSaving] = useState(false);
  var [step, setStep] = useState(0); /* 0 = profile, 1 = pro promo */

  function handleSave() {
    if (!firstName.trim() || !acceptedTerms) return;
    setSaving(true);

    var displayName = firstName.trim() + (lastName.trim() ? " " + lastName.trim() : "");

    /* Save to Supabase profiles table (first_name, last_name, birth_date, display_name) */
    var profileData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      displayName: displayName,
      birthDate: birthDate || null,
    };
    var savePromise = auth.updateProfile ? auth.updateProfile(profileData) : auth.updateDisplayName(displayName);
    savePromise.then(function () {
      setSaving(false);
      setStep(1); /* Go to Pro promo */
    }).catch(function () {
      setSaving(false);
      setStep(1); /* Continue anyway */
    });
  }

  function handleFinish() {
    try {
      if (gender) localStorage.setItem("forecrest_gender", gender);
      localStorage.setItem("forecrest_account_setup_done", "true");
    } catch (e) {}
    if (onComplete) onComplete({ firstName: firstName.trim(), lastName: lastName.trim() });
  }

  /* ── Step 0: Profile info ── */
  if (step === 0) {
    return createPortal(
      <div style={{
        position: "fixed", inset: 0, zIndex: 900,
        display: "flex", alignItems: isTabletDown ? "flex-start" : "center", justifyContent: "center",
        background: "var(--bg-page)", padding: isMobile ? "var(--sp-3)" : "var(--sp-4)",
        fontFamily: "'DM Sans', Inter, system-ui, sans-serif",
        color: "var(--text-primary)",
        overflowY: "auto", WebkitOverflowScrolling: "touch",
      }}>
        <div style={{
          width: isTabletDown ? "100%" : 460, maxWidth: "100%",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "var(--r-xl)", boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
          overflow: "hidden",
          marginTop: isTabletDown ? "var(--sp-4)" : 0,
          marginBottom: isTabletDown ? "var(--sp-4)" : 0,
        }}>
          {/* Header */}
          <div style={{
            padding: isMobile ? "var(--sp-4)" : isTabletDown ? "var(--sp-5) var(--sp-5) var(--sp-4)" : "var(--sp-6) var(--sp-6) var(--sp-4)",
            textAlign: "center",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              marginBottom: "var(--sp-4)", opacity: 0.5,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: "var(--brand)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 800, color: "var(--text-on-brand, #fff)",
                fontFamily: "'Bricolage Grotesque', sans-serif",
              }}>F</div>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-muted)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>Forecrest</span>
            </div>

            <div style={{
              width: 48, height: 48, borderRadius: "var(--r-full)",
              background: "var(--brand-bg)", border: "1px solid var(--brand-border)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              marginBottom: "var(--sp-3)",
            }}>
              <User size={22} weight="duotone" color="var(--brand)" />
            </div>

            <h1 style={{
              fontSize: 22, fontWeight: 800, margin: "0 0 var(--sp-1) 0",
              fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
            }}>
              {isFr ? "Votre profil" : "Your profile"}
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              {isFr ? "Quelques informations pour personnaliser votre exp\u00e9rience." : "A few details to personalize your experience."}
            </p>
          </div>

          {/* Form */}
          <div style={{ padding: isMobile ? "0 var(--sp-4) var(--sp-4)" : isTabletDown ? "0 var(--sp-5) var(--sp-4)" : "0 var(--sp-6) var(--sp-4)" }}>
            {/* Name row */}
            <div style={{ display: "grid", gridTemplateColumns: isTabletDown ? "1fr" : "1fr 1fr", gap: "var(--sp-3)", marginBottom: "var(--sp-3)" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
                  {isFr ? "Pr\u00e9nom" : "First name"} <span style={{ color: "var(--color-error)" }}>*</span>
                </label>
                <input
                  type="text" value={firstName}
                  onChange={function (e) { setFirstName(e.target.value); }}
                  placeholder="John"
                  autoFocus
                  style={{
                    width: "100%", height: 38, padding: "0 var(--sp-3)",
                    border: "1px solid var(--border)", borderRadius: "var(--r-md)",
                    background: "var(--bg-card)", color: "var(--text-primary)",
                    fontSize: 13, fontFamily: "inherit", outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
                  {isFr ? "Nom" : "Last name"}
                </label>
                <input
                  type="text" value={lastName}
                  onChange={function (e) { setLastName(e.target.value); }}
                  placeholder="Doe"
                  style={{
                    width: "100%", height: 38, padding: "0 var(--sp-3)",
                    border: "1px solid var(--border)", borderRadius: "var(--r-md)",
                    background: "var(--bg-card)", color: "var(--text-primary)",
                    fontSize: 13, fontFamily: "inherit", outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Birth date + Gender */}
            <div style={{ display: "grid", gridTemplateColumns: isTabletDown ? "1fr" : "1fr 1fr", gap: "var(--sp-3)", marginBottom: "var(--sp-4)" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
                  {isFr ? "Date de naissance" : "Date of birth"}
                </label>
                <input
                  type="date" value={birthDate}
                  onChange={function (e) { setBirthDate(e.target.value); }}
                  style={{
                    width: "100%", height: 38, padding: "0 var(--sp-3)",
                    border: "1px solid var(--border)", borderRadius: "var(--r-md)",
                    background: "var(--bg-card)", color: "var(--text-primary)",
                    fontSize: 13, fontFamily: "inherit", outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
                  {isFr ? "Genre" : "Gender"}
                </label>
                <Select
                  value={gender}
                  onChange={function (v) { setGender(v); }}
                  placeholder={isFr ? "Optionnel" : "Optional"}
                  options={[
                    { value: "male", label: isFr ? "Homme" : "Male" },
                    { value: "female", label: isFr ? "Femme" : "Female" },
                    { value: "other", label: isFr ? "Autre" : "Other" },
                    { value: "undisclosed", label: isFr ? "Ne pas pr\u00e9ciser" : "Prefer not to say" },
                  ]}
                  width="100%"
                />
              </div>
            </div>

            {/* Terms */}
            <div style={{ marginBottom: "var(--sp-4)" }}>
              <Checkbox
                checked={acceptedTerms}
                onChange={function (v) { setAcceptedTerms(v); }}
                label={isFr
                  ? "J'accepte les conditions g\u00e9n\u00e9rales et la politique de confidentialit\u00e9"
                  : "I accept the terms of service and privacy policy"}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: isMobile ? "var(--sp-4)" : isTabletDown ? "var(--sp-4) var(--sp-5)" : "var(--sp-4) var(--sp-6)",
            borderTop: "1px solid var(--border-light)",
            display: "flex", justifyContent: "flex-end",
          }}>
            <Button
              color="primary" size={isMobile ? "lg" : "lg"}
              onClick={handleSave}
              sx={isMobile ? { width: "100%", justifyContent: "center" } : undefined}
              isLoading={saving}
              isDisabled={!firstName.trim() || !acceptedTerms}
              iconTrailing={<ArrowRight size={16} />}
            >
              {isFr ? "Continuer" : "Continue"}
            </Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  /* ── Step 1: Pro promo ── */
  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 900,
      display: "flex", alignItems: isTabletDown ? "flex-start" : "center", justifyContent: "center",
      background: "var(--bg-page)", padding: isMobile ? "var(--sp-3)" : "var(--sp-4)",
      fontFamily: "'DM Sans', Inter, system-ui, sans-serif",
      color: "var(--text-primary)",
      overflowY: "auto", WebkitOverflowScrolling: "touch",
    }}>
      <div style={{
        width: isTabletDown ? "100%" : 460, maxWidth: "100%",
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "var(--r-xl)", boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
        overflow: "hidden",
        marginTop: isTabletDown ? "var(--sp-4)" : 0,
        marginBottom: isTabletDown ? "var(--sp-4)" : 0,
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? "var(--sp-4)" : isTabletDown ? "var(--sp-5) var(--sp-5) var(--sp-4)" : "var(--sp-6) var(--sp-6) var(--sp-4)",
          textAlign: "center",
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "var(--r-full)",
            background: "linear-gradient(135deg, var(--brand), #D97706)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: "var(--sp-3)",
          }}>
            <Sparkle size={22} weight="fill" color="#fff" />
          </div>

          <h1 style={{
            fontSize: 22, fontWeight: 800, margin: "0 0 var(--sp-1) 0",
            fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
          }}>
            Forecrest Pro
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
            {isFr
              ? "D\u00e9bloquez tout le potentiel de votre plan financier."
              : "Unlock the full potential of your financial plan."}
          </p>
        </div>

        {/* Features */}
        <div style={{ padding: isMobile ? "0 var(--sp-4) var(--sp-4)" : isTabletDown ? "0 var(--sp-5) var(--sp-4)" : "0 var(--sp-6) var(--sp-4)" }}>
          <div style={{
            padding: "var(--sp-4)", borderRadius: "var(--r-lg)",
            background: "var(--bg-accordion)", border: "1px solid var(--border-light)",
          }}>
            {PRO_FEATURES.map(function (f, i) {
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "var(--sp-2)",
                  padding: "var(--sp-2) 0",
                  borderBottom: i < PRO_FEATURES.length - 1 ? "1px solid var(--border-light)" : "none",
                }}>
                  <Check size={14} weight="bold" color="var(--color-success)" />
                  <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
                    {isFr ? f.fr : f.en}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: isMobile ? "var(--sp-4)" : isTabletDown ? "var(--sp-4) var(--sp-5)" : "var(--sp-4) var(--sp-6)",
          borderTop: "1px solid var(--border-light)",
          display: "flex", flexDirection: isTabletDown ? "column" : "row",
          justifyContent: "space-between", alignItems: isTabletDown ? "stretch" : "center",
          gap: isTabletDown ? "var(--sp-3)" : 0,
        }}>
          <Button color="tertiary" size="md" onClick={handleFinish} sx={isTabletDown ? { width: "100%", justifyContent: "center" } : undefined}>
            {isFr ? "Plus tard" : "Maybe later"}
          </Button>
          <Button color="primary" size="lg" onClick={handleFinish} isDisabled iconTrailing={<ArrowRight size={16} />} sx={isTabletDown ? { width: "100%", justifyContent: "center" } : undefined}>
            {isFr ? "Bient\u00f4t disponible" : "Coming soon"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
