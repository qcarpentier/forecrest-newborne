import { useMemo, useState } from "react";
import { brand, err } from "../constants/colors";
import { PageLayout, KpiCard, Button } from "../components";
import Sparkline from "../components/Sparkline";
import ExplainerBox from "../components/ExplainerBox";
import { eur, eurShort, calcHealthScore } from "../utils";
import { TrendUp, ChartBar, Receipt, FileText, Vault } from "@phosphor-icons/react";
import { useT, useLang, useAuth } from "../context";
import { OverviewSummary, OverviewAnalysis, OverviewAdvanced } from "./overview";

/* ─── greeting ─── */

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function getGreeting(lang, firstName) {
  var h = new Date().getHours();
  var greetings = {
    fr: h < 12 ? "Bonjour" : h < 18 ? "Bon apr\u00e8s-midi" : "Bonsoir",
    en: h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening",
  };
  var g = greetings[lang] || greetings.fr;
  var name = capitalize(firstName);
  return name ? g + " " + name + " !" : g;
}

/* ─── main component ─── */

export default function OverviewPage({
  arrV, totalRevenue, extraStreamsMRR, streams,
  monthlyCosts, totS, annC, ebit, annualInterest,
  isocR, isocS, isoc, isocEff, netP,
  resLeg, resTarget, dirRem, dirOk,
  divGross, mGross, strPct, strNeed, cfg, setCfg,
  annVatC, annVatD, vatBalance,
  onPrint, profs, setTab, onNavigate, debts,
  marketingData, bizKpis, marketplaceProj, effectiveViewYear,
}) {
  var tAll = useT();
  var t = tAll.overview;
  var { lang } = useLang();
  var auth = useAuth();
  /* Use logged-in user's first name for greeting, not the legal representative */
  var greetingName = (auth && auth.user && auth.user.displayName)
    ? auth.user.displayName.split(" ")[0]
    : (cfg ? cfg.firstName : "");

  /* ─── dismissible tip ─── */
  var [tipDismissed, setTipDismissed] = useState(function () {
    try { return localStorage.getItem("ov-tip-dismissed") === "1"; } catch (e) { return false; }
  });
  function dismissTip() {
    setTipDismissed(true);
    try { localStorage.setItem("ov-tip-dismissed", "1"); } catch (e) {}
  }

  /* ─── health score ─── */
  var health = useMemo(function () {
    return calcHealthScore({
      totalRevenue: totalRevenue,
      monthlyCosts: monthlyCosts,
      ebit: ebit,
      cfg: cfg,
      revY1: totalRevenue,
    });
  }, [totalRevenue, monthlyCosts, ebit, cfg]);

  /* ─── shared values ─── */
  var totalMRR = totalRevenue / 12;
  var monthlyRevenue = totalRevenue / 12;
  var isProfitable = monthlyRevenue >= monthlyCosts;
  var netBurn = monthlyCosts - monthlyRevenue;
  var ebitMargin = totalRevenue > 0 ? ebit / totalRevenue : 0;
  var netMargin = totalRevenue > 0 ? netP / totalRevenue : 0;
  var totalDebt = 0;
  (debts || []).forEach(function (d) { if (d.amount > 0) totalDebt += d.amount; });

  var fr = cfg.capitalSocial + resLeg + netP;
  var receivableDays = cfg.receivableDays || 30;
  var payableDays = cfg.payableDays || 30;
  var annualRevenue = totalRevenue;
  var annualCosts = monthlyCosts * 12;
  var receivables = annualRevenue * receivableDays / 365;
  var payables = annualCosts * payableDays / 365;
  var bfr = receivables - payables;
  var tresoNette = (cfg.initialCash || 0) - bfr;

  var OVERVIEW_TABS = [
    { id: "summary", label: t.tab_summary || (lang === "fr" ? "Résumé" : "Summary") },
    { id: "analysis", label: t.tab_analysis || (lang === "fr" ? "Analyse" : "Analysis") },
    { id: "advanced", label: t.tab_advanced || (lang === "fr" ? "Avancé" : "Advanced") },
  ];
  var [overviewTab, setOverviewTab] = useState("summary");

  var sparkData = useMemo(function () {
    var growth = 0.10;
    var mrrNow = totalMRR;
    var arrPts = [], mrrPts = [], costPts = [];
    for (var m = 0; m < 12; m++) {
      var factor = Math.pow(1 + growth, m);
      var mrr = mrrNow * factor;
      mrrPts.push(mrr);
      arrPts.push(mrr * 12);
      costPts.push(monthlyCosts);
    }
    return { arr: arrPts, mrr: mrrPts, costs: costPts };
  }, [totalMRR, monthlyCosts]);

  /* ─── print button ─── */
  var actionsNode = onPrint ? (
    <Button color="secondary" size="md" onClick={onPrint} iconLeading={<FileText size={16} weight="bold" />}>
      {t.generate_report || "Générer un rapport"}
    </Button>
  ) : null;

  var isMarketplace = !!(marketplaceProj && marketplaceProj.years && marketplaceProj.years.length);
  // Use the effective year computed upstream (falls back to Y1 when preset is loaded)
  var viewYear = effectiveViewYear != null ? effectiveViewYear : (cfg && cfg.viewYear);

  function setViewYear(y) {
    if (!setCfg) return;
    setCfg(function (prev) { return Object.assign({}, prev, { viewYear: y }); });
  }

  return (
    <PageLayout title={getGreeting(lang, greetingName)} subtitle={t.subtitle} actions={actionsNode}>

      {/* ── Marketplace year selector ── */}
      {isMarketplace ? (
        <div style={{
          display: "flex", alignItems: "center", gap: "var(--sp-3)",
          padding: "var(--sp-3) var(--sp-4)", marginBottom: "var(--sp-4)",
          background: "var(--bg-accordion)", border: "1px solid var(--border-light)",
          borderRadius: "var(--r-md)", flexWrap: "wrap",
        }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
            {lang === "fr" ? "Vue business plan :" : "Business plan view:"}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {marketplaceProj.years.map(function (y, i) {
              var yNum = i + 1;
              var active = viewYear === yNum;
              return (
                <button key={yNum} type="button" onClick={function () { setViewYear(yNum); }}
                  style={{
                    padding: "6px 14px", border: "1px solid " + (active ? "var(--brand)" : "var(--border)"),
                    borderRadius: "var(--r-sm)", background: active ? "var(--brand)" : "var(--bg-card)",
                    color: active ? "white" : "var(--text-secondary)",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    fontFamily: "inherit", transition: "all 0.12s",
                  }}>
                  {(lang === "fr" ? "Année " : "Year ") + yNum}
                </button>
              );
            })}
            <button type="button" onClick={function () { setViewYear(null); }}
              style={{
                padding: "6px 14px", border: "1px solid " + (!viewYear ? "var(--brand)" : "var(--border)"),
                borderRadius: "var(--r-sm)", background: !viewYear ? "var(--brand)" : "var(--bg-card)",
                color: !viewYear ? "white" : "var(--text-secondary)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit", transition: "all 0.12s",
              }}>
              {lang === "fr" ? "Régime" : "Steady"}
            </button>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-faint)", marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
            <span>
              {viewYear
                ? (lang === "fr" ? "Valeurs de l'année " + viewYear + " (acquisition + churn mois par mois)" : "Values for year " + viewYear + " (monthly acquisition + churn)")
                : (lang === "fr" ? "Valeurs du régime stable (clients cible en permanence)" : "Steady-state values (target clients permanently)")}
            </span>
            <strong style={{ color: "var(--text-primary)", fontSize: 12 }}>
              {(lang === "fr" ? "CA affiché : " : "Revenue: ") + eur(totalRevenue || 0)}
              {" · "}
              {(lang === "fr" ? "EBITDA : " : "EBITDA: ") + eur(ebit || 0)}
            </strong>
          </div>
        </div>
      ) : null}

      {/* ── KPIs (always visible) ── */}
      <div className="resp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--sp-6)" }}>
        <KpiCard label={t.simple_kpi_revenue} value={eurShort(totalRevenue)} fullValue={eur(totalRevenue)} icon={<TrendUp size={16} weight="bold" />} spark={<Sparkline data={sparkData.arr} color={brand} width={72} height={22} />} glossaryKey="annual_revenue" />
        <KpiCard label={t.simple_kpi_mrr} value={eurShort(totalMRR)} fullValue={eur(totalMRR)} icon={<ChartBar size={16} weight="bold" />} spark={<Sparkline data={sparkData.mrr} color="var(--brand)" width={72} height={22} />} glossaryKey="monthly_revenue" />
        <KpiCard label={t.simple_kpi_costs} value={eurShort(monthlyCosts)} fullValue={eur(monthlyCosts)} icon={<Receipt size={16} weight="bold" />} spark={<Sparkline data={sparkData.costs} color={err} width={72} height={22} />} glossaryKey="total_costs" />
        <KpiCard label={t.simple_kpi_treasury} value={eurShort(tresoNette)} fullValue={eur(tresoNette)} icon={<Vault size={16} weight="bold" />} glossaryKey="treasury" />
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border)", marginBottom: "var(--sp-6)" }}>
        {OVERVIEW_TABS.map(function (tab) {
          var active = overviewTab === tab.id;
          return (
            <button key={tab.id} onClick={function () { setOverviewTab(tab.id); }}
              style={{
                padding: "var(--sp-3) var(--sp-5)", border: "none",
                background: "transparent", cursor: "pointer",
                fontSize: 14, fontWeight: active ? 600 : 400,
                color: active ? "var(--brand)" : "var(--text-muted)",
                borderBottom: active ? "2px solid var(--brand)" : "2px solid transparent",
                marginBottom: -2, transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Sub-pages ── */}

      {overviewTab === "summary" ? (
        <OverviewSummary
          t={t} lang={lang}
          totalRevenue={totalRevenue} arrV={arrV} extraStreamsMRR={extraStreamsMRR} streams={streams}
          monthlyCosts={monthlyCosts} annC={annC} ebit={ebit} annualInterest={annualInterest}
          isocR={isocR} isocS={isocS} isoc={isoc} isocEff={isocEff} netP={netP}
          resLeg={resLeg} resTarget={resTarget} dirRem={dirRem} dirOk={dirOk}
          totalMRR={totalMRR} monthlyRevenue={monthlyRevenue}
          totalDebt={totalDebt} debts={debts}
          sparkData={sparkData} tresoNette={tresoNette}
          setTab={setTab} onNavigate={onNavigate}
          cfg={cfg}
        />
      ) : null}

      {overviewTab === "analysis" ? (
        <OverviewAnalysis
          t={t} lang={lang}
          totalRevenue={totalRevenue} monthlyCosts={monthlyCosts} ebit={ebit} netP={netP}
          monthlyRevenue={monthlyRevenue} isProfitable={isProfitable} netBurn={netBurn}
          ebitMargin={ebitMargin} netMargin={netMargin}
          health={health}
          bizKpis={bizKpis} cfg={cfg}
          setTab={setTab} onNavigate={onNavigate}
        />
      ) : null}

      {overviewTab === "advanced" ? (
        <OverviewAdvanced
          t={t} lang={lang}
          totalRevenue={totalRevenue} monthlyCosts={monthlyCosts} monthlyRevenue={monthlyRevenue}
          ebit={ebit} annualInterest={annualInterest} netP={netP}
          cfg={cfg}
          isocR={isocR} isocS={isocS} isoc={isoc} isocEff={isocEff}
          annVatC={annVatC} annVatD={annVatD} vatBalance={vatBalance}
          resLeg={resLeg} resTarget={resTarget}
          divGross={divGross}
          fr={fr}
        />
      ) : null}

    </PageLayout>
  );
}
