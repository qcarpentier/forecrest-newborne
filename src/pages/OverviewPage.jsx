import { useMemo, useState } from "react";
import { brand, err } from "../constants/colors";
import { PageLayout, KpiCard, Button } from "../components";
import Sparkline from "../components/Sparkline";
import ExplainerBox from "../components/ExplainerBox";
import { eur, eurShort, calcHealthScore } from "../utils";
import { TrendUp, ChartBar, Receipt, FileText, Vault } from "@phosphor-icons/react";
import { useT, useLang } from "../context";
import { OverviewSummary, OverviewAnalysis, OverviewAdvanced } from "./overview";

/* ─── greeting ─── */

function getGreeting(lang, userName) {
  var h = new Date().getHours();
  var greetings = {
    fr: h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir",
    en: h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening",
  };
  var g = greetings[lang] || greetings.fr;
  return userName ? g + ", " + userName : g;
}

/* ─── main component ─── */

export default function OverviewPage({
  arrV, totalRevenue, extraStreamsMRR, streams,
  monthlyCosts, totS, annC, ebitda, annualInterest,
  isocR, isocS, isoc, isocEff, netP,
  resLeg, resTarget, dirRem, dirOk,
  divGross, mGross, strPct, strNeed, cfg,
  annVatC, annVatD, vatBalance,
  onPrint, profs, setTab, onNavigate, debts,
  marketingData, bizKpis,
}) {
  var tAll = useT();
  var t = tAll.overview;
  var { lang } = useLang();

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
      ebitda: ebitda,
      cfg: cfg,
      revY1: totalRevenue,
    });
  }, [totalRevenue, monthlyCosts, ebitda, cfg]);

  /* ─── shared values ─── */
  var totalMRR = totalRevenue / 12;
  var monthlyRevenue = totalRevenue / 12;
  var isProfitable = monthlyRevenue >= monthlyCosts;
  var netBurn = monthlyCosts - monthlyRevenue;
  var ebitdaMargin = totalRevenue > 0 ? ebitda / totalRevenue : 0;
  var netMargin = totalRevenue > 0 ? netP / totalRevenue : 0;
  var totalDebt = 0;
  (debts || []).forEach(function (d) { if (d.amount > 0) totalDebt += d.amount; });

  var fr = cfg.capitalSocial + resLeg + netP;
  var bfr = -monthlyCosts;
  var tresoNette = fr - bfr;

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

  return (
    <PageLayout title={getGreeting(lang, cfg.userName || cfg.firstName)} subtitle={t.subtitle} actions={actionsNode}>

      {/* ── KPIs (always visible) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--sp-6)" }}>
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
          monthlyCosts={monthlyCosts} annC={annC} ebitda={ebitda} annualInterest={annualInterest}
          isocR={isocR} isocS={isocS} isoc={isoc} isocEff={isocEff} netP={netP}
          resLeg={resLeg} resTarget={resTarget} dirRem={dirRem} dirOk={dirOk}
          totalMRR={totalMRR} monthlyRevenue={monthlyRevenue}
          totalDebt={totalDebt} debts={debts}
          sparkData={sparkData} tresoNette={tresoNette}
          setTab={setTab} onNavigate={onNavigate}
        />
      ) : null}

      {overviewTab === "analysis" ? (
        <OverviewAnalysis
          t={t} lang={lang}
          totalRevenue={totalRevenue} monthlyCosts={monthlyCosts} ebitda={ebitda} netP={netP}
          monthlyRevenue={monthlyRevenue} isProfitable={isProfitable} netBurn={netBurn}
          ebitdaMargin={ebitdaMargin} netMargin={netMargin}
          health={health}
          bizKpis={bizKpis} cfg={cfg}
          setTab={setTab} onNavigate={onNavigate}
        />
      ) : null}

      {overviewTab === "advanced" ? (
        <OverviewAdvanced
          t={t} lang={lang}
          totalRevenue={totalRevenue} monthlyCosts={monthlyCosts} monthlyRevenue={monthlyRevenue}
          ebitda={ebitda} annualInterest={annualInterest} netP={netP}
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
