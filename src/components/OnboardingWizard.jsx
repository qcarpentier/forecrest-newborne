import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, ArrowLeft, ArrowBendDownLeft, Plus, Minus, Sparkle, RocketLaunch, Sun, Moon, Leaf, Buildings, Check, CloudArrowUp, ShoppingCart, Storefront, Briefcase, Shapes, CurrencyCircleDollar, Vault } from "@phosphor-icons/react";
import { useT, useLang } from "../context";
import { useTheme } from "../context";
import { COST_DEF, applyCostPreset } from "../constants/defaults";
import { APP_NAME } from "../constants/config";
import LangDropdown from "./LangDropdown";
import { eur, salCalc } from "../utils";
import NumberField from "./NumberField";
var logo = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 32"><rect width="32" height="32" rx="7" fill="#E8431A"/><text x="16" y="18" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-size="20" font-weight="800" font-family="system-ui,sans-serif">F</text><text x="44" y="22" fill="#101828" font-size="18" font-weight="800" font-family="system-ui,sans-serif" letter-spacing="-0.3">Forecrest</text></svg>');
var miloBusiness = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#E8431A"/><text x="16" y="18" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-size="20" font-weight="800" font-family="system-ui,sans-serif">F</text></svg>');
var miloSparkling = miloBusiness;

function totalMonthlyCosts(costs) {
  var t = 0;
  costs.forEach(function (c) {
    c.items.forEach(function (i) { t += i.pu ? i.a * (i.u || 1) : i.a; });
  });
  return t;
}

/* ── Keyboard badge ── */
function KBD({ children, variant }) {
  var isBrand = variant === "brand";
  return (
    <kbd style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      padding: "2px 5px", borderRadius: 4, fontSize: 10, fontWeight: 600,
      fontFamily: "inherit", lineHeight: 1.4, flexShrink: 0, letterSpacing: 0.2,
      background: isBrand ? "rgba(255,255,255,0.18)" : "var(--bg-hover)",
      border: isBrand ? "1px solid rgba(255,255,255,0.28)" : "1px solid var(--border-strong)",
      color: isBrand ? "rgba(255,255,255,0.82)" : "var(--text-faint)",
    }}>
      {children}
    </kbd>
  );
}

/* ── Progress indicator with check marks ── */
function ProgressDots({ current, total, completedSteps }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center" }}>
      {Array.from({ length: total }).map(function (_, i) {
        var done = completedSteps ? completedSteps[i] : i < current;
        var active = i === current;
        return (
          <div key={i} style={{
            width: active ? 28 : done ? 20 : 8,
            height: active ? 8 : done ? 20 : 8,
            borderRadius: done && !active ? 10 : 4,
            background: done || active ? "var(--brand)" : "var(--border-strong)",
            transition: "all 0.3s ease",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {done && !active ? <Check size={11} weight="bold" color="var(--color-on-brand)" /> : null}
          </div>
        );
      })}
    </div>
  );
}

/* ── Live summary bar with viability indicator ── */
function LiveSummary({ t, salaryTotal, opexTotal, estimatedARR }) {
  var total = salaryTotal + opexTotal;
  var annualCost = total * 12;
  var viableRatio = estimatedARR > 0 && annualCost > 0 ? estimatedARR / annualCost : 0;
  var viableColor = viableRatio >= 1.5 ? "var(--color-success)" : viableRatio >= 1 ? "var(--color-warning)" : "var(--color-error)";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "var(--gap-lg)", padding: "var(--sp-3) var(--sp-4)",
      background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)",
      fontSize: 12, color: "var(--text-secondary)", flexWrap: "wrap",
    }}>
      <div><span style={{ color: "var(--text-faint)" }}>{t.live_salaries}</span> <strong>{eur(salaryTotal)}</strong></div>
      <div><span style={{ color: "var(--text-faint)" }}>{t.live_opex}</span> <strong>{eur(opexTotal)}</strong></div>
      {estimatedARR > 0 ? (
        <div><span style={{ color: "var(--text-faint)" }}>{t.live_arr}</span> <strong style={{ color: "var(--brand)" }}>{eur(estimatedARR)}</strong></div>
      ) : null}
      {estimatedARR > 0 && total > 0 ? (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "2px 8px", borderRadius: "var(--r-xl)",
          background: viableColor === "var(--color-success)" ? "var(--color-success-bg)" : viableColor === "var(--color-warning)" ? "var(--color-warning-bg)" : "var(--color-error-bg)",
          border: "1px solid " + viableColor,
          fontSize: 11, fontWeight: 600, color: viableColor,
        }}>
          {viableRatio >= 1 ? <Check size={10} weight="bold" /> : null}
          {Math.round(viableRatio * 100) + "%"}
        </div>
      ) : null}
      <div style={{ marginLeft: "auto", fontWeight: 700, color: "var(--text-primary)", fontSize: 13 }}>
        {t.live_total} {eur(total)}<span style={{ fontWeight: 400, color: "var(--text-faint)" }}>{t.per_month}</span>
        <span style={{ marginLeft: 8, fontWeight: 400, color: "var(--text-faint)" }}>({eur(total * 12)}{t.live_annual})</span>
      </div>
    </div>
  );
}

