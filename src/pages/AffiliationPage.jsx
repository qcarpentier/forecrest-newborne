import { useState, useMemo } from "react";
import {
  Plus, Trash, PencilSimple, Copy,
  Handshake, ShoppingCart, Cloud, Code, CreditCard, Storefront,
  Lightning, Link as LinkIcon, ToggleRight,
} from "@phosphor-icons/react";
import { PageLayout, Badge, KpiCard, Button, DataTable, ConfirmDeleteModal, ActionBtn, SearchInput, FilterDropdown, Wizard, ExportButtons, DevOptionsButton, Modal, ModalFooter, CurrencyInput, NumberField, ChartLegend, DonutChart, ModalSideNav, PaletteToggle } from "../components";
import { eur, eurShort, pct, makeId } from "../utils";
import { useT, useLang, useDevMode } from "../context";

/* ── Shared styles ── */
var labelStyle = { display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" };
var inputStyle = { width: "100%", height: 40, padding: "0 var(--sp-3)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none" };

/* ── Affiliation program types ── */
var PROGRAM_META = {
  saas: {
    icon: Cloud,
    badge: "brand",
    label: { fr: "SaaS & Logiciels", en: "SaaS & Software" },
    desc: { fr: "Recommandez des outils et recevez une commission récurrente.", en: "Recommend tools and earn recurring commissions." },
    placeholder: { fr: "ex. Notion, Figma, Slack", en: "e.g. Notion, Figma, Slack" },
    commissionType: "recurring",
    defaultRate: 0.20,
    suggestions: [
      { name: "Notion", commission: 0.50, avgSale: 10, signupBonus: 0, note: { fr: "50% sur chaque abonnement la 1ère année", en: "50% on each subscription for the 1st year" } },
      { name: "HubSpot", commission: 0.30, avgSale: 45, signupBonus: 0, cap: 0, note: { fr: "30% récurrent pendant 1 an (programme Solutions Partner)", en: "30% recurring for 1 year (Solutions Partner program)" } },
      { name: "Salesforce", commission: 0.15, avgSale: 3000, signupBonus: 0, cap: 0, note: { fr: "10-25% du revenu net 1ère année (ACV). Lead Registration — réservé aux partenaires certifiés. Paiement Net 60, seuil min. 500$.", en: "10-25% of net first-year revenue (ACV). Lead Registration — certified partners only. Net 60 payment, $500 min threshold." } },
      { name: "Semrush", commission: 0.40, avgSale: 130, signupBonus: 10, note: { fr: "40% récurrent + 10$ par essai gratuit activé", en: "40% recurring + $10 per activated free trial" } },
      { name: "Monday.com", commission: 0.20, avgSale: 36, signupBonus: 0, note: { fr: "Gagnez 20% sur chaque abonnement mensuel", en: "Earn 20% on each monthly subscription" } },
      { name: "Canva", commission: 0.20, avgSale: 13, signupBonus: 0, note: { fr: "Jusqu'à 20% sur les abonnements Pro/Teams", en: "Up to 20% on Pro/Teams subscriptions" } },
      { name: "Freshworks", commission: 0.15, avgSale: 29, signupBonus: 0, note: { fr: "15% récurrent la 1ère année", en: "15% recurring for the 1st year" } },
    ],
  },
  ecommerce: {
    icon: ShoppingCart,
    badge: "success",
    label: { fr: "E-commerce & Marketplace", en: "E-commerce & Marketplace" },
    desc: { fr: "Touchez une commission sur chaque vente générée.", en: "Earn a commission on each sale generated." },
    placeholder: { fr: "ex. Amazon Associates, Shopify", en: "e.g. Amazon Associates, Shopify" },
    commissionType: "per_sale",
    defaultRate: 0.05,
    suggestions: [
      { name: "Amazon Associates", commission: 0.03, avgSale: 30, note: { fr: "1-10% selon la catégorie (moyenne ~3%)", en: "1-10% by category (average ~3%)" } },
      { name: "Shopify", commission: 0, avgSale: 0, signupBonus: 150, note: { fr: "150$ par marchand qui souscrit un abonnement payant", en: "$150 per merchant who subscribes to a paid plan" } },
      { name: "Etsy", commission: 0.04, avgSale: 25, note: { fr: "Environ 4% par vente via votre lien", en: "About 4% per sale through your link" } },
      { name: "eBay Partner Network", commission: 0.03, avgSale: 35, note: { fr: "1-4% selon la catégorie de produit", en: "1-4% depending on product category" } },
      { name: "WooCommerce", commission: 0, avgSale: 0, signupBonus: 20, note: { fr: "20$ par extension ou thème vendu", en: "$20 per extension or theme sold" } },
    ],
  },
  hosting: {
    icon: Code,
    badge: "info",
    label: { fr: "Hébergement & Cloud", en: "Hosting & Cloud" },
    desc: { fr: "Parrainage de services d'hébergement web ou cloud.", en: "Referral for web hosting or cloud services." },
    placeholder: { fr: "ex. Vercel, OVH, Cloudflare", en: "e.g. Vercel, OVH, Cloudflare" },
    commissionType: "one_time",
    defaultRate: 50,
    suggestions: [
      { name: "Cloudflare", commission: 50, note: { fr: "Programme partenaire, montant variable selon le contrat", en: "Partner program, amount varies per contract" } },
      { name: "Vercel", commission: 50, note: { fr: "50$ par compte Pro ou Enterprise référé", en: "$50 per referred Pro or Enterprise account" } },
      { name: "OVH", commission: 50, note: { fr: "50-100€ par hébergement vendu selon le plan", en: "€50-100 per hosting sold depending on plan" } },
      { name: "DigitalOcean", commission: 200, note: { fr: "200$ par client qui dépense 25$ dans les 90 jours", en: "$200 per customer who spends $25 within 90 days" } },
      { name: "Kinsta", commission: 75, note: { fr: "50-500$ selon le plan + 10% récurrent à vie", en: "$50-500 per plan + 10% recurring for life" } },
      { name: "SiteGround", commission: 50, note: { fr: "50$ par vente (jusqu'à 100$/vente pour gros volumes)", en: "$50 per sale (up to $100/sale for high volume)" } },
    ],
  },
  payment: {
    icon: CreditCard,
    badge: "warning",
    label: { fr: "Paiement & Fintech", en: "Payment & Fintech" },
    desc: { fr: "Commission par compte ouvert ou par transaction.", en: "Commission per account opened or per transaction." },
    placeholder: { fr: "ex. Stripe, Mollie, Qonto", en: "e.g. Stripe, Mollie, Qonto" },
    commissionType: "per_sale",
    defaultRate: 0.02,
    suggestions: [
      { name: "Stripe", commission: 0, avgSale: 0, signupBonus: 0, note: { fr: "Réservé aux Stripe Partners (intégrateurs certifiés)", en: "Reserved for Stripe Partners (certified integrators)" } },
      { name: "Qonto", commission: 0, avgSale: 0, signupBonus: 100, note: { fr: "100€ par compte Pro ouvert via votre lien", en: "€100 per Pro account opened through your link" } },
      { name: "Revolut Business", commission: 0, avgSale: 0, signupBonus: 50, note: { fr: "Variable selon les campagnes en cours", en: "Variable depending on current campaigns" } },
      { name: "Wise", commission: 0, avgSale: 0, signupBonus: 15, note: { fr: "15€ par personne qui fait un transfert de 250€+", en: "€15 per person who makes a €250+ transfer" } },
      { name: "N26", commission: 0, avgSale: 0, signupBonus: 15, note: { fr: "15€ par compte ouvert avec 1ère transaction", en: "€15 per account opened with first transaction" } },
    ],
  },
  education: {
    icon: Lightning,
    badge: "gray",
    label: { fr: "Formation & Contenu", en: "Education & Content" },
    desc: { fr: "Recommandez des formations, cours en ligne ou livres.", en: "Recommend courses, online training or books." },
    placeholder: { fr: "ex. Udemy, Teachable, Amazon", en: "e.g. Udemy, Teachable, Amazon" },
    commissionType: "per_sale",
    defaultRate: 0.10,
    suggestions: [
      { name: "Udemy", commission: 0.10, avgSale: 15, note: { fr: "10-15% par cours vendu", en: "10-15% per course sold" } },
      { name: "Teachable", commission: 0.30, avgSale: 60, note: { fr: "30% récurrent sur les abonnements", en: "30% recurring on subscriptions" } },
      { name: "Skillshare", commission: 0, avgSale: 0, signupBonus: 7, note: { fr: "7$ par inscription premium", en: "$7 per premium signup" } },
      { name: "Coursera", commission: 0.15, avgSale: 50, note: { fr: "15-45% selon le programme", en: "15-45% depending on program" } },
      { name: "Amazon Kindle (livres)", commission: 0.04, avgSale: 15, note: { fr: "4-10% par livre vendu", en: "4-10% per book sold" } },
    ],
  },
  marketplace: {
    icon: Storefront,
    badge: "gray",
    label: { fr: "Services & Freelance", en: "Services & Freelance" },
    desc: { fr: "Recommandez des prestataires et touchez un bonus de parrainage.", en: "Refer service providers and earn a referral bonus." },
    placeholder: { fr: "ex. Fiverr, Malt, Upwork", en: "e.g. Fiverr, Malt, Upwork" },
    commissionType: "one_time",
    defaultRate: 25,
    suggestions: [
      { name: "Fiverr", commission: 30, note: { fr: "10-150$ selon le premier achat du client", en: "$10-150 depending on customer's first purchase" } },
      { name: "Malt", commission: 50, note: { fr: "50€ par nouveau freelance qui complète sa 1ère mission", en: "€50 per new freelancer who completes first mission" } },
      { name: "Upwork", commission: 0, avgSale: 0, signupBonus: 25, note: { fr: "25$ quand votre filleul gagne ses premiers 100$", en: "$25 when your referral earns their first $100" } },
      { name: "Deel", commission: 0, avgSale: 0, signupBonus: 200, note: { fr: "200$ par entreprise qui signe un contrat", en: "$200 per company that signs a contract" } },
      { name: "Toptal", commission: 500, note: { fr: "500$ par développeur/designer placé chez un client", en: "$500 per developer/designer placed with a client" } },
    ],
  },
};
var PROGRAM_KEYS = Object.keys(PROGRAM_META);

/* Commission types — beginner-friendly labels */
var COMMISSION_TYPES = {
  recurring: { fr: "Vous touchez chaque mois tant que le client reste abonné", en: "You earn every month as long as the customer stays subscribed" },
  per_sale: { fr: "Vous touchez un % à chaque vente", en: "You earn a % on each sale" },
  one_time: { fr: "Vous touchez un montant fixe par nouveau client", en: "You earn a fixed amount per new customer" },
  revenue_share: { fr: "Vous touchez un % du chiffre d'affaires du client", en: "You earn a % of the customer's revenue" },
};

/* ── Program Modal (split-panel) ── */
function ProgramModal({ item, onSave, onClose, lang }) {
  var t = useT().affiliation || {};
  var isEdit = !!item;
  var lk = lang === "en" ? "en" : "fr";

  var [selected, setSelected] = useState(isEdit ? (item.category || "saas") : "saas");
  var [name, setName] = useState(isEdit ? (item.name || "") : "");
  var [signupBonus, setSignupBonus] = useState(isEdit ? (item.signupBonus || 0) : 0);
  var [commission, setCommission] = useState(isEdit ? (item.commission || 0) : PROGRAM_META.saas.defaultRate);
  var [volume, setVolume] = useState(isEdit ? (item.volume || 0) : 0);
  var [avgSale, setAvgSale] = useState(isEdit ? (item.avgSale || 0) : 50);
  var [cap, setCap] = useState(isEdit ? (item.cap || 0) : 0);
  var [churn, setChurn] = useState(isEdit ? (item.churn || 0) : 0.05);
  var [growth, setGrowth] = useState(isEdit ? (item.growth || 0) : 0);
  var [url, setUrl] = useState(isEdit ? (item.url || "") : "");
  var [paidConversion, setPaidConversion] = useState(isEdit ? (item.paidConversion !== false) : true);

  var meta = PROGRAM_META[selected] || PROGRAM_META.saas;
  var Icon = meta.icon;
  var isPercent = meta.commissionType === "recurring" || meta.commissionType === "per_sale";
  var isRecurring = meta.commissionType === "recurring";

  function handleSelect(catKey) {
    setSelected(catKey);
    if (!isEdit) {
      setName("");
      setSignupBonus(0);
      setCommission(PROGRAM_META[catKey].defaultRate);
      setVolume(0);
      setAvgSale(50);
      setCap(0);
      setChurn(0.05);
      setGrowth(0);
      setUrl("");
      setPaidConversion(true);
    }
  }

  function handleSubmit() {
    onSave({
      name: name || meta.label[lk],
      category: selected,
      signupBonus: signupBonus,
      commission: commission,
      volume: volume,
      avgSale: avgSale,
      cap: cap,
      churn: churn,
      growth: growth,
      url: url,
      paidConversion: paidConversion,
      commissionType: meta.commissionType,
    });
    onClose();
  }

  var canSubmit = name.trim().length > 0;

  /* Revenue calculation */
  var monthlyRevenue = calcProgramRevenue({ category: selected, commission: commission, avgSale: avgSale, volume: volume, churn: churn, cap: cap, signupBonus: signupBonus });

  return (
    <Modal open onClose={onClose} size="lg" height={480} hideClose>
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        <ModalSideNav
          title={t.modal_type || "Catégorie de programme"}
          items={PROGRAM_KEYS.map(function (pk) {
            var m = PROGRAM_META[pk];
            return { key: pk, icon: m.icon, label: m.label[lk] };
          })}
          selected={selected}
          onSelect={handleSelect}
        />

        {/* Right panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ padding: "var(--sp-4) var(--sp-5)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "var(--sp-3)", flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: "var(--r-md)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-accordion)", border: "1px solid var(--border-light)" }}>
              <Icon size={16} weight="duotone" color="var(--text-secondary)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>{meta.label[lk]}</div>
              <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.3 }}>{meta.desc[lk]}</div>
            </div>
          </div>
          <div className="custom-scroll" style={{ flex: 1, padding: "var(--sp-5)", overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--sp-4)", scrollbarWidth: "thin", scrollbarColor: "var(--border-strong) transparent" }}>
            <div>
              <label style={labelStyle}>
                {t.field_name || "Nom du programme"} <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input value={name} onChange={function (e) { setName(e.target.value); }} autoFocus placeholder={meta.placeholder[lk]}
                style={inputStyle}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
              <div>
                <label style={labelStyle}>
                  {t.field_commission || "Commission"}
                </label>
                {isPercent ? (
                  <NumberField value={commission} onChange={setCommission} min={0} max={1} step={0.01} width="100%" pct />
                ) : (
                  <CurrencyInput value={commission} onChange={setCommission} suffix="€" width="100%" />
                )}
                <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 3 }}>
                  {COMMISSION_TYPES[meta.commissionType] ? COMMISSION_TYPES[meta.commissionType][lk] : ""}
                </div>
              </div>
              <div>
                <label style={labelStyle}>
                  {meta.commissionType === "one_time" ? (t.field_signups || "Inscriptions / mois") : (t.field_volume || "Ventes / mois")}
                </label>
                <NumberField value={volume} onChange={setVolume} min={0} max={99999} step={0.25} width="100%" />
              </div>
            </div>
            {isPercent ? (
              <div>
                <label style={labelStyle}>
                  {meta.commissionType === "recurring" ? (t.field_avg_sub || "Abonnement moyen / mois") : (t.field_avg_sale || "Panier moyen")}
                </label>
                <CurrencyInput value={avgSale} onChange={setAvgSale} suffix="€" width="100%" />
              </div>
            ) : null}
            {/* Signup bonus + Cap + Churn */}
            <div style={{ display: "grid", gridTemplateColumns: isRecurring ? "1fr 1fr 1fr" : "1fr 1fr", gap: "var(--sp-3)" }}>
              <div>
                <label style={labelStyle}>
                  {t.field_signup_bonus || "Prime d'inscription"}
                </label>
                <CurrencyInput value={signupBonus} onChange={setSignupBonus} suffix="€" width="100%" />
                <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 3 }}>
                  {lk === "fr" ? "Montant unique par nouveau client" : "One-time amount per new customer"}
                </div>
              </div>
              <div>
                <label style={labelStyle}>
                  {t.field_cap || "Plafond annuel"}
                </label>
                <CurrencyInput value={cap} onChange={setCap} suffix="€" width="100%" />
                <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 3 }}>
                  {lk === "fr" ? "0 = pas de limite" : "0 = no limit"}
                </div>
              </div>
              {isRecurring ? (
                <div>
                  <label style={labelStyle}>
                    {t.field_churn || "Désabonnement"}
                  </label>
                  <NumberField value={churn} onChange={setChurn} min={0} max={1} step={0.01} width="100%" pct />
                  <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 3 }}>
                    {lk === "fr" ? "% de clients perdus par mois" : "% of customers lost per month"}
                  </div>
                </div>
              ) : null}
              <div>
                <label style={labelStyle}>
                  {t.field_growth || "Croissance mensuelle"}
                </label>
                <NumberField value={growth} onChange={setGrowth} min={0} max={5} step={0.01} width="100%" pct />
                <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 3 }}>
                  {lk === "fr" ? "% de clients en plus chaque mois" : "% more customers each month"}
                </div>
              </div>
            </div>
            <div>
              <label style={labelStyle}>
                {t.field_url || "Lien du programme"} <span style={{ fontSize: 10, color: "var(--text-faint)" }}>({t.optional || "optionnel"})</span>
              </label>
              <input value={url} onChange={function (e) { setUrl(e.target.value); }} placeholder="https://"
                style={inputStyle}
              />
            </div>
            {/* Revenue preview */}
            <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.field_monthly_revenue || "Revenu mensuel estimé"}</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Bricolage Grotesque', sans-serif", fontVariantNumeric: "tabular-nums" }}>{eur(monthlyRevenue)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.field_annual_revenue || "Revenu annuel estimé"}</span>
                <span style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eur(monthlyRevenue * 12)}</span>
              </div>
            </div>
          </div>
          <ModalFooter>
            <Button color="tertiary" size="lg" onClick={onClose}>{t.modal_close || "Fermer"}</Button>
            <Button color="primary" size="lg" onClick={handleSubmit} isDisabled={!canSubmit} iconLeading={isEdit ? undefined : <Plus size={14} weight="bold" />}>
              {isEdit ? (t.modal_save || "Enregistrer") : (t.modal_add || "Ajouter")}
            </Button>
          </ModalFooter>
        </div>
      </div>
    </Modal>
  );
}

