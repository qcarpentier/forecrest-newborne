/**
 * ProfileSetupPage — Collects user profile data (first name, last name, birth date)
 * Shown after email confirmation, before workspace onboarding.
 */
import { useState } from "react";
import { createPortal } from "react-dom";
import { User, ArrowRight } from "@phosphor-icons/react";
import Button from "./Button";
import { useAuth } from "../context/useAuth";

var MIN_AGE = 16;
var MAX_AGE = 100;

function isValidBirthDate(dateStr) {
  if (!dateStr) return false;
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  var now = new Date();
  var age = now.getFullYear() - d.getFullYear();
  var m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= MIN_AGE && age <= MAX_AGE;
}

function getMinDate() {
  var d = new Date();
  d.setFullYear(d.getFullYear() - MAX_AGE);
  return d.toISOString().slice(0, 10);
}

function getMaxDate() {
  var d = new Date();
  d.setFullYear(d.getFullYear() - MIN_AGE);
  return d.toISOString().slice(0, 10);
}

var INPUT_STYLE = {
  width: "100%", height: 44, padding: "0 14px", fontSize: 14,
  color: "var(--text-primary)", background: "var(--bg-page)",
  border: "1.5px solid var(--border)", borderRadius: "var(--r-md)",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

export default function ProfileSetupPage({ onComplete }) {
  var auth = useAuth();
  var lang = (localStorage.getItem("forecrest_lang") || "fr");

  var initialName = (auth.user && auth.user.displayName) || "";
  var parts = initialName.trim().split(" ");
  var [firstName, setFirstName] = useState(parts[0] || "");
  var [lastName, setLastName] = useState(parts.length > 1 ? parts.slice(1).join(" ") : "");
  var [birthDate, setBirthDate] = useState("");
  var [errors, setErrors] = useState({});
  var [saving, setSaving] = useState(false);

  function handleSubmit() {
    var errs = {};
    if (!firstName.trim()) errs.firstName = lang === "fr" ? "Prénom requis" : "First name required";
    if (!lastName.trim()) errs.lastName = lang === "fr" ? "Nom requis" : "Last name required";
    if (birthDate && !isValidBirthDate(birthDate)) errs.birthDate = lang === "fr" ? "Date invalide (16-100 ans)" : "Invalid date (16-100 years)";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    var displayName = firstName.trim() + " " + lastName.trim();
    auth.updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate: birthDate || null,
      displayName: displayName,
    }).then(function () {
      setSaving(false);
      if (onComplete) onComplete({ firstName: firstName.trim(), lastName: lastName.trim(), birthDate: birthDate });
    }).catch(function () {
      setSaving(false);
      /* If profile table doesn't have columns yet, skip gracefully */
      if (onComplete) onComplete({ firstName: firstName.trim(), lastName: lastName.trim(), birthDate: birthDate });
    });
  }

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
        padding: "var(--sp-8) var(--sp-6)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: "var(--sp-5)" }}>
          <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 18, fontWeight: 800, fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", lineHeight: 1 }}>F</span>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>Forecrest</span>
        </div>

        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: "var(--r-full)",
          background: "var(--brand-bg)", border: "1px solid var(--brand-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto var(--sp-4)",
        }}>
          <User size={24} weight="duotone" color="var(--brand)" />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 var(--sp-2)", textAlign: "center", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", color: "var(--text-primary)" }}>
          {lang === "fr" ? "Complétez votre profil" : "Complete your profile"}
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 var(--sp-5)", textAlign: "center", lineHeight: 1.5 }}>
          {lang === "fr" ? "Ces informations sont utilisées pour identifier votre compte et personnaliser votre expérience." : "This information is used to identify your account and personalize your experience."}
        </p>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: 4 }}>
                {lang === "fr" ? "Prénom" : "First name"} <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input
                type="text" value={firstName} maxLength={50} autoFocus
                onChange={function (e) { setFirstName(e.target.value); setErrors({}); }}
                placeholder={lang === "fr" ? "Jean" : "John"}
                style={Object.assign({}, INPUT_STYLE, errors.firstName ? { borderColor: "var(--color-error)" } : {})}
              />
              {errors.firstName ? <div style={{ fontSize: 11, color: "var(--color-error)", marginTop: 2 }}>{errors.firstName}</div> : null}
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: 4 }}>
                {lang === "fr" ? "Nom" : "Last name"} <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input
                type="text" value={lastName} maxLength={50}
                onChange={function (e) { setLastName(e.target.value); setErrors({}); }}
                placeholder={lang === "fr" ? "Dupont" : "Doe"}
                style={Object.assign({}, INPUT_STYLE, errors.lastName ? { borderColor: "var(--color-error)" } : {})}
              />
              {errors.lastName ? <div style={{ fontSize: 11, color: "var(--color-error)", marginTop: 2 }}>{errors.lastName}</div> : null}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: 4 }}>
              {lang === "fr" ? "Date de naissance" : "Date of birth"} <span style={{ fontSize: 11, color: "var(--text-faint)" }}>({lang === "fr" ? "optionnel" : "optional"})</span>
            </label>
            <input
              type="date" value={birthDate}
              min={getMinDate()} max={getMaxDate()}
              onChange={function (e) { setBirthDate(e.target.value); setErrors({}); }}
              style={Object.assign({}, INPUT_STYLE, errors.birthDate ? { borderColor: "var(--color-error)" } : {})}
            />
            {errors.birthDate ? <div style={{ fontSize: 11, color: "var(--color-error)", marginTop: 2 }}>{errors.birthDate}</div> : null}
            <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
              {lang === "fr" ? "Vous devez avoir entre 16 et 100 ans." : "You must be between 16 and 100 years old."}
            </div>
          </div>

          <Button
            color="primary" size="lg"
            onClick={handleSubmit}
            isLoading={saving}
            isDisabled={!firstName.trim() || !lastName.trim()}
            iconTrailing={<ArrowRight size={16} />}
            sx={{ width: "100%", marginTop: "var(--sp-2)" }}
          >
            {lang === "fr" ? "Continuer" : "Continue"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
