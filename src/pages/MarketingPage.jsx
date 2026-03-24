import { useState, useMemo } from "react";
import {
  Megaphone, TrendUp, CurrencyCircleDollar, Users, Target,
  Plus, Shuffle, Eraser,
} from "@phosphor-icons/react";
import { PageLayout, KpiCard, Card, Button, DataTable, Badge, Wizard } from "../components";
import ModulePaywall from "../components/ModulePaywall";
import CurrencyInput from "../components/CurrencyInput";
import NumberField from "../components/NumberField";
import { eur, eurShort, pct, makeId } from "../utils";
import { useT, useLang, useDevMode, useTheme } from "../context";

/* ── Channel metadata ── */
var CHANNEL_META = {
  meta:      { label: { fr: "Facebook & Instagram", en: "Facebook & Instagram" }, desc: { fr: "Publicité sur les réseaux Meta.", en: "Advertising on Meta networks." }, badge: "brand", icon: Target, defaultCpc: 0.80, defaultCtr: 0.02 },
  google:    { label: { fr: "Google", en: "Google" }, desc: { fr: "Apparaître dans les résultats de recherche et sur YouTube.", en: "Appear in search results and on YouTube." }, badge: "info", icon: Target, defaultCpc: 1.50, defaultCtr: 0.035 },
  linkedin:  { label: { fr: "LinkedIn", en: "LinkedIn" }, desc: { fr: "Toucher des professionnels et décideurs.", en: "Reach professionals and decision-makers." }, badge: "warning", icon: Users, defaultCpc: 5.00, defaultCtr: 0.008 },
  tiktok:    { label: { fr: "TikTok", en: "TikTok" }, desc: { fr: "Publicité vidéo courte pour un public jeune.", en: "Short video ads for a younger audience." }, badge: "success", icon: TrendUp, defaultCpc: 0.40, defaultCtr: 0.015 },
  seo:       { label: { fr: "Référencement naturel", en: "Organic search (SEO)" }, desc: { fr: "Être trouvé sur Google sans payer de pub.", en: "Be found on Google without paying for ads." }, badge: "gray", icon: TrendUp, defaultCpc: 0, defaultCtr: 0.05 },
};
var CHANNEL_KEYS = Object.keys(CHANNEL_META);

/* ── Fake data for paywall preview ── */
var FAKE_KPIS = [
  { label: "Budget mensuel", value: "2 450,00 €" },
  { label: "CAC", value: "18,50 €" },
  { label: "ROAS", value: "3.2x" },
  { label: "Leads / mois", value: "132" },
];

var FAKE_CHANNELS = [
  { id: "f1", channel: "meta", name: "Campagne Facebook Lead Gen", budget: 800, cpc: 0.65, clicks: 1230, conversions: 42 },
  { id: "f2", channel: "google", name: "Google Search Brand", budget: 1200, cpc: 1.80, clicks: 667, conversions: 58 },
  { id: "f3", channel: "linkedin", name: "LinkedIn B2B Decision Makers", budget: 450, cpc: 5.20, clicks: 87, conversions: 12 },
];