/* ── Add Wizard Modal (3 steps) ── */
function ProgramWizardModal({ onSave, onClose, lang }) {
  var lk = lang === "en" ? "en" : "fr";
  var [step, setStep] = useState(0);

  var [selected, setSelected] = useState("saas");
  var [name, setName] = useState("");
  var [url, setUrl] = useState("");
  var [commission, setCommission] = useState(PROGRAM_META.saas.defaultRate);
  var [volume, setVolume] = useState(0);
  var [avgSale, setAvgSale] = useState(50);
  var [signupBonus, setSignupBonus] = useState(0);
  var [cap, setCap] = useState(0);
  var [churn, setChurn] = useState(0.05);

  var meta = PROGRAM_META[selected] || PROGRAM_META.saas;
  var isPercent = meta.commissionType === "recurring" || meta.commissionType === "per_sale";
  var isRecurring = meta.commissionType === "recurring";

  function selectType(key) {
    setSelected(key);
    setCommission(PROGRAM_META[key].defaultRate);
    setName("");
  }

  /* Revenue calc */
  var monthlyRevenue = calcProgramRevenue({ category: selected, commission: commission, avgSale: avgSale, volume: volume, churn: churn, cap: cap, signupBonus: signupBonus });

  function handleFinish() {
    onSave({
      name: name || meta.label[lk],
      category: selected,
      signupBonus: signupBonus,
      commission: commission,
      volume: volume,
      avgSale: avgSale,
      cap: cap,
      churn: churn,
      url: url,
      paidConversion: true,
      commissionType: meta.commissionType,
    });
    onClose();
  }

  var hintStyle = { fontSize: 10, color: "var(--text-faint)", marginTop: 3 };

  return (
    <Modal open onClose={onClose} size="lg" height={520}>
      {/* Progress */}
      <div style={{ padding: "0 var(--sp-5)", paddingTop: "var(--sp-4)" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {[0, 1, 2].map(function (i) {
            return <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? "var(--brand)" : "var(--bg-hover)", transition: "background 0.2s" }} />;
          })}
        </div>
      </div>

      <div className="custom-scroll" style={{ flex: 1, overflowY: "auto", padding: "var(--sp-5)", scrollbarWidth: "thin", scrollbarColor: "var(--border-strong) transparent" }}>

        {/* Step 1 — Type + Nom */}
        {step === 0 ? (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-1)", textAlign: "center" }}>
              {lk === "fr" ? "Quel programme ?" : "Which program?"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-4)", textAlign: "center" }}>
              {lk === "fr" ? "Choisissez le type et donnez un nom à votre programme." : "Pick the type and name your program."}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--sp-2)", marginBottom: "var(--sp-4)" }}>
              {PROGRAM_KEYS.map(function (pk) {
                var m = PROGRAM_META[pk];
                var PIcon = m.icon;
                var isActive = selected === pk;
                return (
                  <button key={pk} type="button" onClick={function () { selectType(pk); }}
                    style={{
                      padding: "var(--sp-3)", border: "2px solid " + (isActive ? "var(--brand)" : "var(--border-light)"),
                      borderRadius: "var(--r-lg)", background: isActive ? "var(--brand-bg)" : "var(--bg-accordion)",
                      cursor: "pointer", fontFamily: "inherit", textAlign: "center", transition: "border-color 0.15s",
                    }}>
                    <PIcon size={20} weight={isActive ? "fill" : "duotone"} color={isActive ? "var(--brand)" : "var(--text-muted)"} style={{ marginBottom: 4 }} />
                    <div style={{ fontSize: 11, fontWeight: isActive ? 600 : 500, color: isActive ? "var(--brand)" : "var(--text-secondary)", lineHeight: 1.3 }}>{m.label[lk]}</div>
                  </button>
                );
              })}
            </div>
            {/* Suggestions */}
            {meta.suggestions && meta.suggestions.length > 0 ? (
              <div style={{ marginBottom: "var(--sp-3)" }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-faint)", marginBottom: "var(--sp-1)" }}>
                  {lk === "fr" ? "Programmes populaires" : "Popular programs"}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {meta.suggestions.map(function (sug) {
                    var isActive = name === sug.name;
                    return (
                      <button key={sug.name} type="button"
                        onClick={function () {
                          setName(sug.name);
                          if (sug.commission !== undefined) setCommission(sug.commission);
                          if (sug.avgSale !== undefined) setAvgSale(sug.avgSale);
                          if (sug.signupBonus !== undefined) setSignupBonus(sug.signupBonus);
                          if (sug.cap !== undefined) setCap(sug.cap);
                        }}
                        style={{
                          padding: "4px 10px", border: "1px solid " + (isActive ? "var(--brand)" : "var(--border-light)"),
                          borderRadius: "var(--r-full)", background: isActive ? "var(--brand-bg)" : "var(--bg-accordion)",
                          fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? "var(--brand)" : "var(--text-secondary)",
                          cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
                        }}
                      >
                        {sug.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <div style={{ marginBottom: "var(--sp-3)" }}>
              <label style={labelStyle}>{lk === "fr" ? "Nom du programme" : "Program name"} <span style={{ color: "var(--color-error)" }}>*</span></label>
              <input value={name} onChange={function (e) { setName(e.target.value); }} placeholder={meta.placeholder[lk]}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>{lk === "fr" ? "Lien du programme" : "Program link"} <span style={{ fontSize: 10, color: "var(--text-faint)" }}>({lk === "fr" ? "optionnel" : "optional"})</span></label>
              <input value={url} onChange={function (e) { setUrl(e.target.value); }} placeholder="https://"
                style={inputStyle}
              />
            </div>
          </div>
        ) : null}

        {/* Step 2 — Commission + Volume */}
        {step === 1 ? (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-1)", textAlign: "center" }}>
              {lk === "fr" ? "Combien ça rapporte ?" : "How much does it pay?"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-4)", textAlign: "center" }}>
              {lk === "fr" ? "Estimez ce que vous gagnez pour chaque client que vous apportez." : "Estimate what you earn for each customer you bring."}
            </div>

            {/* Commission field */}
            <div style={{ marginBottom: "var(--sp-3)" }}>
              <label style={labelStyle}>
                {isPercent
                  ? (lk === "fr" ? "Quel pourcentage touchez-vous ?" : "What percentage do you earn?")
                  : (lk === "fr" ? "Combien touchez-vous par client ?" : "How much do you earn per customer?")}
              </label>
              {isPercent ? (
                <NumberField value={commission} onChange={setCommission} min={0} max={1} step={0.01} width="100%" pct />
              ) : (
                <CurrencyInput value={commission} onChange={setCommission} suffix="€" width="100%" />
              )}
              <div style={hintStyle}>{COMMISSION_TYPES[meta.commissionType] ? COMMISSION_TYPES[meta.commissionType][lk] : ""}</div>
            </div>

            {/* Client spend — only for % commissions */}
            {isPercent ? (
              <div style={{ marginBottom: "var(--sp-3)" }}>
                <label style={labelStyle}>
                  {isRecurring
                    ? (lk === "fr" ? "Combien dépense un client par mois ?" : "How much does a customer spend per month?")
                    : (lk === "fr" ? "Combien dépense un client en moyenne ?" : "How much does a customer spend on average?")}
                </label>
                <CurrencyInput value={avgSale} onChange={setAvgSale} suffix="€" width="100%" />
                <div style={hintStyle}>
                  {isRecurring
                    ? (lk === "fr" ? "L'abonnement mensuel que paie votre client" : "The monthly subscription your customer pays")
                    : (lk === "fr" ? "Le montant moyen d'une commande" : "The average order amount")}
                </div>
              </div>
            ) : null}

            {/* Volume */}
            <div style={{ marginBottom: "var(--sp-3)" }}>
              <label style={labelStyle}>{lk === "fr" ? "Combien de clients amenez-vous par mois ?" : "How many customers do you bring per month?"}</label>
              <NumberField value={volume} onChange={setVolume} min={0} max={99999} step={1} width="100%" />
              <div style={hintStyle}>{lk === "fr" ? "Estimation réaliste, même approximative" : "Realistic estimate, even approximate"}</div>
            </div>
            {/* Live preview */}
            {volume > 0 ? (
              <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{lk === "fr" ? "Revenu mensuel estimé" : "Estimated monthly revenue"}</span>
                <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Bricolage Grotesque', sans-serif", fontVariantNumeric: "tabular-nums" }}>{eur(monthlyRevenue)}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Step 3 — Conditions avancées */}
        {step === 2 ? (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-1)", textAlign: "center" }}>
              {lk === "fr" ? "Conditions avancées" : "Advanced conditions"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-4)", textAlign: "center" }}>
              {lk === "fr" ? "Optionnel — affinez votre estimation si vous connaissez ces détails." : "Optional — refine your estimate if you know these details."}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isRecurring ? "1fr 1fr 1fr" : "1fr 1fr", gap: "var(--sp-3)", marginBottom: "var(--sp-4)" }}>
              <div>
                <label style={labelStyle}>{lk === "fr" ? "Prime d'inscription" : "Signup bonus"}</label>
                <CurrencyInput value={signupBonus} onChange={setSignupBonus} suffix="€" width="100%" />
                <div style={hintStyle}>{lk === "fr" ? "Montant unique par nouveau client" : "One-time amount per new customer"}</div>
              </div>
              <div>
                <label style={labelStyle}>{lk === "fr" ? "Plafond annuel" : "Annual cap"}</label>
                <CurrencyInput value={cap} onChange={setCap} suffix="€" width="100%" />
                <div style={hintStyle}>{lk === "fr" ? "0 = pas de limite" : "0 = no limit"}</div>
              </div>
              {isRecurring ? (
                <div>
                  <label style={labelStyle}>{lk === "fr" ? "Désabonnement" : "Churn"}</label>
                  <NumberField value={churn} onChange={setChurn} min={0} max={1} step={0.01} width="100%" pct />
                  <div style={hintStyle}>{lk === "fr" ? "% de clients perdus par mois" : "% lost per month"}</div>
                </div>
              ) : null}
            </div>
            {/* Final summary */}
            <div style={{ padding: "var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{name || meta.label[lk]}</span>
                <Badge color={meta.badge} size="sm" dot>{meta.label[lk]}</Badge>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{lk === "fr" ? "Mensuel" : "Monthly"}</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Bricolage Grotesque', sans-serif", fontVariantNumeric: "tabular-nums" }}>{eur(monthlyRevenue)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{lk === "fr" ? "Annuel" : "Annual"}</span>
                <span style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eur(monthlyRevenue * 12)}</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Navigation */}
      <ModalFooter>
        {step > 0 ? (
          <Button color="tertiary" size="lg" onClick={function () { setStep(function (s) { return s - 1; }); }}>
            {lk === "fr" ? "Retour" : "Back"}
          </Button>
        ) : (
          <Button color="tertiary" size="lg" onClick={onClose}>
            {lk === "fr" ? "Annuler" : "Cancel"}
          </Button>
        )}
        <div style={{ display: "flex", gap: "var(--sp-2)" }}>
          {step === 1 ? (
            <Button color="tertiary" size="lg" onClick={function () { setStep(2); }}>
              {lk === "fr" ? "Passer" : "Skip"}
            </Button>
          ) : null}
          {step < 2 ? (
            <Button color="primary" size="lg" isDisabled={step === 0 && !name.trim()} onClick={function () { setStep(function (s) { return s + 1; }); }}>
              {lk === "fr" ? "Suivant" : "Next"}
            </Button>
          ) : (
            <Button color="primary" size="lg" onClick={handleFinish} iconLeading={<Plus size={14} weight="bold" />}>
              {lk === "fr" ? "Ajouter" : "Add"}
            </Button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}

/* ── Calc helpers ── */
function calcProgramRevenue(p) {
  var meta = PROGRAM_META[p.category] || PROGRAM_META.saas;
  var fromCommission = 0;
  if (meta.commissionType === "recurring") {
    fromCommission = (p.commission || 0) * (p.avgSale || 0) * (p.volume || 0);
    if (p.churn > 0) fromCommission = fromCommission * (1 - (p.churn || 0));
  } else if (meta.commissionType === "per_sale") {
    fromCommission = (p.commission || 0) * (p.avgSale || 0) * (p.volume || 0);
  } else {
    fromCommission = (p.commission || 0) * (p.volume || 0);
  }
  if (p.cap > 0 && fromCommission > p.cap / 12) fromCommission = p.cap / 12;
  var fromSignup = (p.signupBonus || 0) * (p.volume || 0);
  return fromCommission + fromSignup;
}

/* ── Main Page ── */
export default function AffiliationPage({ appCfg, affiliation, setAffiliation, chartPalette, chartPaletteMode, onChartPaletteChange, accentRgb }) {
  var t = useT().affiliation || {};
  var { lang } = useLang();
  var lk = lang === "en" ? "en" : "fr";
  var { devMode } = useDevMode();

  var cfg = affiliation || {};
  function cfgSet(key, val) { setAffiliation(function (prev) { var nc = Object.assign({}, prev); nc[key] = val; return nc; }); }

  var [showCreate, setShowCreate] = useState(false);
  var [editing, setEditing] = useState(null);
  var [pendingDelete, setPendingDelete] = useState(null);
  var [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  var [search, setSearch] = useState("");
  var [filter, setFilter] = useState("all");

  var programs = cfg.programs || [];

  function addProgram(data) { cfgSet("programs", programs.concat([Object.assign({ id: makeId("aff") }, data)])); }
  function saveProgram(idx, data) { var nc = programs.slice(); nc[idx] = Object.assign({}, nc[idx], data); cfgSet("programs", nc); }
  function removeProgram(idx) { cfgSet("programs", programs.filter(function (_, j) { return j !== idx; })); }
  function requestDelete(idx) { if (skipDeleteConfirm) { removeProgram(idx); } else { setPendingDelete(idx); } }
  function cloneProgram(idx) { var nc = programs.slice(); var clone = Object.assign({}, nc[idx], { id: makeId("aff"), name: nc[idx].name + (t.copy_suffix || " (copie)") }); nc.splice(idx + 1, 0, clone); cfgSet("programs", nc); }

  function bulkDeletePrograms(ids) {
    var idSet = {};
    ids.forEach(function (id) { idSet[id] = true; });
    cfgSet("programs", programs.filter(function (p) { return !idSet[String(p.id)]; }));
  }

  /* Totals */
  var totalMonthly = 0;
  var totalVolume = 0;
  programs.forEach(function (p) { totalMonthly += calcProgramRevenue(p); totalVolume += p.volume || 0; });
  var totalAnnual = totalMonthly * 12;
  var avgRevenue = programs.length > 0 ? totalMonthly / programs.length : 0;

  /* Filter */
  var filterOptions = useMemo(function () {
    var cats = {};
    programs.forEach(function (p) { var ck = p.category || "saas"; if (PROGRAM_META[ck]) cats[ck] = true; });
    var opts = [{ value: "all", label: t.filter_all || "Toutes les catégories" }];
    Object.keys(cats).forEach(function (ck) { opts.push({ value: ck, label: PROGRAM_META[ck].label[lk] }); });
    return opts;
  }, [programs, lk, t]);

  var filteredPrograms = useMemo(function () {
    var list = programs;
    if (filter !== "all") list = list.filter(function (p) { return (p.category || "saas") === filter; });
    if (search.trim()) {
      var q = search.trim().toLowerCase();
      list = list.filter(function (p) { return (p.name || "").toLowerCase().indexOf(q) !== -1; });
    }
    return list;
  }, [programs, filter, search]);

  /* Insight: distribution by program category */
  var categoryDistribution = useMemo(function () {
    var dist = {};
    programs.forEach(function (p) {
      var key = p.category || "saas";
      dist[key] = (dist[key] || 0) + calcProgramRevenue(p);
    });
    return dist;
  }, [programs]);

  /* Insight: top program by monthly revenue */
  var topProgram = useMemo(function () {
    if (programs.length === 0) return null;
    var best = null;
    var bestRev = 0;
    programs.forEach(function (p) {
      var rev = calcProgramRevenue(p);
      if (rev > bestRev) { bestRev = rev; best = p; }
    });
    if (!best) return null;
    return { program: best, monthly: bestRev, annual: bestRev * 12, pct: totalMonthly > 0 ? Math.round(bestRev / totalMonthly * 100) : 0 };
  }, [programs, totalMonthly]);

  /* Columns */
  var columns = useMemo(function () {
    return [
      {
        id: "name", accessorKey: "name",
        header: t.col_program || "Programme",
        enableSorting: true, meta: { align: "left", minWidth: 160, grow: true },
        cell: function (info) { return info.getValue() || "—"; },
        footer: function () {
          return (
            <>
              <span style={{ fontWeight: 600 }}>{t.footer_total || "Total"}</span>
              <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>{programs.length} {t.footer_programs || "programmes"}</span>
            </>
          );
        },
      },
      {
        id: "url",
        header: "",
        enableSorting: false, meta: { align: "center", compactPadding: true, width: 1 },
        cell: function (info) {
          var u = info.row.original.url;
          if (!u) return null;
          return <a href={u} target="_blank" rel="noopener noreferrer" title={u} style={{ color: "var(--brand)", display: "inline-flex" }}><LinkIcon size={14} weight="bold" /></a>;
        },
      },
      {
        id: "category",
        header: t.col_category || "Catégorie",
        enableSorting: true, meta: { align: "left" },
        cell: function (info) {
          var cat = info.row.original.category || "saas";
          var m = PROGRAM_META[cat];
          return m ? <Badge color={m.badge} size="sm" dot>{m.label[lk]}</Badge> : cat;
        },
      },
      {
        id: "volume",
        header: t.col_volume || "Clients/mois",
        enableSorting: true, meta: { align: "right", rawNumber: true },
        accessorFn: function (row) { return row.volume || 0; },
        cell: function (info) {
          var v = info.getValue();
          return v > 0 ? String(v) : <span style={{ color: "var(--text-faint)" }}>—</span>;
        },
        footer: function () {
          var total = 0;
          programs.forEach(function (p) { total += p.volume || 0; });
          return <span style={{ fontWeight: 600 }}>{total}</span>;
        },
      },
      {
        id: "volumeAnnual",
        header: t.col_volume_annual || "Clients/an",
        enableSorting: true, meta: { align: "right", rawNumber: true },
        accessorFn: function (row) { return (row.volume || 0) * 12; },
        cell: function (info) {
          var v = info.getValue();
          return v > 0 ? String(v) : <span style={{ color: "var(--text-faint)" }}>—</span>;
        },
        footer: function () {
          var total = 0;
          programs.forEach(function (p) { total += (p.volume || 0) * 12; });
          return <span style={{ fontWeight: 600 }}>{total}</span>;
        },
      },
      {
        id: "churn",
        header: t.col_churn || "Désabon.",
        enableSorting: true, meta: { align: "right", rawNumber: true },
        accessorFn: function (row) { return row.churn || 0; },
        cell: function (info) {
          var v = info.getValue();
          return v > 0 ? pct(v) : <span style={{ color: "var(--text-faint)" }}>—</span>;
        },
      },
      {
        id: "growth",
        header: t.col_growth || "Croissance",
        enableSorting: true, meta: { align: "right", rawNumber: true },
        accessorFn: function (row) { return row.growth || 0; },
        cell: function (info) {
          var v = info.getValue();
          return v > 0 ? <span style={{ color: "var(--color-success)" }}>+{pct(v)}</span> : <span style={{ color: "var(--text-faint)" }}>—</span>;
        },
      },
      {
        id: "avgSale",
        header: t.col_avg_sale || "Panier moyen",
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return row.avgSale || 0; },
        cell: function (info) {
          var v = info.getValue();
          return v > 0 ? eur(v) : <span style={{ color: "var(--text-faint)" }}>—</span>;
        },
      },
      {
        id: "commission",
        header: t.col_commission || "Commission",
        enableSorting: true, meta: { align: "right" },
        cell: function (info) {
          var p = info.row.original;
          var m = PROGRAM_META[p.category] || PROGRAM_META.saas;
          if (m.commissionType === "one_time") return eur(p.commission || 0);
          return pct(p.commission || 0);
        },
      },
      {
        id: "signupBonus",
        header: t.col_signup_bonus || "Prime inscr.",
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return row.signupBonus || 0; },
        cell: function (info) {
          var v = info.getValue();
          return v > 0 ? eur(v) : <span style={{ color: "var(--text-faint)" }}>—</span>;
        },
      },
      {
        id: "monthly",
        header: t.col_monthly || "Revenu/mois",
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return calcProgramRevenue(row); },
        cell: function (info) { return eur(info.getValue()); },
        footer: function () { return <span style={{ fontWeight: 600 }}>{eur(totalMonthly)}</span>; },
      },
      {
        id: "annual",
        header: t.col_annual || "Revenu/an",
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return calcProgramRevenue(row) * 12; },
        cell: function (info) { return eur(info.getValue()); },
        footer: function () { return <span style={{ fontWeight: 600 }}>{eur(totalAnnual)}</span>; },
      },
      {
        id: "actions", header: "", enableSorting: false,
        meta: { align: "center", compactPadding: true, width: 1 },
        cell: function (info) {
          var idx = info.row.index;
          return (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
              <ActionBtn icon={<PencilSimple size={14} />} title={t.action_edit || "Modifier"} onClick={function () { setEditing({ idx: idx, item: programs[idx] }); }} />
              <ActionBtn icon={<Copy size={14} />} title={t.action_clone || "Dupliquer"} onClick={function () { cloneProgram(idx); }} />
              <ActionBtn icon={<Trash size={14} />} title={t.action_delete || "Supprimer"} variant="danger" onClick={function () { requestDelete(idx); }} />
            </div>
          );
        },
      },
    ];
  }, [programs, totalMonthly, lk, t]);

  function randomize() {
    cfgSet("programs", [
      { id: makeId("aff"), name: "Accountable — Inscription", category: "saas", commission: 0, volume: 8, avgSale: 0, signupBonus: 10, churn: 0, url: "https://www.accountable.eu", commissionType: "one_time" },
      { id: makeId("aff"), name: "Accountable — Abonnement", category: "saas", commission: 0, volume: 3, avgSale: 0, signupBonus: 100, churn: 0, url: "https://www.accountable.eu", commissionType: "one_time" },
      { id: makeId("aff"), name: "Brevo", category: "saas", commission: 0, volume: 6, avgSale: 0, signupBonus: 5, churn: 0, url: "https://www.brevo.com", commissionType: "one_time" },
      { id: makeId("aff"), name: "Mailchimp", category: "saas", commission: 0, volume: 6, avgSale: 0, signupBonus: 8, churn: 0.25, url: "https://mailchimp.com", commissionType: "one_time" },
      { id: makeId("aff"), name: "Wix", category: "saas", commission: 0, volume: 0.25, avgSale: 0, signupBonus: 20, churn: 0.25, url: "https://fr.wix.com", commissionType: "one_time" },
      { id: makeId("aff"), name: "Shopify", category: "ecommerce", commission: 0, volume: 0.25, avgSale: 0, signupBonus: 150, churn: 0.25, url: "https://help.shopify.com", commissionType: "one_time" },
      { id: makeId("aff"), name: "Metricool", category: "saas", commission: 0, volume: 2, avgSale: 0, signupBonus: 50, churn: 0, url: "https://metricool.com", commissionType: "one_time" },
    ]);
    cfgSet("enabled", true);
  }

  /* Wizard */
  if (!cfg.enabled) {
    var wizardSteps = [
      {
        key: "intro",
        content: (
          <div style={{ textAlign: "center" }}>
            <LinkIcon size={56} weight="duotone" style={{ color: "var(--brand)", marginBottom: "var(--sp-4)" }} />
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-3)" }}>
              {lk === "fr" ? "Gagnez de l'argent en recommandant des outils" : "Earn money by recommending tools"}
            </div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "var(--sp-4)", textAlign: "left" }}>
              {lk === "fr"
                ? "De nombreuses entreprises proposent des programmes de parrainage : vous recommandez leur produit et touchez une commission à chaque inscription ou vente. C'est un revenu complémentaire sans effort supplémentaire."
                : "Many companies offer referral programs: recommend their product and earn a commission on each signup or sale. It's additional revenue with no extra effort."}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--sp-3)", marginBottom: "var(--sp-5)", textAlign: "left" }}>
              {[
                { icon: LinkIcon, title: lk === "fr" ? "Inscrivez-vous" : "Sign up", desc: lk === "fr" ? "Rejoignez le programme d'affiliation d'un outil que vous utilisez déjà." : "Join the affiliate program of a tool you already use." },
                { icon: Handshake, title: lk === "fr" ? "Recommandez" : "Recommend", desc: lk === "fr" ? "Partagez votre lien avec vos clients, votre réseau ou votre audience." : "Share your link with clients, network or audience." },
                { icon: CreditCard, title: lk === "fr" ? "Touchez vos commissions" : "Earn commissions", desc: lk === "fr" ? "Recevez un pourcentage ou un montant fixe pour chaque conversion." : "Receive a percentage or fixed amount per conversion." },
              ].map(function (card, ci) {
                var CIcon = card.icon;
                return (
                  <div key={ci} style={{ border: "1px solid var(--border-light)", borderRadius: "var(--r-lg)", padding: "var(--sp-3)", background: "var(--bg-accordion)" }}>
                    <CIcon size={20} weight="duotone" color="var(--brand)" style={{ marginBottom: "var(--sp-2)" }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{card.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{card.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ),
      },
    ];

    function wizardFinish() {
      cfgSet("enabled", true);
      cfgSet("programs", []);
    }

    return (
      <PageLayout
        title={t.page_title || (lk === "fr" ? "Programmes d'affiliation" : "Affiliate programs")}
        subtitle={t.page_sub || (lk === "fr" ? "Gagnez des commissions en recommandant des outils et services." : "Earn commissions by recommending tools and services.")}
        icon={Handshake} iconColor="var(--color-success)"
      >
        <Wizard
          steps={wizardSteps}
          onFinish={wizardFinish}
          finishLabel={lk === "fr" ? "Commencer" : "Get started"}
          finishIcon={<ToggleRight size={16} />}
        />
      </PageLayout>
    );
  }

  /* Toolbar */
  var toolbarNode = (
    <>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder={t.search_placeholder || "Rechercher..."} />
        <FilterDropdown value={filter} onChange={setFilter} options={filterOptions} />
      </div>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
        {devMode ? (
          <DevOptionsButton onRandomize={randomize} onClear={function () { cfgSet("programs", []); }} />
        ) : null}
        <ExportButtons cfg={appCfg} data={filteredPrograms} columns={columns} filename="affiliation" title={lk === "fr" ? "Affiliation" : "Affiliation"} subtitle={lk === "fr" ? "Gagnez des commissions en recommandant des outils et services." : "Earn commissions by recommending tools and services."} getPcmn={function () { return "7020"; }} />
        <Button color="primary" size="lg" onClick={function () { setShowCreate(true); }} iconLeading={<Plus size={14} weight="bold" />}>
          {t.add || "Ajouter"}
        </Button>
      </div>
    </>
  );

  var emptyNode = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-3)", padding: "var(--sp-6)" }}>
      <div style={{ width: 48, height: 48, borderRadius: "var(--r-lg)", background: "var(--bg-accordion)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Handshake size={24} weight="duotone" color="var(--text-muted)" />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t.empty_title || "Aucun programme"}</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 360, textAlign: "center" }}>{t.empty_desc || "Ajoutez les programmes d'affiliation auxquels vous participez."}</div>
      <Button color="primary" size="md" onClick={function () { setShowCreate(true); }} iconLeading={<Plus size={14} weight="bold" />} sx={{ marginTop: "var(--sp-2)" }}>
        {t.add || "Ajouter"}
      </Button>
    </div>
  );

  return (
    <PageLayout
      title={t.page_title || (lk === "fr" ? "Programmes d'affiliation" : "Affiliate programs")}
      subtitle={t.page_sub || (lk === "fr" ? "Gagnez des commissions en recommandant des outils et services." : "Earn commissions by recommending tools and services.")}
      icon={Handshake} iconColor="var(--color-success)"
    >
      {showCreate ? <ProgramWizardModal onSave={addProgram} onClose={function () { setShowCreate(false); }} lang={lang} /> : null}
      {editing ? <ProgramModal item={editing.item} onSave={function (data) { saveProgram(editing.idx, data); }} onClose={function () { setEditing(null); }} lang={lang} /> : null}
      {pendingDelete !== null ? <ConfirmDeleteModal
        onConfirm={function () { removeProgram(pendingDelete); setPendingDelete(null); }}
        onCancel={function () { setPendingDelete(null); }}
        skipNext={skipDeleteConfirm} setSkipNext={setSkipDeleteConfirm}
        t={{ confirm_title: t.confirm_delete || "Supprimer ce programme ?", confirm_body: t.confirm_delete_body || "Ce programme sera retiré.", confirm_skip: t.confirm_skip || "Ne plus demander", cancel: t.cancel || "Annuler", delete: t.delete || "Supprimer" }}
      /> : null}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={t.kpi_monthly || "Revenu mensuel"} value={totalMonthly > 0 ? eurShort(totalMonthly) : "—"} fullValue={totalMonthly > 0 ? eur(totalMonthly) : undefined} glossaryKey="affiliate_revenue" />
        <KpiCard label={t.kpi_annual || "Revenu annuel"} value={totalAnnual > 0 ? eurShort(totalAnnual) : "—"} fullValue={totalAnnual > 0 ? eur(totalAnnual) : undefined} glossaryKey="affiliate_annual" />
        <KpiCard label={t.kpi_volume || "Clients / mois"} value={totalVolume > 0 ? String(totalVolume) : "—"} fullValue={totalVolume > 0 ? totalVolume + "/mois · " + (totalVolume * 12) + "/an" : undefined} glossaryKey="affiliate_volume" />
        <KpiCard label={t.kpi_programs || "Programmes actifs"} value={String(programs.length)} glossaryKey="affiliate_programs" />
      </div>

      {/* ── Insights section — always visible, skeleton when empty ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>

        {/* Donut: distribution by commission type */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.insight_distribution || "Répartition par catégorie"}
            </div>
            <PaletteToggle value={chartPaletteMode} onChange={onChartPaletteChange} accentRgb={accentRgb} />
          </div>
          <ChartLegend palette={chartPalette} distribution={categoryDistribution} meta={PROGRAM_META} total={totalMonthly} lk={lk}>
            <DonutChart data={categoryDistribution} palette={chartPalette} />
          </ChartLegend>

        </div>

        {/* Right column: top program */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {t.insight_top_program || "Meilleur programme"}
          </div>
          {topProgram ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{topProgram.program.name}</span>
                <Badge color={(PROGRAM_META[topProgram.program.category] || {}).badge || "gray"} size="sm" dot>
                  {(PROGRAM_META[topProgram.program.category] || { label: {} }).label[lk] || topProgram.program.category}
                </Badge>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                {eur(topProgram.monthly)}/{lk === "fr" ? "mois" : "mo"} <span style={{ margin: "0 6px", color: "var(--text-muted)" }} aria-hidden="true">&bull;</span> <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{topProgram.pct}%</span> {t.insight_of_total || "du total"}
              </div>

              {/* Revenue details */}
              <div style={{ marginTop: "var(--sp-3)", paddingTop: "var(--sp-3)", borderTop: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--text-muted)" }}>{t.insight_monthly_label || "Mensuel"}</span>
                  <span style={{ fontWeight: 700, fontFamily: "'Bricolage Grotesque', sans-serif", fontVariantNumeric: "tabular-nums" }}>{eur(topProgram.monthly)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--text-muted)" }}>{t.insight_annual_label || "Annuel"}</span>
                  <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eur(topProgram.annual)}</span>
                </div>
              </div>

              {/* Volume & commission details */}
              <div style={{ marginTop: "var(--sp-3)", paddingTop: "var(--sp-3)", borderTop: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--text-muted)" }}>{t.col_volume || "Clients/mois"}</span>
                  <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{topProgram.program.volume || 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--text-muted)" }}>{t.col_commission || "Commission"}</span>
                  <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    {(PROGRAM_META[topProgram.program.category] || PROGRAM_META.saas).commissionType === "one_time"
                      ? eur(topProgram.program.commission || 0)
                      : pct(topProgram.program.commission || 0)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* skeleton */
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                <span style={{ width: 120, height: 14, borderRadius: 4, background: "var(--bg-hover)", display: "inline-block" }} />
                <span style={{ width: 60, height: 20, borderRadius: 10, background: "var(--bg-hover)", display: "inline-block" }} />
              </div>
              <div style={{ width: 180, height: 10, borderRadius: 4, background: "var(--bg-hover)", marginTop: 8 }} />
              <div style={{ marginTop: "var(--sp-3)", paddingTop: "var(--sp-3)", borderTop: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ width: 50, height: 10, borderRadius: 4, background: "var(--bg-hover)", display: "inline-block" }} />
                  <span style={{ width: 70, height: 10, borderRadius: 4, background: "var(--bg-hover)", display: "inline-block" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ width: 50, height: 10, borderRadius: 4, background: "var(--bg-hover)", display: "inline-block" }} />
                  <span style={{ width: 70, height: 10, borderRadius: 4, background: "var(--bg-hover)", display: "inline-block" }} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        data={filteredPrograms}
        columns={columns}
        toolbar={toolbarNode}
        emptyState={emptyNode}
        emptyMinHeight={200}
        pageSize={10}
        getRowId={function (row) { return String(row.id); }}
        selectable
        onDeleteSelected={bulkDeletePrograms}
        scrollable
      />
    </PageLayout>
  );
}