/* ── Step 0: Welcome ── */
function StepWelcome({ t, onStart, onSkip }) {
  var features = [
    { icon: "1", label: t.feature_company },
    { icon: "2", label: t.feature_biz },
    { icon: "3", label: t.feature_revenue },
    { icon: "4", label: t.feature_treasury },
    { icon: "5", label: t.feature_team },
    { icon: "6", label: t.feature_costs },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-8)", padding: "var(--sp-6) 0" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: "var(--sp-5)" }}>
          <Sparkle size={36} weight="fill" color="var(--brand)" />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 var(--sp-3)", lineHeight: 1.2 }}>{t.welcome_title}</h2>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 var(--sp-6)", lineHeight: 1.6 }}>{t.welcome_sub}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)", marginBottom: "var(--sp-8)" }}>
          {features.map(function (f) {
            return (
              <div key={f.icon} style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
                <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--brand-bg)", color: "var(--brand)", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{f.icon}</span>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{f.label}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "var(--sp-3)" }}>
          <button onClick={onStart} style={{
            padding: "10px 32px", fontSize: 15, fontWeight: 600, borderRadius: "var(--r-md)",
            border: "none", background: "var(--brand)", color: "var(--color-on-brand)", cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: "var(--sp-2)",
          }}>
            {t.start} <ArrowRight size={16} weight="bold" /> <KBD variant="brand"><ArrowBendDownLeft size={11} weight="bold" /></KBD>
          </button>
          <button onClick={onSkip} style={{
            padding: 0, fontSize: 13, fontWeight: 400,
            border: "none", background: "none", color: "var(--text-faint)",
            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>{t.skip_all}</span>
            <KBD>Esc</KBD>
          </button>
          {t.import_hint ? (
            <p style={{ fontSize: 11, color: "var(--text-faint)", margin: 0, maxWidth: 300, lineHeight: 1.5 }}>
              {t.import_hint}
            </p>
          ) : null}
        </div>
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <img src={miloBusiness} alt="Milo" style={{ height: 260, width: "auto", display: "block" }} />
      </div>
    </div>
  );
}

/* ── Step Done ── */
function StepDone({ t, salaryTotal, opexTotal, pipelineCount, estimatedARR, activeTeamCount, onFinish, onBack }) {
  var [mounted, setMounted] = useState(false);
  useEffect(function () {
    var id = setTimeout(function () { setMounted(true); }, 40);
    return function () { clearTimeout(id); };
  }, []);

  var totalMonthly = salaryTotal + opexTotal;
  var title = t.done_title;
  var stats = [
    { label: "ARR", value: eur(estimatedARR), color: "var(--brand)" },
    { label: t.done_monthly_costs, value: eur(totalMonthly) + t.per_month },
    { label: t.team_title, value: String(activeTeamCount) },
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-8)", padding: "var(--sp-6) 0" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: "var(--sp-5)" }}>
          <RocketLaunch size={36} weight="fill" color="var(--brand)" />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 var(--sp-3)", lineHeight: 1.2 }}>{title}</h2>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 var(--sp-4)", lineHeight: 1.6 }}>{t.done_sub}</p>
        {t.done_preview_title ? (
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-3)" }}>{t.done_preview_title}</div>
        ) : null}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--sp-8)" }}>
          {stats.map(function (k, i) {
            return (
              <div key={k.label} style={{
                padding: "var(--sp-3) var(--sp-4)",
                background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(10px)",
                transition: "opacity 0.35s ease " + (i * 0.08) + "s, transform 0.35s ease " + (i * 0.08) + "s",
              }}>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: "var(--sp-1)" }}>{k.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: k.color || "var(--text-primary)" }}>{k.value}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
          <button onClick={onBack} style={{
            padding: "10px 32px", fontSize: 15, fontWeight: 600, borderRadius: "var(--r-md)",
            border: "1px solid var(--border-strong)", background: "transparent",
            color: "var(--text-secondary)", cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: "var(--sp-2)",
          }}>
            <ArrowLeft size={16} weight="bold" /> {t.back} <KBD>Esc</KBD>
          </button>
          <button onClick={onFinish} style={{
            padding: "10px 32px", fontSize: 15, fontWeight: 600, borderRadius: "var(--r-md)",
            border: "none", background: "var(--brand)", color: "var(--color-on-brand)", cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: "var(--sp-2)",
          }}>
            {t.done_go} <ArrowRight size={16} weight="bold" /> <KBD variant="brand"><ArrowBendDownLeft size={11} weight="bold" /></KBD>
          </button>
        </div>
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <img src={miloSparkling} alt="Milo" style={{ height: 260, width: "auto", display: "block" }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════ */
/*  Main wizard                                  */
/* ══════════════════════════════════════════════ */
var STEP_COUNT = 8;
// 0: Welcome | 1: Company Info | 2: BusinessType | 3: Revenue | 4: Treasury/Capital | 5: Team | 6: Costs | 7: Done

var BIZ_ICONS = {
  saas: CloudArrowUp,
  ecommerce: ShoppingCart,
  retail: Storefront,
  services: Briefcase,
  other: Shapes,
};

/* ── Revenue suggestions by business type ── */
var BIZ_REVENUE_SUGGESTIONS = {
  saas: [
    { l: "Abonnement mensuel", pcmn: "7020", sub: "Abonnements" },
    { l: "Licence annuelle", pcmn: "7020", sub: "Licences" },
    { l: "Services / consulting", pcmn: "7020", sub: "Services" },
  ],
  ecommerce: [
    { l: "Vente de produits", pcmn: "7010", sub: "E-commerce" },
    { l: "Commissions marketplace", pcmn: "7030", sub: "Commissions" },
    { l: "Publicité / sponsoring", pcmn: "7500", sub: "Publicité" },
  ],
  retail: [
    { l: "Vente de marchandises", pcmn: "7010", sub: "E-commerce" },
    { l: "Services additionnels", pcmn: "7020", sub: "Services" },
  ],
  services: [
    { l: "Consulting / formation", pcmn: "7020", sub: "Consulting" },
    { l: "Vente de services", pcmn: "7020", sub: "Services" },
    { l: "Licence logiciel", pcmn: "7020", sub: "Licences" },
  ],
  other: [
    { l: "Vente de services", pcmn: "7020", sub: "Services" },
    { l: "Vente de produits", pcmn: "7010", sub: "E-commerce" },
    { l: "Commissions", pcmn: "7030", sub: "Commissions" },
  ],
};

export default function OnboardingWizard({ sals, costs, cfg, streams, setSals, setCosts, setCfg, setStreams, onComplete }) {
  var t = useT().onboarding;
  var { lang, toggleLang } = useLang();
  var { dark, toggle } = useTheme();
  var [step, setStep] = useState(0);
  var [visible, setVisible] = useState(true);

  /* Local copies — only applied on Finish */
  var [localSals, setLocalSals] = useState(JSON.parse(JSON.stringify(sals)));
  var [localCosts, setLocalCosts] = useState(JSON.parse(JSON.stringify(costs)));
  var [costPreset, setCostPreset] = useState(null);
  var [selected, setSelected] = useState({});
  var [localCfg, setLocalCfg] = useState({ ...cfg });
  var [localStreams, setLocalStreams] = useState(JSON.parse(JSON.stringify(streams)));

  /* Auto-populate revenue streams when business type changes */
  var [lastBizType, setLastBizType] = useState(localCfg.businessType || "saas");
  useEffect(function () {
    var biz = localCfg.businessType || "saas";
    if (biz === lastBizType) return;
    setLastBizType(biz);
    var suggestions = BIZ_REVENUE_SUGGESTIONS[biz] || BIZ_REVENUE_SUGGESTIONS.other;
    var items = suggestions.map(function (s, i) {
      return { id: "r_" + Date.now() + "_" + i, l: s.l, y1: 0, pcmn: s.pcmn, sub: s.sub };
    });
    setLocalStreams([{ cat: "Chiffre d'affaires", pcmn: "70", items: items }]);
  }, [localCfg.businessType]);

  /* Track which steps were interacted with */
  var [completedSteps, setCompletedSteps] = useState({});

  /* Stagger animation state */
  var [staggerMounted, setStaggerMounted] = useState(false);
  useEffect(function () {
    setStaggerMounted(false);
    var id = setTimeout(function () { setStaggerMounted(true); }, 60);
    return function () { clearTimeout(id); };
  }, [step]);

  useEffect(function () {
    document.documentElement.style.overflowY = "hidden";
    return function () { document.documentElement.style.overflowY = ""; };
  }, []);

  function markStepCompleted(idx) {
    setCompletedSteps(function (prev) {
      var next = { ...prev };
      next[idx] = true;
      return next;
    });
  }

  function goTo(newStep) {
    /* Mark current middle step as completed when leaving it */
    if (step >= 1 && step <= STEP_COUNT - 2) {
      markStepCompleted(step - 1);
    }
    setVisible(false);
    setTimeout(function () {
      setStep(newStep);
      setVisible(true);
    }, 180);
  }
  function next() { goTo(Math.min(step + 1, STEP_COUNT - 1)); }
  function back() { goTo(Math.max(step - 1, 0)); }

  /* ── Keyboard navigation ── */
  var actionRef = useRef(null);
  actionRef.current = { step, costPreset, next, back, finish: null, onComplete };

  useEffect(function () {
    function handleKey(e) {
      var tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      var a = actionRef.current;
      var key = e.key;
      if (a.step === 0) {
        if (key === "Enter") { e.preventDefault(); a.next(); }
        if (key === "Escape") { e.preventDefault(); a.onComplete(); }
      } else if (a.step === 1) {
        // Company info — Enter/Escape navigation
        if (key === "Enter") { e.preventDefault(); a.next(); }
        if (key === "Escape" || key === "ArrowLeft") { e.preventDefault(); a.back(); }
      } else if (a.step === 2) {
        // Business type — number keys
        if (key >= "1" && key <= "5") {
          e.preventDefault();
          var types = ["saas", "ecommerce", "retail", "services", "other"];
          setLocalCfg(function (prev) { return { ...prev, businessType: types[Number(key) - 1] }; });
        }
        if (key === "Enter") { e.preventDefault(); a.next(); }
        if (key === "Escape" || key === "ArrowLeft") { e.preventDefault(); a.back(); }
      } else if (a.step === 3) {
        // Revenue
        if (key === "Enter") { e.preventDefault(); a.next(); }
        if (key === "Escape" || key === "ArrowLeft") { e.preventDefault(); a.back(); }
      } else if (a.step === 4) {
        // Treasury/Capital
        if (key === "Enter") { e.preventDefault(); a.next(); }
        if (key === "Escape" || key === "ArrowLeft") { e.preventDefault(); a.back(); }
      } else if (a.step === 5) {
        // Team
        if (key === "Enter") { e.preventDefault(); a.next(); }
        if (key === "Escape" || key === "ArrowLeft") { e.preventDefault(); a.back(); }
      } else if (a.step === 6) {
        // Costs presets
        if (key === "1") { e.preventDefault(); setCostPreset("bootstrap"); setLocalCosts(applyCostPreset("bootstrap")); }
        if (key === "2") { e.preventDefault(); setCostPreset("standard"); setLocalCosts(applyCostPreset("standard")); }
        if (key === "3") { e.preventDefault(); setCostPreset("scaleup"); setLocalCosts(applyCostPreset("scaleup")); }
        if (key === "Enter" && a.costPreset) { e.preventDefault(); a.next(); }
        if (key === "Escape" || key === "ArrowLeft") { e.preventDefault(); a.back(); }
      } else if (a.step === 7) {
        if (key === "Enter") { e.preventDefault(); a.finish && a.finish(); }
        if (key === "Escape" || key === "ArrowLeft") { e.preventDefault(); a.back(); }
      }
    }
    document.addEventListener("keydown", handleKey);
    return function () { document.removeEventListener("keydown", handleKey); };
  }, []);

  function finish() {
    setSals(localSals);
    setCosts(localCosts);
    setCfg(localCfg);
    setStreams(localStreams);
    onComplete();
  }
  actionRef.current.finish = finish;

  /* ── Computed values ── */
  var salaryTotal = useMemo(function () {
    var total = 0;
    localSals.forEach(function (s) {
      if (s.net > 0) {
        var eO = s.type === "student" ? 0.0271 : cfg.onss;
        var eP = s.type === "student" ? 0 : cfg.patr;
        total += salCalc(s.net, eO, cfg.prec, eP).total;
      }
    });
    return total;
  }, [localSals, cfg]);

  var opexTotal = useMemo(function () {
    return totalMonthlyCosts(localCosts);
  }, [localCosts]);

  var pipelineCount = useMemo(function () {
    var n = 0;
    Object.keys(selected).forEach(function (k) { n += selected[k]; });
    return n;
  }, [selected]);

  var estimatedARR = useMemo(function () {
    var total = 0;
    localStreams.forEach(function (cat) {
      (cat.items || []).forEach(function (item) {
        total += (item.y1 || 0);
      });
    });
    return total;
  }, [localStreams]);

  var activeTeamCount = useMemo(function () {
    return localSals.filter(function (s) { return s.net > 0; }).length;
  }, [localSals]);

  var nextDisabled = step === 6 && !costPreset;

  /* ── Step content renderers ── */
  var content;

  if (step === 0) {
    content = <StepWelcome t={t} onStart={next} onSkip={onComplete} />;
  }

  if (step === 1) {
    /* Company info */
    var inputStyle = {
      width: "100%", height: 38, padding: "0 var(--sp-3)",
      border: "1px solid var(--border)", borderRadius: "var(--r-md)",
      background: "var(--input-bg)", color: "var(--text-primary)",
      fontSize: 13, fontFamily: "inherit", outline: "none",
    };
    content = (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 var(--sp-2)" }}>{t.company_title || "Votre entreprise"}</h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 var(--sp-6)" }}>{t.company_sub || "Informations de base pour personnaliser votre simulation."}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3) var(--sp-4)" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>{t.company_name || "Nom de l'entreprise"}</label>
            <input value={localCfg.companyName || ""} onChange={function (e) { setLocalCfg(function (p) { return { ...p, companyName: e.target.value }; }); }} placeholder="Forecrest SRL" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>{t.company_first || "Pr\u00e9nom"}</label>
            <input value={localCfg.firstName || ""} onChange={function (e) { setLocalCfg(function (p) { return { ...p, firstName: e.target.value }; }); }} placeholder="John" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>{t.company_last || "Nom"}</label>
            <input value={localCfg.lastName || ""} onChange={function (e) { setLocalCfg(function (p) { return { ...p, lastName: e.target.value }; }); }} placeholder="Doe" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>{t.company_email || "Email"}</label>
            <input value={localCfg.email || ""} onChange={function (e) { setLocalCfg(function (p) { return { ...p, email: e.target.value }; }); }} placeholder="contact@example.com" type="email" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: "var(--sp-1)" }}>{t.company_role || "Fonction"}</label>
            <input value={localCfg.userRole || ""} onChange={function (e) { setLocalCfg(function (p) { return { ...p, userRole: e.target.value }; }); }} placeholder="CEO / Fondateur" style={inputStyle} />
          </div>
        </div>
        <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: "var(--sp-4)", lineHeight: 1.5 }}>
          {t.company_note || "Ces informations sont optionnelles et modifiables \u00e0 tout moment dans votre profil."}
        </p>
      </div>
    );
  }

  if (step === 2) {
    /* Business type selection */
    var bizTypes = [
      { id: "saas", kbdKey: "1" },
      { id: "ecommerce", kbdKey: "2" },
      { id: "retail", kbdKey: "3" },
      { id: "services", kbdKey: "4" },
      { id: "other", kbdKey: "5" },
    ];
    content = (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 var(--sp-2)" }}>{t.biz_title}</h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 var(--sp-6)" }}>{t.biz_sub}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--gap-md)" }}>
          {bizTypes.map(function (bt, bi) {
            var active = localCfg.businessType === bt.id;
            var IconComp = BIZ_ICONS[bt.id] || Shapes;
            return (
              <button
                key={bt.id}
                onClick={function () { setLocalCfg(function (prev) { return { ...prev, businessType: bt.id }; }); }}
                style={{
                  padding: "var(--sp-4)", textAlign: "left", width: "100%",
                  display: "flex", flexDirection: "column", gap: "var(--sp-3)",
                  background: active ? "var(--brand-bg)" : "var(--bg-card)",
                  border: active ? "2px solid var(--brand)" : "1px solid var(--border)",
                  borderRadius: "var(--r-lg)", cursor: "pointer", transition: "all 0.15s",
                  opacity: staggerMounted ? 1 : 0,
                  transform: staggerMounted ? "translateY(0)" : "translateY(12px)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "var(--r-md)", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: active ? "var(--brand)" : "var(--bg-hover)",
                    transition: "background 0.15s",
                  }}>
                    <IconComp size={18} weight={active ? "fill" : "regular"} color={active ? "var(--color-on-brand)" : "var(--text-secondary)"} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <KBD>{bt.kbdKey}</KBD>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                      border: active ? "5px solid var(--brand)" : "2px solid var(--border-strong)",
                      background: "var(--bg-card)", transition: "border 0.15s",
                      boxSizing: "border-box",
                    }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: "var(--sp-1)", color: active ? "var(--brand)" : "var(--text-primary)" }}>
                    {t["biz_" + bt.id]}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-faint)", lineHeight: 1.5 }}>{t["biz_" + bt.id + "_desc"]}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (step === 3) {
    /* Revenue streams based on business type */
    var bizType = localCfg.businessType || "saas";
    var suggestions = BIZ_REVENUE_SUGGESTIONS[bizType] || BIZ_REVENUE_SUGGESTIONS.other;

    content = (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 var(--sp-2)" }}>{t.rev_title || "Sources de revenus"}</h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 var(--sp-6)" }}>{t.rev_sub || "Estimez vos revenus annuels par source. Vous pourrez affiner ces chiffres plus tard."}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
          {localStreams.map(function (cat, ci) {
            return (cat.items || []).map(function (item, ii) {
              return (
                <div key={item.id} style={{
                  padding: "var(--sp-3) var(--sp-4)", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)",
                  display: "flex", alignItems: "center", gap: "var(--sp-3)",
                  opacity: staggerMounted ? 1 : 0,
                  transform: staggerMounted ? "translateY(0)" : "translateY(12px)",
                  transition: "opacity 0.3s ease " + (ii * 0.05) + "s, transform 0.3s ease " + (ii * 0.05) + "s",
                }}>
                  <CurrencyCircleDollar size={18} weight="duotone" color="var(--brand)" style={{ flexShrink: 0 }} />
                  <input
                    value={item.l}
                    onChange={function (e) {
                      var val = e.target.value;
                      setLocalStreams(function (prev) {
                        var n = JSON.parse(JSON.stringify(prev));
                        n[ci].items[ii].l = val;
                        return n;
                      });
                    }}
                    style={{ flex: 1, fontSize: 14, fontWeight: 600, border: "none", outline: "none", background: "transparent", color: "var(--text-primary)", minWidth: 0 }}
                    placeholder={t.rev_name_placeholder || "Nom du revenu"}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-1)" }}>
                    <input
                      type="number"
                      value={item.y1 || ""}
                      onChange={function (e) {
                        var val = Number(e.target.value) || 0;
                        setLocalStreams(function (prev) {
                          var n = JSON.parse(JSON.stringify(prev));
                          n[ci].items[ii].y1 = val;
                          return n;
                        });
                      }}
                      placeholder="0"
                      style={{ width: 100, height: 34, padding: "0 var(--sp-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 13, fontFamily: "inherit", outline: "none", textAlign: "right" }}
                    />
                    <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{t.rev_per_year || "/an"}</span>
                  </div>
                  {(cat.items.length > 1 || localStreams.reduce(function (a, c) { return a + c.items.length; }, 0) > 1) ? (
                    <button
                      onClick={function () {
                        setLocalStreams(function (prev) {
                          var n = JSON.parse(JSON.stringify(prev));
                          n[ci].items = n[ci].items.filter(function (_, j) { return j !== ii; });
                          if (n[ci].items.length === 0) n = n.filter(function (_, j) { return j !== ci; });
                          return n;
                        });
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", flexShrink: 0 }}
                    >
                      <Minus size={14} color="var(--text-faint)" />
                    </button>
                  ) : null}
                </div>
              );
            });
          })}
        </div>

        {/* Suggestions based on business type */}
        <div style={{ marginTop: "var(--sp-4)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-2)" }}>{t.rev_suggestions || "Suggestions"}</div>
          <div style={{ display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" }}>
            {suggestions.map(function (s) {
              var alreadyAdded = false;
              localStreams.forEach(function (cat) {
                (cat.items || []).forEach(function (it) { if (it.l === s.l) alreadyAdded = true; });
              });
              if (alreadyAdded) return null;
              return (
                <button
                  key={s.l}
                  onClick={function () {
                    setLocalStreams(function (prev) {
                      var n = JSON.parse(JSON.stringify(prev));
                      var target = n[0] || { cat: "Chiffre d'affaires", pcmn: "70", items: [] };
                      if (!n.length) n.push(target);
                      target.items.push({ id: "r_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6), l: s.l, y1: 0, y2: 0, y3: 0, type: s.type, pcmn: s.pcmn, sub: s.sub });
                      return n;
                    });
                  }}
                  style={{
                    padding: "4px 12px", borderRadius: "var(--r-full)",
                    border: "1px dashed var(--border)", background: "none",
                    color: "var(--brand)", fontSize: 12, fontWeight: 500,
                    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4,
                  }}
                >
                  <Plus size={12} /> {s.l}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add custom line */}
        <button
          onClick={function () {
            setLocalStreams(function (prev) {
              var n = JSON.parse(JSON.stringify(prev));
              var target = n[0] || { cat: "Chiffre d'affaires", pcmn: "70", items: [] };
              if (!n.length) n.push(target);
              target.items.push({ id: "r_" + Date.now(), l: "", y1: 0, y2: 0, y3: 0, type: "recurring", pcmn: "7020", sub: "" });
              return n;
            });
          }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginTop: "var(--sp-3)",
            border: "1px dashed var(--border)", borderRadius: "var(--r-md)",
            background: "none", color: "var(--brand)", fontSize: 13, fontWeight: 500,
            cursor: "pointer", padding: "var(--sp-2) var(--sp-4)",
          }}
        >
          <Plus size={14} /> {t.rev_add || "Ajouter une source"}
        </button>

        {estimatedARR > 0 ? (
          <div style={{ marginTop: "var(--sp-4)", padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>{t.rev_total || "Revenu annuel estimé"}</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--brand)" }}>{eur(estimatedARR)}</span>
          </div>
        ) : null}
      </div>
    );
  }

  if (step === 4) {
    /* Treasury & Capital */
    var fieldStyle = {
      width: "100%", height: 42, padding: "0 var(--sp-3)",
      border: "1px solid var(--border)", borderRadius: "var(--r-md)",
      background: "var(--input-bg)", color: "var(--text-primary)",
      fontSize: 15, fontWeight: 600, fontFamily: "inherit", outline: "none",
      textAlign: "right",
    };
    content = (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 var(--sp-2)" }}>{t.treasury_title || "Tr\u00e9sorerie et capital"}</h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 var(--sp-6)", lineHeight: 1.6 }}>{t.treasury_sub || "Ces montants sont essentiels pour calculer votre runway et vos ratios de solvabilit\u00e9."}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
          {/* Initial cash */}
          <div style={{
            padding: "var(--sp-5)", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)",
            opacity: staggerMounted ? 1 : 0,
            transform: staggerMounted ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.3s ease 0s, transform 0.3s ease 0s",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--sp-4)" }}>
              <div style={{
                width: 42, height: 42, borderRadius: "var(--r-md)", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)",
              }}>
                <Vault size={20} weight="duotone" color="var(--color-success)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: "var(--sp-1)" }}>{t.treasury_cash_label || "Tr\u00e9sorerie initiale"}</div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 var(--sp-3)", lineHeight: 1.5 }}>
                  {t.treasury_cash_desc || "Montant disponible en banque au d\u00e9marrage de l'activit\u00e9. Inclut les apports en compte courant, les premi\u00e8res rentr\u00e9es, et tout cash imm\u00e9diatement disponible."}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                  <input
                    type="number" min={0} step={1000}
                    value={localCfg.initialCash || ""}
                    onChange={function (e) { setLocalCfg(function (p) { return { ...p, initialCash: Number(e.target.value) || 0 }; }); }}
                    placeholder="0"
                    style={fieldStyle}
                  />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)", flexShrink: 0 }}>EUR</span>
                </div>
              </div>
            </div>
          </div>

          {/* Capital social */}
          <div style={{
            padding: "var(--sp-5)", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)",
            opacity: staggerMounted ? 1 : 0,
            transform: staggerMounted ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.3s ease 0.08s, transform 0.3s ease 0.08s",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--sp-4)" }}>
              <div style={{
                width: 42, height: 42, borderRadius: "var(--r-md)", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "var(--brand-bg)", border: "1px solid var(--brand)",
              }}>
                <Buildings size={20} weight="duotone" color="var(--brand)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: "var(--sp-1)" }}>{t.treasury_capital_label || "Capital social"}</div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 var(--sp-3)", lineHeight: 1.5 }}>
                  {t.treasury_capital_desc || "Montant inscrit aux statuts de la soci\u00e9t\u00e9. En Belgique, il n'y a plus de minimum l\u00e9gal pour les SRL depuis 2019, mais un capital suffisant renforce la cr\u00e9dibilit\u00e9 aupr\u00e8s des banques et investisseurs."}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                  <input
                    type="number" min={0} step={1000}
                    value={localCfg.capitalSocial || ""}
                    onChange={function (e) { setLocalCfg(function (p) { return { ...p, capitalSocial: Number(e.target.value) || 0 }; }); }}
                    placeholder="0"
                    style={fieldStyle}
                  />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)", flexShrink: 0 }}>EUR</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: "var(--sp-4)", lineHeight: 1.5 }}>
          {t.treasury_note || "Ces valeurs sont modifiables \u00e0 tout moment dans l'onglet Profil entreprise."}
        </p>
      </div>
    );
  }

  if (step === 5) {
    /* Team & salaries — editable roles, types, add/remove */
    var TYPE_OPTS = [
      { value: "employee", label: t.type_employee || "Employ\u00e9(e)" },
      { value: "student", label: t.type_student || "\u00c9tudiant(e)" },
      { value: "intern", label: t.type_intern || "Stagiaire" },
      { value: "director", label: t.type_director || "Administrateur" },
    ];
    content = (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 var(--sp-2)" }}>{t.team_title}</h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 var(--sp-6)" }}>{t.team_sub}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
          {localSals.map(function (s, i) {
            var employerCost = 0;
            if (s.net > 0) {
              var eO = s.type === "student" ? 0.0271 : cfg.onss;
              var eP = s.type === "student" ? 0 : cfg.patr;
              employerCost = salCalc(s.net, eO, cfg.prec, eP).total;
            }
            return (
              <div key={s.id || i} style={{
                padding: "var(--sp-4)", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)",
                opacity: staggerMounted ? 1 : 0,
                transform: staggerMounted ? "translateY(0)" : "translateY(12px)",
                transition: "opacity 0.3s ease " + (i * 0.05) + "s, transform 0.3s ease " + (i * 0.05) + "s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-3)" }}>
                  <input
                    value={s.role}
                    onChange={function (e) {
                      setLocalSals(function (prev) { var next = prev.slice(); next[i] = { ...next[i], role: e.target.value }; return next; });
                    }}
                    style={{ flex: 1, fontSize: 14, fontWeight: 600, border: "none", outline: "none", background: "transparent", color: "var(--text-primary)", minWidth: 0 }}
                    placeholder={t.team_role_placeholder || "Nom du r\u00f4le"}
                  />
                  <select
                    value={s.type || "employee"}
                    onChange={function (e) {
                      setLocalSals(function (prev) { var next = prev.slice(); next[i] = { ...next[i], type: e.target.value }; return next; });
                    }}
                    style={{ fontSize: 12, border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "4px 8px", background: "var(--input-bg)", color: "var(--text-secondary)", cursor: "pointer" }}
                  >
                    {TYPE_OPTS.map(function (o) { return <option key={o.value} value={o.value}>{o.label}</option>; })}
                  </select>
                  <NumberField
                    value={s.net}
                    onChange={function (v) {
                      setLocalSals(function (prev) { var next = prev.slice(); next[i] = { ...next[i], net: v }; return next; });
                    }}
                    min={0} max={10000} step={250}
                    width="90px" suf={t.team_net}
                  />
                  {localSals.length > 1 ? (
                    <button
                      onClick={function () {
                        setLocalSals(function (prev) { return prev.filter(function (_, j) { return j !== i; }); });
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", flexShrink: 0 }}
                    >
                      <Minus size={14} color="var(--text-faint)" />
                    </button>
                  ) : null}
                </div>
                <input
                  type="range" min={0} max={10000} step={250}
                  value={s.net}
                  onChange={function (e) {
                    var v = Number(e.target.value);
                    setLocalSals(function (prev) { var next = prev.slice(); next[i] = { ...next[i], net: v }; return next; });
                  }}
                  style={{ width: "100%", accentColor: "var(--brand)", cursor: "pointer", height: 6 }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--sp-1)" }}>
                  <span style={{ fontSize: 11, color: "var(--text-faint)" }}>0</span>
                  {s.net > 0 ? (
                    <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{t.team_employer}: {eur(employerCost)}{t.per_month}</span>
                  ) : null}
                  <span style={{ fontSize: 11, color: "var(--text-faint)" }}>10 000</span>
                </div>
              </div>
            );
          })}
        </div>
        <button
          onClick={function () {
            setLocalSals(function (prev) {
              return prev.concat([{ id: Date.now(), role: t.team_new_role || "Nouveau r\u00f4le", net: 0, vari: false, type: "employee" }]);
            });
          }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginTop: "var(--sp-3)",
            border: "1px dashed var(--border)", borderRadius: "var(--r-md)",
            background: "none", color: "var(--brand)", fontSize: 13, fontWeight: 500,
            cursor: "pointer", padding: "var(--sp-2) var(--sp-4)",
          }}
        >
          <Plus size={14} /> {t.team_add || "Ajouter un r\u00f4le"}
        </button>
      </div>
    );
  }

  if (step === 6) {
    /* Operating costs presets */
    var presets = [
      { key: "bootstrap", label: t.costs_bootstrap, desc: t.costs_bootstrap_desc, Icon: Leaf, kbdKey: "1" },
      { key: "standard", label: t.costs_standard, desc: t.costs_standard_desc, Icon: Buildings, kbdKey: "2" },
      { key: "scaleup", label: t.costs_scaleup, desc: t.costs_scaleup_desc, Icon: RocketLaunch, kbdKey: "3" },
    ];
    content = (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 var(--sp-2)" }}>{t.costs_title}</h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 var(--sp-6)" }}>{t.costs_sub}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--gap-md)" }}>
          {presets.map(function (p, pi) {
            var active = costPreset === p.key;
            var presetCosts = applyCostPreset(p.key);
            var presetTotal = totalMonthlyCosts(presetCosts);
            return (
              <button
                key={p.key}
                onClick={function () { setCostPreset(p.key); setLocalCosts(presetCosts); }}
                style={{
                  padding: "var(--sp-4)", textAlign: "left", width: "100%",
                  display: "flex", flexDirection: "column", gap: "var(--sp-4)",
                  background: active ? "var(--brand-bg)" : "var(--bg-card)",
                  border: active ? "2px solid var(--brand)" : "1px solid var(--border)",
                  borderRadius: "var(--r-lg)", cursor: "pointer", transition: "all 0.15s",
                  opacity: staggerMounted ? 1 : 0,
                  transform: staggerMounted ? "translateY(0)" : "translateY(12px)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "var(--r-md)", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: active ? "var(--brand)" : "var(--bg-hover)",
                    transition: "background 0.15s",
                  }}>
                    <p.Icon size={18} weight={active ? "fill" : "regular"} color={active ? "var(--color-on-brand)" : "var(--text-secondary)"} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <KBD>{p.kbdKey}</KBD>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                      border: active ? "5px solid var(--brand)" : "2px solid var(--border-strong)",
                      background: "var(--bg-card)", transition: "border 0.15s",
                      boxSizing: "border-box",
                    }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: "var(--sp-1)", color: active ? "var(--brand)" : "var(--text-primary)" }}>
                    {p.label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginBottom: "var(--sp-2)", color: active ? "var(--brand)" : "var(--text-primary)" }}>
                    {eur(presetTotal)}<span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-faint)" }}>/mo</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-faint)", lineHeight: 1.5 }}>{p.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
        {costPreset ? (
          <div style={{ marginTop: "var(--sp-5)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-3)" }}>{t.costs_breakdown}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--sp-2)" }}>
              {localCosts.map(function (cat) {
                var catTotal = 0;
                cat.items.forEach(function (i) { catTotal += i.pu ? i.a * (i.u || 1) : i.a; });
                return (
                  <div key={cat.cat} style={{ display: "flex", justifyContent: "space-between", padding: "var(--sp-2) var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-sm)", fontSize: 12 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{cat.cat}</span>
                    <span style={{ fontWeight: 600 }}>{eur(catTotal)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (step === 7) {
    content = (
      <StepDone
        t={t}
        salaryTotal={salaryTotal}
        opexTotal={opexTotal}
        pipelineCount={pipelineCount}
        estimatedARR={estimatedARR}
        activeTeamCount={activeTeamCount}
        onFinish={finish}
        onBack={back}
      />
    );
  }

  /* Inner step index for progress (steps 1-4 = indices 0-3) */
  var innerStepCount = STEP_COUNT - 2; /* 5 middle steps */
  var innerCurrent = step >= 1 && step <= STEP_COUNT - 2 ? step - 1 : -1;

  /* ── Shell ── */
  return createPortal(
    <div style={{
      position: "fixed", inset: 0, background: "var(--bg-page)", zIndex: 100,
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{
          maxWidth: "var(--page-max)", margin: "0 auto", padding: "0 var(--page-px)",
          height: 58, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <img src={logo} alt={APP_NAME} style={{ height: 30 }} />
          {innerCurrent >= 0 ? (
            <ProgressDots current={innerCurrent} total={innerStepCount} completedSteps={completedSteps} />
          ) : <div />}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
            {innerCurrent >= 0 ? (
              <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
                {t.step_of(step, innerStepCount)}
              </span>
            ) : null}
            <LangDropdown lang={lang} toggleLang={toggleLang} />
            <button
              onClick={function (e) { toggle(e.clientX, e.clientY); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 38, height: 38, border: "1px solid var(--border)",
                borderRadius: "var(--r-md)", background: dark ? "var(--bg-hover)" : "transparent",
                cursor: "pointer",
              }}
            >
              {dark
                ? <Sun size={17} weight="fill" color="var(--color-sun)" />
                : <Moon size={17} color="var(--text-muted)" />}
            </button>
          </div>
        </div>
      </div>

      {/* Content with fade transition */}
      <div style={{ flex: 1, overflow: "auto", padding: "var(--sp-6) var(--page-px)" }}>
        <div style={{
          maxWidth: 800, margin: "0 auto",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.18s ease",
        }}>
          {content}
        </div>
      </div>

      {/* Footer: middle steps */}
      {step > 0 && step < STEP_COUNT - 1 ? (
        <div style={{
          flexShrink: 0, borderTop: "1px solid var(--border-light)",
          padding: "var(--sp-4) var(--page-px)",
        }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <LiveSummary t={t} salaryTotal={salaryTotal} opexTotal={opexTotal} estimatedARR={estimatedARR} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--sp-4)" }}>
              <button onClick={back} style={{
                padding: "8px 24px", fontSize: 13, fontWeight: 600, borderRadius: "var(--r-md)",
                border: "1px solid var(--border-strong)", background: "var(--bg-card)", color: "var(--text-secondary)",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "var(--sp-2)",
              }}>
                <ArrowLeft size={14} weight="bold" /> {t.back} <KBD>Esc</KBD>
              </button>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "var(--sp-2)" }}>
                <button
                  onClick={next}
                  disabled={nextDisabled}
                  style={{
                    padding: "8px 24px", fontSize: 13, fontWeight: 600, borderRadius: "var(--r-md)",
                    border: "none", background: "var(--brand)", color: "var(--color-on-brand)",
                    cursor: nextDisabled ? "not-allowed" : "pointer",
                    opacity: nextDisabled ? 0.45 : 1,
                    display: "flex", alignItems: "center", gap: "var(--sp-2)",
                    transition: "opacity 0.15s",
                  }}
                >
                  {t.next} <ArrowRight size={14} weight="bold" /> <KBD variant="brand"><ArrowBendDownLeft size={11} weight="bold" /></KBD>
                </button>
                <button
                  onClick={function () { goTo(step + 1); }}
                  style={{
                    padding: 0, fontSize: 11, border: "none", background: "none",
                    color: "var(--text-faint)", cursor: "pointer",
                    textDecoration: "underline", textUnderlineOffset: 2,
                  }}
                >
                  {t.skip_step}
                </button>
              </div>
            </div>
            {step === 6 && !costPreset ? (
              <p style={{ margin: "var(--sp-3) 0 0", fontSize: 11, color: "var(--text-faint)", textAlign: "right" }}>
                {t.costs_select_hint}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>,
    document.body
  );
}