/* ── Fake preview component (shown behind paywall) ── */
function FakePreview({ lang }) {
  var lk = lang === "en" ? "en" : "fr";
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {FAKE_KPIS.map(function (kpi) {
          return <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} />;
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        {/* Fake donut */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-3)" }}>
            {lk === "fr" ? "Répartition du budget" : "Budget breakdown"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
            <svg width={80} height={80} viewBox="0 0 80 80" style={{ flexShrink: 0 }}>
              <circle cx={40} cy={40} r={30} fill="none" stroke="var(--brand)" strokeWidth={10} strokeDasharray="58 130" transform="rotate(-90 40 40)" />
              <circle cx={40} cy={40} r={30} fill="none" stroke="var(--color-info)" strokeWidth={10} strokeDasharray="45 143" strokeDashoffset={-58} transform="rotate(-90 40 40)" />
              <circle cx={40} cy={40} r={30} fill="none" stroke="var(--color-warning)" strokeWidth={10} strokeDasharray="28 160" strokeDashoffset={-103} transform="rotate(-90 40 40)" />
            </svg>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[{ l: "Meta Ads", p: "33%", c: "var(--brand)" }, { l: "Google Ads", p: "49%", c: "var(--color-info)" }, { l: "LinkedIn", p: "18%", c: "var(--color-warning)" }].map(function (r) {
                return (
                  <div key={r.l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.c, flexShrink: 0 }} />
                    <span style={{ color: "var(--text-secondary)", flex: 1 }}>{r.l}</span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{r.p}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* Fake bar chart */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-3)" }}>
            {lk === "fr" ? "Performance par canal" : "Channel performance"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
            {[{ l: "Meta", w: "65%", v: "ROAS 3.8x" }, { l: "Google", w: "85%", v: "ROAS 4.2x" }, { l: "LinkedIn", w: "35%", v: "ROAS 1.9x" }].map(function (b) {
              return (
                <div key={b.l}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
                    <span>{b.l}</span><span style={{ fontWeight: 600 }}>{b.v}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "var(--bg-hover)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: b.w, background: "var(--brand)", borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Fake table rows */}
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          <span>{lk === "fr" ? "Campagne" : "Campaign"}</span>
          <span style={{ textAlign: "right" }}>Budget</span>
          <span style={{ textAlign: "right" }}>CPC</span>
          <span style={{ textAlign: "right" }}>Clicks</span>
          <span style={{ textAlign: "right" }}>{lk === "fr" ? "Conversions" : "Conversions"}</span>
        </div>
        {FAKE_CHANNELS.map(function (ch) {
          var m = CHANNEL_META[ch.channel];
          return (
            <div key={ch.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "var(--sp-3) var(--sp-4)", borderBottom: "1px solid var(--border-light)", fontSize: 13 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                <span style={{ fontWeight: 500 }}>{ch.name}</span>
                {m ? <Badge color={m.badge} size="sm">{m.label[lk]}</Badge> : null}
              </div>
              <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{eur(ch.budget)}</span>
              <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{eur(ch.cpc)}</span>
              <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{String(ch.clicks)}</span>
              <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: "var(--brand)" }}>{String(ch.conversions)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Marketing Wizard (post-unlock) ── */
function MarketingWizard({ onFinish, lang }) {
  var lk = lang === "en" ? "en" : "fr";
  var [channels, setChannels] = useState({ meta: true, google: true });
  var [budget, setBudget] = useState(1000);

  var steps = [
    {
      key: "intro",
      content: (
        <div style={{ textAlign: "center" }}>
          <Megaphone size={56} weight="duotone" style={{ color: "var(--brand)", marginBottom: "var(--sp-4)" }} />
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-3)" }}>
            {lk === "fr" ? "Marketing & Acquisition" : "Marketing & Acquisition"}
          </div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "var(--sp-4)", textAlign: "left" }}>
            {lk === "fr"
              ? "Combien investir en publicité ? Sur quelles plateformes ? Et surtout, est-ce que ça rapporte ? Ce module vous aide à répondre à ces questions et intègre vos dépenses marketing directement dans votre plan financier."
              : "How much to invest in ads? On which platforms? And most importantly, is it paying off? This module helps answer these questions and integrates your marketing spend directly into your financial plan."}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--sp-3)", textAlign: "left" }}>
            {[
              { icon: Target, title: lk === "fr" ? "Où investir ?" : "Where to invest?", desc: lk === "fr" ? "Choisissez vos plateformes : Facebook, Google, LinkedIn, TikTok ou référencement." : "Pick your platforms: Facebook, Google, LinkedIn, TikTok or SEO." },
              { icon: TrendUp, title: lk === "fr" ? "Est-ce rentable ?" : "Is it profitable?", desc: lk === "fr" ? "Voyez combien chaque client vous coûte et ce qu'il rapporte." : "See how much each customer costs and what they bring in." },
              { icon: CurrencyCircleDollar, title: lk === "fr" ? "Tout est connecté" : "Everything connects", desc: lk === "fr" ? "Vos dépenses pub apparaissent automatiquement dans vos charges." : "Your ad spend automatically appears in your costs." },
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
    {
      key: "channels",
      content: (
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-2)", textAlign: "center" }}>
            {lk === "fr" ? "Quels canaux utilisez-vous ?" : "Which channels do you use?"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-4)", textAlign: "center" }}>
            {lk === "fr" ? "Sélectionnez vos canaux d'acquisition. Vous pourrez en ajouter d'autres ensuite." : "Select your acquisition channels. You can add more later."}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
            {CHANNEL_KEYS.map(function (ck) {
              var m = CHANNEL_META[ck];
              var isActive = channels[ck];
              return (
                <button key={ck} type="button" onClick={function () { setChannels(function (prev) { var nc = Object.assign({}, prev); nc[ck] = !nc[ck]; return nc; }); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "var(--sp-3)",
                    padding: "var(--sp-3) var(--sp-4)",
                    border: "2px solid " + (isActive ? "var(--brand)" : "var(--border-light)"),
                    borderRadius: "var(--r-lg)", background: isActive ? "var(--brand-bg)" : "var(--bg-accordion)",
                    cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.15s, background 0.15s",
                  }}>
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isActive ? "var(--brand)" : "var(--text-primary)" }}>{m.label[lk]}</div>
                    <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{m.desc[lk]}</div>
                  </div>
                  {isActive ? (
                    <div style={{ width: 20, height: 20, borderRadius: 5, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1.5 4.5L4 7L9.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  ) : (
                    <div style={{ width: 20, height: 20, borderRadius: 5, border: "1.5px solid var(--border-strong)", flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ),
      canAdvance: Object.keys(channels).some(function (k) { return channels[k]; }),
    },
    {
      key: "budget",
      content: (
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-2)", textAlign: "center" }}>
            {lk === "fr" ? "Quel est votre budget mensuel ?" : "What's your monthly budget?"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-5)", textAlign: "center" }}>
            {lk === "fr" ? "Le budget total sera réparti entre vos canaux. Vous pourrez ajuster ensuite." : "The total budget will be split across your channels. You can adjust later."}
          </div>
          <div style={{ maxWidth: 300, margin: "0 auto" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>
              {lk === "fr" ? "Budget marketing mensuel" : "Monthly marketing budget"}
            </label>
            <CurrencyInput value={budget} onChange={setBudget} suffix="€" width="100%" height={48} />
          </div>
          {budget > 0 ? (
            <div style={{ marginTop: "var(--sp-4)", padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", maxWidth: 300, margin: "var(--sp-4) auto 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: "var(--text-muted)" }}>{lk === "fr" ? "Budget annuel" : "Annual budget"}</span>
                <span style={{ fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{eur(budget * 12)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "var(--text-faint)" }}>{lk === "fr" ? "Ajouté automatiquement à vos charges" : "Automatically added to your costs"}</span>
              </div>
            </div>
          ) : null}
        </div>
      ),
      canAdvance: budget > 0,
    },
  ];

  function handleFinish() {
    var activeChannels = [];
    Object.keys(channels).forEach(function (k) { if (channels[k]) activeChannels.push(k); });
    onFinish({ channels: activeChannels, budget: budget });
  }

  return (
    <Wizard
      steps={steps}
      onFinish={handleFinish}
      finishLabel={lk === "fr" ? "Configurer le module" : "Set up module"}
      finishIcon={<Megaphone size={16} />}
      finishDisabled={budget <= 0}
    />
  );
}

/* ── Main Page ── */
export default function MarketingPage({ marketing, setMarketing, cfg, isPaid, isEnabled, onOpenModuleSettings }) {
  var t = useT();
  var { lang } = useLang();
  var lk = lang === "en" ? "en" : "fr";
  var modulePaid = isPaid === true;
  var moduleEnabled = isEnabled === true;

  function handleWizardFinish(data) {
    setMarketing(function (prev) {
      return Object.assign({}, prev, {
        showWizard: false,
        channels: data.channels,
        budget: data.budget,
        campaigns: [],
      });
    });
  }

  if (!modulePaid) {
    var features = lk === "fr"
      ? [
          "Gérez votre budget pub sur Facebook, Google, LinkedIn et TikTok",
          "Voyez combien vous coûte chaque nouveau client",
          "Comparez ce que vous dépensez à ce que ça vous rapporte",
          "Vos dépenses marketing sont ajoutées automatiquement à vos charges",
          "Guides pratiques pour Meta Business et Google Analytics",
          "Estimez combien de temps un client reste et ce qu'il rapporte",
        ]
      : [
          "Manage your ad budget on Facebook, Google, LinkedIn and TikTok",
          "See how much each new customer costs you",
          "Compare what you spend to what it brings in",
          "Your marketing spend is automatically added to your costs",
          "Practical guides for Meta Business and Google Analytics",
          "Estimate how long a customer stays and what they're worth",
        ];

    return (
      <PageLayout
        title={lk === "fr" ? "Marketing & Acquisition" : "Marketing & Acquisition"}
        subtitle={lk === "fr" ? "Planifiez et optimisez votre budget marketing par canal." : "Plan and optimize your marketing budget per channel."}
        icon={Megaphone} iconColor="#3B82F6"
      >
        <ModulePaywall
          preview={<FakePreview lang={lang} />}
          moduleId="marketing"
          icon={Megaphone}
          title={lk === "fr" ? "Marketing & Acquisition" : "Marketing & Acquisition"}
          subtitle={lk === "fr" ? "Planifiez combien vous investissez en publicité et voyez ce que ça vous rapporte concrètement." : "Plan how much you invest in advertising and see what it actually brings you."}
          features={features}
          ctaDisabled={true}
          ctaLabel={lk === "fr" ? "Plan Paid requis" : "Paid plan required"}
          price={lk === "fr" ? "Accès réservé aux comptes payants" : "Available to paid accounts only"}
        />
      </PageLayout>
    );
  }

  if (!moduleEnabled) {
    return (
      <PageLayout
        title={lk === "fr" ? "Marketing & Acquisition" : "Marketing & Acquisition"}
        subtitle={lk === "fr" ? "Le module est disponible sur votre compte, mais il n'est pas encore actif." : "This module is available on your account, but it is not active yet."}
        icon={Megaphone} iconColor="#3B82F6"
      >
        <Card sx={{ padding: "var(--sp-6)", textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
          <Megaphone size={56} weight="duotone" color="var(--brand)" style={{ marginBottom: "var(--sp-3)" }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-2)" }}>
            {lk === "fr" ? "Activez le module dans les paramètres" : "Enable the module in Settings"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "var(--sp-5)" }}>
            {lk === "fr"
              ? "Le module Marketing est bien associé à votre compte. Pour l'afficher dans la navigation et accéder à ses pages, activez-le depuis Paramètres > Modules."
              : "The Marketing module is available on your account. To show it in navigation and access its pages, enable it from Settings > Modules."}
          </div>
          <Button color="primary" size="lg" onClick={onOpenModuleSettings}>
            {lk === "fr" ? "Ouvrir Paramètres > Modules" : "Open Settings > Modules"}
          </Button>
        </Card>
      </PageLayout>
    );
  }

  if (marketing.showWizard) {
    return (
      <PageLayout
        title={lk === "fr" ? "Marketing & Acquisition" : "Marketing & Acquisition"}
        subtitle={lk === "fr" ? "Configurez votre module marketing." : "Set up your marketing module."}
        icon={Megaphone} iconColor="#3B82F6"
      >
        <MarketingWizard onFinish={handleWizardFinish} lang={lang} />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={lk === "fr" ? "Marketing & Acquisition" : "Marketing & Acquisition"}
      subtitle={lk === "fr" ? "Planifiez et optimisez votre budget marketing par canal." : "Plan and optimize your marketing budget per channel."}
      icon={Megaphone} iconColor="#3B82F6"
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={lk === "fr" ? "Budget mensuel" : "Monthly budget"} value={eurShort(marketing.budget || 0)} />
        <KpiCard label="CAC" value="—" />
        <KpiCard label="ROAS" value="—" />
        <KpiCard label={lk === "fr" ? "Canaux actifs" : "Active channels"} value={String((marketing.channels || []).length)} />
      </div>
      <Card sx={{ padding: "var(--sp-6)", textAlign: "center" }}>
        <Megaphone size={48} weight="duotone" color="var(--text-faint)" style={{ marginBottom: "var(--sp-3)" }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--sp-2)" }}>
          {lk === "fr" ? "Module en construction" : "Module under construction"}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
          {lk === "fr"
            ? "Le module Marketing sera complété dans une prochaine version. Vos paramètres sont sauvegardés."
            : "The Marketing module will be completed in an upcoming release. Your settings are saved."}
        </div>
      </Card>
    </PageLayout>
  );
}
