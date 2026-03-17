import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, ArrowLeft, ArrowBendDownLeft, Plus, Minus, Sparkle, RocketLaunch, Sun, Moon, Leaf, Buildings, Check } from "@phosphor-icons/react";
import { useT, useLang } from "../context";
import { useTheme } from "../context";
import { COST_DEF, applyCostPreset } from "../constants/defaults";
import { APP_NAME } from "../constants/config";
import LangDropdown from "./LangDropdown";
import { eur, salCalc } from "../utils";
import NumberField from "./NumberField";
import logo from "../assets/forecrest-lockup-light.svg";
import miloBusiness from "../assets/forecrest-icon-coral.svg";
import miloSparkling from "../assets/forecrest-icon-coral.svg";

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
    { icon: "1", label: t.feature_team },
    { icon: "2", label: t.feature_costs },
    { icon: "3", label: t.feature_pipeline },
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
    { label: t.done_pipeline, value: String(pipelineCount) },
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
var STEP_COUNT = 5;
// 0: Welcome | 1: Team | 2: Costs | 3: Pipeline | 4: Done

export default function OnboardingWizard({ sals, costs, cfg, setSals, setCosts, setCfg, onComplete }) {
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
      } else if (a.step === 1 || a.step === 3) {
        if (key === "Enter") { e.preventDefault(); a.next(); }
        if (key === "Escape" || key === "ArrowLeft") { e.preventDefault(); a.back(); }
      } else if (a.step === 2) {
        if (key === "1") { e.preventDefault(); setCostPreset("bootstrap"); setLocalCosts(applyCostPreset("bootstrap")); }
        if (key === "2") { e.preventDefault(); setCostPreset("standard"); setLocalCosts(applyCostPreset("standard")); }
        if (key === "3") { e.preventDefault(); setCostPreset("scaleup"); setLocalCosts(applyCostPreset("scaleup")); }
        if (key === "Enter" && a.costPreset) { e.preventDefault(); a.next(); }
        if (key === "Escape" || key === "ArrowLeft") { e.preventDefault(); a.back(); }
      } else if (a.step === 4) {
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

  var estimatedARR = 0;

  var activeTeamCount = useMemo(function () {
    return localSals.filter(function (s) { return s.net > 0; }).length;
  }, [localSals]);

  var nextDisabled = step === 2 && !costPreset;

  /* ── Step content renderers ── */
  var content;

  if (step === 0) {
    content = <StepWelcome t={t} onStart={next} onSkip={onComplete} />;
  }

  if (step === 1) {
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

  if (step === 2) {
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

  if (step === 3) {
    content = (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 var(--sp-2)" }}>{t.pipeline_title || "Presque terminé !"}</h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 var(--sp-6)" }}>
          {t.pipeline_sub || "Vous pourrez ajouter vos sources de revenus et charges détaillées depuis le dashboard."}
        </p>
        <div style={{
          padding: "var(--sp-5)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)",
          borderRadius: "var(--r-lg)", textAlign: "center",
        }}>
          <RocketLaunch size={40} weight="duotone" color="var(--color-success)" style={{ marginBottom: "var(--sp-3)" }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-success)" }}>
            {t.pipeline_ready || "Configuration de base prête"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: "var(--sp-2)" }}>
            Équipe : {activeTeamCount} personne{activeTeamCount > 1 ? "s" : ""} · Charges : {eur(opexTotal)}/mois
          </div>
        </div>
      </div>
    );
  }

  if (step === 4) {
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
  var innerStepCount = STEP_COUNT - 2; /* 4 middle steps */
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
            {step === 2 && !costPreset ? (
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
