import { useState } from "react";
import { Buildings, User, MapPin, EnvelopeSimple, Phone, IdentificationCard, Briefcase, CurrencyEur, Palette, Check } from "@phosphor-icons/react";
import { Card, PageLayout } from "../components";
import { ACCENT_PALETTE } from "../constants";
import { useT } from "../context";

function SectionTitle({ icon, title, sub }) {
  var Icon = icon;
  return (
    <div style={{ marginBottom: "var(--sp-4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: sub ? "var(--sp-1)" : 0 }}>
        <Icon size={18} weight="duotone" color="var(--brand)" />
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>{title}</h3>
      </div>
      {sub ? <p style={{ fontSize: 12, color: "var(--text-faint)", margin: 0, paddingLeft: 26 }}>{sub}</p> : null}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type, width }) {
  return (
    <div style={{ marginBottom: "var(--sp-4)" }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>
        {label}
      </label>
      <input
        type={type || "text"}
        value={value || ""}
        onChange={function (e) { onChange(e.target.value); }}
        placeholder={placeholder || ""}
        style={{
          width: width || "100%", height: 38,
          padding: "0 var(--sp-3)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md)",
          background: "var(--input-bg)",
          color: "var(--text-primary)",
          fontSize: 13, fontFamily: "inherit",
          outline: "none",
          transition: "border-color 0.15s",
        }}
        onFocus={function (e) { e.target.style.borderColor = "var(--brand)"; }}
        onBlur={function (e) { e.target.style.borderColor = "var(--border)"; }}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: "var(--sp-4)" }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>
        {label}
      </label>
      <select
        value={value || ""}
        onChange={function (e) { onChange(e.target.value); }}
        style={{
          width: "100%", height: 38,
          padding: "0 var(--sp-3)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md)",
          background: "var(--input-bg)",
          color: "var(--text-primary)",
          fontSize: 13, fontFamily: "inherit",
          cursor: "pointer", outline: "none",
        }}
      >
        {options.map(function (o) {
          return <option key={o.value} value={o.value}>{o.label}</option>;
        })}
      </select>
    </div>
  );
}

export default function ProfilePage({ cfg, setCfg }) {
  var t = useT().profile || {};

  function set(key, val) {
    setCfg(function (prev) {
      var n = {};
      Object.keys(prev).forEach(function (k) { n[k] = prev[k]; });
      n[key] = val;
      return n;
    });
  }

  var initials = (cfg.companyName || "F").split(" ").map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase();

  return (
    <PageLayout
      title={t.title || "Profil entreprise"}
      subtitle={t.subtitle || "Informations de votre entreprise utilisées dans tout le dashboard."}
    >
      {/* Company identity header */}
      <Card sx={{ marginBottom: "var(--sp-6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-5)" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "var(--r-lg)",
            background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-gradient-end) 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 24, fontWeight: 800,
            fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
            letterSpacing: "-0.5px", flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
              {cfg.companyName || (t.unnamed || "Mon entreprise")}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
              {cfg.legalForm || ""}{cfg.legalForm && cfg.tvaNumber ? " \u00B7 " : ""}{cfg.tvaNumber || ""}
            </div>
          </div>
        </div>

        {/* Accent color picker */}
        <div style={{ marginTop: "var(--sp-4)", paddingTop: "var(--sp-4)", borderTop: "1px solid var(--border-light)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-3)" }}>
            <Palette size={16} weight="duotone" color="var(--text-muted)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
              {t.accent_label || "Couleur d'accent"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ACCENT_PALETTE.map(function (c) {
              var active = (cfg.accentColor || "coral") === c.id;
              return (
                <button
                  key={c.id}
                  title={c.label}
                  aria-label={c.label}
                  onClick={function () { set("accentColor", c.id); }}
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: c.hex, border: active ? "2px solid var(--text-primary)" : "2px solid transparent",
                    cursor: "pointer", position: "relative",
                    outline: "none", padding: 0,
                    boxShadow: active ? "0 0 0 2px var(--bg-card)" : "none",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {active ? <Check size={14} weight="bold" color="#fff" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-lg)" }}>
        {/* Company info */}
        <Card>
          <SectionTitle icon={Buildings} title={t.section_company || "Entreprise"} sub={t.section_company_sub || "Identit\u00e9 l\u00e9gale de votre soci\u00e9t\u00e9."} />

          <Field
            label={t.field_company_name || "Nom de l'entreprise"}
            value={cfg.companyName}
            onChange={function (v) { set("companyName", v); }}
            placeholder="Forecrest SRL"
          />

          <SelectField
            label={t.field_legal_form || "Forme juridique"}
            value={cfg.legalForm || ""}
            onChange={function (v) { set("legalForm", v); }}
            options={[
              { value: "", label: t.select_placeholder || "— S\u00e9lectionner —" },
              { value: "SRL", label: "SRL (Soci\u00e9t\u00e9 \u00e0 responsabilit\u00e9 limit\u00e9e)" },
              { value: "SA", label: "SA (Soci\u00e9t\u00e9 anonyme)" },
              { value: "SC", label: "SC (Soci\u00e9t\u00e9 coop\u00e9rative)" },
              { value: "SNC", label: "SNC (Soci\u00e9t\u00e9 en nom collectif)" },
              { value: "SComm", label: "SComm (Soci\u00e9t\u00e9 en commandite)" },
              { value: "ASBL", label: "ASBL" },
              { value: "EI", label: "Entreprise individuelle" },
              { value: "other", label: t.other || "Autre" },
            ]}
          />

          <SelectField
            label={t.field_business_type || "Type d'activit\u00e9"}
            value={cfg.businessType || "saas"}
            onChange={function (v) { set("businessType", v); }}
            options={[
              { value: "saas", label: "SaaS / Logiciel" },
              { value: "ecommerce", label: "E-commerce" },
              { value: "services", label: "Services / Consulting" },
              { value: "retail", label: "Commerce / Retail" },
              { value: "marketplace", label: "Marketplace" },
              { value: "agency", label: "Agence" },
              { value: "other", label: t.other || "Autre" },
            ]}
          />

          <Field
            label={t.field_tva || "Num\u00e9ro de TVA"}
            value={cfg.tvaNumber}
            onChange={function (v) { set("tvaNumber", v); }}
            placeholder="BE0123.456.789"
          />

          <Field
            label={t.field_capital || "Capital social"}
            value={cfg.capitalSocial}
            onChange={function (v) { set("capitalSocial", parseFloat(v) || 0); }}
            type="number"
          />
        </Card>

        {/* Contact info */}
        <Card>
          <SectionTitle icon={User} title={t.section_contact || "Contact"} sub={t.section_contact_sub || "Repr\u00e9sentant l\u00e9gal et coordonn\u00e9es."} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 var(--sp-3)" }}>
            <Field
              label={t.field_first_name || "Pr\u00e9nom"}
              value={cfg.firstName}
              onChange={function (v) { set("firstName", v); }}
              placeholder="John"
            />
            <Field
              label={t.field_last_name || "Nom"}
              value={cfg.lastName}
              onChange={function (v) { set("lastName", v); }}
              placeholder="Doe"
            />
          </div>

          <Field
            label={t.field_role || "Fonction"}
            value={cfg.userRole}
            onChange={function (v) { set("userRole", v); }}
            placeholder={t.field_role_placeholder || "CEO / Fondateur"}
          />

          <Field
            label={t.field_email || "Email"}
            value={cfg.email}
            onChange={function (v) { set("email", v); }}
            placeholder="contact@forecrest.com"
            type="email"
          />

          <Field
            label={t.field_phone || "T\u00e9l\u00e9phone"}
            value={cfg.phone}
            onChange={function (v) { set("phone", v); }}
            placeholder="+32 400 00 00 00"
            type="tel"
          />

          <Field
            label={t.field_address || "Adresse"}
            value={cfg.address}
            onChange={function (v) { set("address", v); }}
            placeholder={t.field_address_placeholder || "Rue de l'Industrie 26, 6000 Charleroi"}
          />
        </Card>
      </div>

      {/* Note */}
      <div style={{
        marginTop: "var(--sp-4)",
        padding: "var(--sp-3) var(--sp-4)",
        background: "var(--bg-accordion)",
        borderRadius: "var(--r-md)",
        border: "1px solid var(--border-light)",
        fontSize: 12, color: "var(--text-faint)", lineHeight: 1.5,
      }}>
        {t.note || "Ces informations sont sauvegard\u00e9es localement et utilis\u00e9es pour personnaliser le dashboard, les rapports et les exports."}
      </div>
    </PageLayout>
  );
}
