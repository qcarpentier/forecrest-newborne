import logoUrl from "../assets/forecrest-lockup-light.svg";

export function openPlanReport(data, lang) {
  var arrV = data.arrV, totalRevenue = data.totalRevenue, extraStreamsMRR = data.extraStreamsMRR;
  var monthlyCosts = data.monthlyCosts, opCosts = data.opCosts, salCosts = data.salCosts;
  var ebitda = data.ebitda, isoc = data.isoc, isocEff = data.isocEff, netP = data.netP;
  var vatBalance = data.vatBalance, annVatC = data.annVatC, annVatD = data.annVatD;
  var totS = data.totS, cfg = data.cfg;
  var arpuMonthly = data.arpuMonthly, ltvCac = data.ltvCac;
  var marginPct = data.marginPct, runway = data.runway, beClients = data.beClients;
  var healthLevel = data.healthLevel, streams = data.streams, t = data.t;
  var salBreakdown = data.salBreakdown || [], salCostsAnnual = data.salCostsAnnual || 0;
  var capitalSocial = data.capitalSocial || 0, resLeg = data.resLeg || 0;
  var divGross = data.divGross || 0, divNetVvpr = data.divNetVvpr || 0, divNetClassic = data.divNetClassic || 0;
  var scenariosComp = data.scenariosComp || [];

  var isFr = lang === "fr";
  var date = new Date().toLocaleDateString(isFr ? "fr-BE" : "en-GB", { year: "numeric", month: "long", day: "numeric" });

  function fEur(v) {
    if (v == null || isNaN(v)) return "0\u00a0EUR";
    return Math.round(v).toLocaleString(isFr ? "fr-BE" : "en-GB") + "\u00a0EUR";
  }
  function fPct(v) {
    if (v == null || isNaN(v)) return "0%";
    return (v * 100).toFixed(1) + "%";
  }
  function esc(s) {
    if (!s) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function row(label, value, bold, color) {
    return "<div class=\"row" + (bold ? " bold" : "") + "\">" +
      "<span class=\"rl\">" + esc(label) + "</span>" +
      "<span class=\"rv\"" + (color ? " style=\"color:" + color + "\"" : "") + ">" + esc(value) + "</span>" +
      "</div>";
  }
  function bullet(text) {
    return "<div class=\"bullet\"><span class=\"dot\"></span><span>" + esc(text) + "</span></div>";
  }
  function secTitle(text) {
    return "<div class=\"stitle\">" + esc(text) + "</div>";
  }
  function secHead(num, title, sub) {
    return "<div style=\"display:flex; align-items:center; gap:8px; margin-bottom:" + (sub ? "3px" : "10px") + ";\">" +
      "<span class=\"sl-badge\">" + esc(num) + "</span>" +
      "<div class=\"sh\">" + esc(title) + "</div>" +
      "</div>" +
      (sub ? "<div class=\"ss\">" + esc(sub) + "</div>" : "");
  }

  var healthColors = { good: "#027A48", ok: "#1570EF", weak: "#B54708", critical: "#B42318" };
  var hColor = healthColors[healthLevel] || "#B54708";

  var css =
    "* { margin:0; padding:0; box-sizing:border-box; }" +
    "body { font-family:system-ui,-apple-system,sans-serif; font-size:12px; color:#101828; background:#fff; }" +
    "@page { size:A4 portrait; margin:12mm 14mm; }" +
    "@media print { * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; } }" +
    ".header { background:linear-gradient(135deg,#E25536 0%,#c2410c 100%); color:#fff; padding:18px 22px; border-radius:8px; margin-bottom:18px; }" +
    ".h-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; }" +
    ".logo img { height:26px; filter:brightness(0) invert(1); }" +
    ".meta { text-align:right; font-size:10px; opacity:0.8; }" +
    ".tagline { font-size:14px; font-weight:800; line-height:1.35; margin-bottom:7px; max-width:540px; }" +
    ".hbody { font-size:11px; opacity:0.85; line-height:1.6; max-width:540px; margin-bottom:12px; }" +
    ".stats { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; }" +
    ".stat { background:rgba(255,255,255,0.18); border-radius:6px; padding:7px 9px; }" +
    ".sv { font-size:17px; font-weight:800; line-height:1; }" +
    ".sl { font-size:9px; opacity:0.8; margin-top:2px; }" +
    ".two { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }" +
    ".card { background:#fff; border:1px solid #EAECF0; border-radius:7px; padding:11px 13px; }" +
    ".sl-badge { font-size:9px; font-weight:800; color:#fff; background:#E25536; padding:2px 7px; border-radius:3px; display:inline-block; flex-shrink:0; letter-spacing:.04em; }" +
    ".sh { font-size:13px; font-weight:800; color:#101828; }" +
    ".ss { font-size:10px; color:#475467; margin-bottom:10px; padding-left:32px; }" +
    ".stitle { font-size:9px; font-weight:700; color:#98A2B3; letter-spacing:.08em; text-transform:uppercase; margin:8px 0 5px; }" +
    ".row { display:flex; justify-content:space-between; padding:3px 0; border-bottom:1px solid #F2F4F7; font-size:11px; }" +
    ".row:last-child { border-bottom:none; }" +
    ".rl { color:#475467; }" +
    ".rv { font-weight:600; color:#101828; }" +
    ".row.bold .rl { font-weight:700; color:#101828; }" +
    ".row.bold .rv { font-weight:700; }" +
    ".bullet { display:flex; gap:5px; margin-bottom:3px; align-items:flex-start; }" +
    ".dot { width:4px; height:4px; border-radius:50%; background:#B42318; flex-shrink:0; margin-top:5px; }" +
    ".bullet span:last-child { font-size:11px; color:#475467; line-height:1.4; }" +
    ".ctitle { font-size:10px; font-weight:700; color:#E25536; text-transform:uppercase; letter-spacing:.06em; margin-bottom:7px; }" +
    ".moat { display:grid; grid-template-columns:repeat(2,1fr); gap:7px; margin-bottom:9px; }" +
    ".mc { border:1px solid #EAECF0; border-radius:6px; padding:9px; }" +
    ".mn { font-size:16px; font-weight:800; color:#E25536; opacity:.22; line-height:1; margin-bottom:3px; }" +
    ".mt { font-size:11px; font-weight:700; color:#101828; margin-bottom:3px; }" +
    ".md { font-size:10px; color:#475467; line-height:1.4; }" +
    ".diff { background:#FFF6ED; border:1px solid #FDDDAF; border-radius:6px; padding:9px 11px; font-size:11px; color:#475467; line-height:1.5; font-style:italic; margin-bottom:12px; }" +
    ".kpis { display:grid; grid-template-columns:repeat(6,1fr); gap:7px; margin-bottom:12px; }" +
    ".kpi { padding:9px; background:#F9FAFB; border-radius:6px; border:1px solid #EAECF0; border-top-width:2px; }" +
    ".kl { font-size:9px; font-weight:600; color:#667085; text-transform:uppercase; letter-spacing:.06em; margin-bottom:3px; }" +
    ".kv { font-size:14px; font-weight:700; color:#101828; }" +
    ".hrow { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }" +
    ".hbadge { display:inline-flex; align-items:center; padding:3px 9px; border-radius:20px; font-size:10px; font-weight:700; }" +
    ".rway { background:#F9FAFB; border-radius:6px; padding:7px 9px; display:flex; justify-content:space-between; margin-bottom:7px; }" +
    "table { width:100%; border-collapse:collapse; font-size:11px; }" +
    "th { font-size:9px; font-weight:700; color:#98A2B3; text-transform:uppercase; letter-spacing:.08em; padding:4px 7px; border-bottom:2px solid #EAECF0; text-align:left; }" +
    "th.r { text-align:right; }" +
    "td { padding:5px 7px; border-bottom:1px solid #F2F4F7; vertical-align:middle; }" +
    "tr:last-child td { border-bottom:none; }" +
    ".tn { font-weight:600; color:#101828; }" +
    ".td { font-size:10px; color:#98A2B3; }" +
    ".badge { display:inline-block; padding:2px 6px; border-radius:20px; font-size:9px; font-weight:600; }" +
    ".bl { background:#ECFDF3; color:#027A48; border:1px solid #A6F4C5; }" +
    ".bp { background:#F9FAFB; color:#98A2B3; border:1px solid #EAECF0; }" +
    ".br { background:#ECFDF3; color:#027A48; }" +
    ".bt { background:#FFF6ED; color:#B54708; }" +
    ".bc { background:#EFF8FF; color:#1570EF; }" +
    ".val-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; margin-bottom:12px; }" +
    ".vb { text-align:center; padding:7px; background:#F9FAFB; border-radius:6px; border:1px solid #EAECF0; }" +
    ".vm { font-size:9px; font-weight:700; color:#E25536; margin-bottom:2px; }" +
    ".vn { font-size:12px; font-weight:700; color:#101828; }" +
    ".hr { border:none; border-top:1px solid #EAECF0; margin:12px 0; }" +
    ".pgrid { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:6px; padding:3px 0; border-bottom:1px solid #F2F4F7; font-size:11px; align-items:center; }" +
    ".pgrid:last-child { border-bottom:none; }" +
    ".pgrid.hd div { font-size:9px; font-weight:700; color:#98A2B3; text-transform:uppercase; letter-spacing:.06em; padding-bottom:4px; border-bottom:2px solid #EAECF0; }" +
    ".tr { text-align:right; }" +
    ".cap { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }" +
    ".sc-grid { display:grid; grid-template-columns:2fr 60px 1fr 1fr 1fr; gap:6px; padding:4px 6px; border-bottom:1px solid #F2F4F7; font-size:11px; align-items:center; }" +
    ".sc-grid.hd div { font-size:9px; font-weight:700; color:#98A2B3; text-transform:uppercase; letter-spacing:.06em; padding-bottom:4px; border-bottom:2px solid #EAECF0; }" +
    ".sc-active { background:#F9FAFB; border-radius:4px; }" +
    ".dot-sm { display:inline-block; width:7px; height:7px; border-radius:50%; margin-right:5px; vertical-align:middle; }" +
    ".footer { margin-top:14px; padding-top:8px; border-top:1px solid #EAECF0; font-size:9px; color:#98A2B3; display:flex; justify-content:space-between; }";

  var html = "<!DOCTYPE html><html lang=\"" + lang + "\"><head><meta charset=\"UTF-8\">" +
    "<title>Forecrest — " + esc(t.report_label || "Investment Memorandum") + "</title>" +
    "<style>" + css + "</style></head><body>";

  // Header
  html += "<div class=\"header\"><div class=\"h-top\"><div class=\"logo\"><img src=\"" + logoUrl + "\" alt=\"Forecrest\"></div>" +
    "<div class=\"meta\"><div>" + esc(t.report_label || "Investment Memorandum") + "</div><div>" + date + "</div></div></div>" +
    "<div class=\"tagline\">" + esc(t.hero_tagline) + "</div>" +
    "<div class=\"hbody\">" + esc(t.hero_body) + "</div>" +
    "<div class=\"stats\">" +
    "<div class=\"stat\"><div class=\"sv\">" + esc(t.hero_stat_market) + "</div><div class=\"sl\">" + esc(t.hero_stat_market_label) + "</div></div>" +
    "<div class=\"stat\"><div class=\"sv\">" + esc(t.hero_stat_cagr) + "</div><div class=\"sl\">" + esc(t.hero_stat_cagr_label) + "</div></div>" +
    "<div class=\"stat\"><div class=\"sv\">" + esc(t.hero_stat_apps) + "</div><div class=\"sl\">" + esc(t.hero_stat_apps_label) + "</div></div>" +
    "<div class=\"stat\"><div class=\"sv\">" + esc(t.hero_stat_streams) + "</div><div class=\"sl\">" + esc(t.hero_stat_streams_label) + "</div></div>" +
    "</div></div>";

  // Problem
  html += secHead("01", t.section_problem, t.problem_sub) +
    "<div class=\"two\">" +
    "<div class=\"card\"><div class=\"ctitle\">" + esc(t.prob_clients_title) + "</div>" + bullet(t.prob_clients_1) + bullet(t.prob_clients_2) + bullet(t.prob_clients_3) + "</div>" +
    "<div class=\"card\"><div class=\"ctitle\">" + esc(t.prob_pros_title) + "</div>" + bullet(t.prob_pros_1) + bullet(t.prob_pros_2) + bullet(t.prob_pros_3) + "</div>" +
    "<div class=\"card\"><div class=\"ctitle\">" + esc(t.prob_brands_title) + "</div>" + bullet(t.prob_brands_1) + bullet(t.prob_brands_2) + bullet(t.prob_brands_3) + "</div>" +
    "<div class=\"card\"><div class=\"ctitle\">" + esc(t.prob_corp_title) + "</div>" + bullet(t.prob_corp_1) + bullet(t.prob_corp_2) + "</div>" +
    "</div><hr class=\"hr\">";

  // Solution
  html += secHead("02", t.section_solution, t.solution_sub) +
    "<div class=\"two\">" +
    [
      { title: t.sol_app1_title, badge: t.sol_app1_badge, desc: t.sol_app1_desc, c: "#E25536" },
      { title: t.sol_app2_title, badge: t.sol_app2_badge, desc: t.sol_app2_desc, c: "#027A48" },
      { title: t.sol_app3_title, badge: t.sol_app3_badge, desc: t.sol_app3_desc, c: "#1570EF" },
      { title: t.sol_app4_title, badge: t.sol_app4_badge, desc: t.sol_app4_desc, c: "#B54708" },
    ].map(function (a) {
      return "<div style=\"border:1px solid #EAECF0; border-left:3px solid " + a.c + "; border-radius:7px; padding:10px 12px;\">" +
        "<div style=\"font-size:12px; font-weight:700; color:#101828; margin-bottom:3px;\">" + esc(a.title) +
        " <span style=\"font-size:9px; color:" + a.c + "; background:#F9FAFB; padding:1px 5px; border-radius:20px; margin-left:4px;\">" + esc(a.badge) + "</span></div>" +
        "<div style=\"font-size:11px; color:#475467; line-height:1.45;\">" + esc(a.desc) + "</div></div>";
    }).join("") +
    "</div><hr class=\"hr\">";

  // Business Model
  html += secHead("03", t.section_model, t.model_sub) +
    "<table><thead><tr><th>" + esc(t.model_col_source) + "</th><th>" + esc(t.model_col_type) + "</th><th class=\"r\">" + esc(t.model_col_mrr) + "</th><th class=\"r\">" + esc(t.model_col_status) + "</th></tr></thead><tbody>";
  streams.forEach(function (s) {
    var tc = s.type === t.model_type_recurring ? "br" : s.type === t.model_type_licensing ? "bc" : "bt";
    html += "<tr><td><div class=\"tn\">" + esc(s.name) + "</div><div class=\"td\">" + esc(s.desc) + "</div></td>" +
      "<td><span class=\"badge " + tc + "\">" + esc(s.type) + "</span></td>" +
      "<td style=\"text-align:right; font-weight:600;\">" + (s.mrr > 0 ? fEur(s.mrr) : "—") + "</td>" +
      "<td style=\"text-align:right;\"><span class=\"badge " + (s.active ? "bl" : "bp") + "\">" + esc(s.active ? t.model_live : t.model_projected) + "</span></td></tr>";
  });
  html += "</tbody></table><hr class=\"hr\">";

  // Moat
  html += secHead("04", t.section_moat, t.moat_sub) +
    "<div class=\"moat\">" +
    [
      { n: "01", title: t.moat_collect_title,  desc: t.moat_collect_desc },
      { n: "02", title: t.moat_intel_title,    desc: t.moat_intel_desc },
      { n: "03", title: t.moat_activate_title, desc: t.moat_activate_desc },
      { n: "04", title: t.moat_network_title,  desc: t.moat_network_desc },
    ].map(function (s) {
      return "<div class=\"mc\"><div class=\"mn\">" + s.n + "</div><div class=\"mt\">" + esc(s.title) + "</div><div class=\"md\">" + esc(s.desc) + "</div></div>";
    }).join("") +
    "</div><div class=\"diff\">" + esc(t.moat_differentiator) + "</div>";

  // Why Now
  html += secHead("05", t.section_why_now, t.why_now_sub) +
    "<div class=\"two\">" +
    [
      { title: t.why1_title, desc: t.why1_desc },
      { title: t.why2_title, desc: t.why2_desc },
      { title: t.why3_title, desc: t.why3_desc },
      { title: t.why4_title, desc: t.why4_desc },
    ].map(function (w) {
      return "<div class=\"card\"><div style=\"font-size:12px; font-weight:700; color:#101828; margin-bottom:3px;\">" + esc(w.title) + "</div>" +
        "<div style=\"font-size:11px; color:#475467; line-height:1.45;\">" + esc(w.desc) + "</div></div>";
    }).join("") +
    "</div><hr class=\"hr\">";

  // Financial Performance
  html += secHead("06", t.section_performance, t.performance_sub) +
    "<div class=\"kpis\">" +
    "<div class=\"kpi\" style=\"border-top-color:#E25536\"><div class=\"kl\">ARR</div><div class=\"kv\" style=\"color:#E25536\">" + fEur(arrV) + "</div></div>" +
    "<div class=\"kpi\" style=\"border-top-color:#E25536\"><div class=\"kl\">MRR</div><div class=\"kv\">" + fEur(arrV / 12 + extraStreamsMRR) + "</div></div>" +
    "<div class=\"kpi\" style=\"border-top-color:" + (ebitda >= 0 ? "#027A48" : "#B42318") + "\"><div class=\"kl\">EBITDA</div><div class=\"kv\" style=\"color:" + (ebitda >= 0 ? "#027A48" : "#B42318") + "\">" + fEur(ebitda) + "</div></div>" +
    "<div class=\"kpi\" style=\"border-top-color:" + (netP >= 0 ? "#027A48" : "#B42318") + "\"><div class=\"kl\">" + esc(t.profit_net) + "</div><div class=\"kv\" style=\"color:" + (netP >= 0 ? "#027A48" : "#B42318") + "\">" + fEur(netP) + "</div></div>" +
    "<div class=\"kpi\" style=\"border-top-color:#98A2B3\"><div class=\"kl\">" + esc(t.kpi_clients) + "</div><div class=\"kv\">" + totS + "</div></div>" +
    "<div class=\"kpi\" style=\"border-top-color:#98A2B3\"><div class=\"kl\">ARPU</div><div class=\"kv\">" + fEur(arpuMonthly) + "</div></div>" +
    "</div>" +
    "<div class=\"two\">" +
    "<div class=\"card\">" + secTitle(t.section_revenue) +
    row(t.revenue_platform, fEur(arrV), false, "#E25536") +
    row(t.revenue_streams, fEur(extraStreamsMRR * 12)) +
    row(t.revenue_total, fEur(totalRevenue), true) +
    secTitle(t.section_costs) +
    row(t.costs_opex, fEur(opCosts * 12)) +
    row(t.costs_salaries, fEur(salCosts * 12)) +
    row(t.costs_total, fEur(monthlyCosts * 12), true) +
    secTitle(t.section_profit) +
    row(t.profit_ebitda, fEur(ebitda), true, ebitda >= 0 ? "#027A48" : "#B42318") +
    row(t.profit_isoc, fEur(isoc)) +
    row(t.profit_net, fEur(netP), true, netP >= 0 ? "#027A48" : "#B42318") +
    "</div>" +
    "<div>" +
    "<div class=\"card\" style=\"margin-bottom:9px;\">" +
    "<div class=\"hrow\"><span style=\"font-size:12px; font-weight:600; color:#475467;\">" + esc(t.health_label) + "</span>" +
    "<span class=\"hbadge\" style=\"color:" + hColor + "; background:" + hColor + "22; border:1px solid " + hColor + "44;\">" + esc(t["health_" + healthLevel]) + "</span></div>" +
    (runway != null ? "<div class=\"rway\"><div><div style=\"font-size:9px; color:#98A2B3; margin-bottom:2px;\">" + esc(t.kpi_runway) + "</div><div style=\"font-size:15px; font-weight:700; color:" + (runway >= 12 ? "#027A48" : runway >= 6 ? "#B54708" : "#B42318") + "\">" + runway + " " + esc(t.kpi_runway_unit) + "</div></div>" +
      (beClients != null ? "<div style=\"text-align:right;\"><div style=\"font-size:9px; color:#98A2B3; margin-bottom:2px;\">" + esc(t.kpi_breakeven) + "</div><div style=\"font-size:15px; font-weight:700; color:" + (totS >= beClients ? "#027A48" : "#B54708") + "\">" + beClients + "</div></div>" : "") + "</div>" : "") +
    secTitle(t.section_metrics) +
    row(t.metric_margin, fPct(marginPct), false, marginPct >= 0.2 ? "#027A48" : marginPct >= 0 ? "#B54708" : "#B42318") +
    (ltvCac > 0 ? row("LTV:CAC", ltvCac.toFixed(1) + "x", true, ltvCac >= 3 ? "#027A48" : ltvCac >= 1 ? "#B54708" : "#B42318") : "") +
    "</div>" +
    "<div class=\"card\">" + secTitle(t.section_tax) +
    row(t.tax_vat_balance, fEur(vatBalance)) +
    row(t.tax_isoc_rate, isocEff > 0 ? fPct(isocEff) : "0%") +
    "</div></div></div>";

  // Masse salariale (inside section 06)
  if (salBreakdown.length > 0) {
    html += secTitle(t.section_payroll) +
      "<div class=\"card\" style=\"margin-top:4px;\">" +
      "<div class=\"pgrid hd\"><div>" + esc(t.payroll_col_role) + "</div><div class=\"tr\">" + esc(t.payroll_col_net) + "</div><div class=\"tr\">" + esc(t.payroll_col_brut) + "</div><div class=\"tr\">" + esc(t.payroll_col_total) + "</div></div>";
    salBreakdown.forEach(function (s) {
      html += "<div class=\"pgrid\"><span style=\"color:#475467\">" + esc(s.role) + "</span><span class=\"tr\" style=\"color:#98A2B3\">" + fEur(s.net) + "</span><span class=\"tr\" style=\"color:#475467\">" + fEur(s.brutO) + "</span><span class=\"tr\" style=\"font-weight:600\">" + fEur(s.total) + "</span></div>";
    });
    html += "<div class=\"pgrid\"><span style=\"font-weight:700\">" + esc(t.payroll_total) + "</span><span></span><span></span><span class=\"tr\" style=\"font-weight:700\">" + fEur(salCostsAnnual) + "</span></div></div><hr class=\"hr\">";
  }

  // Valuation
  html += "<div style=\"font-size:10px; font-weight:700; color:#E25536; margin-bottom:6px;\">" + esc(t.valuation_title || "Valuation multiples ARR") + "</div>" +
    "<div class=\"val-grid\">" +
    [3, 5, 8, 10].map(function (m) {
      return "<div class=\"vb\"><div class=\"vm\">" + m + "x ARR</div><div class=\"vn\">" + fEur(totalRevenue * m) + "</div></div>";
    }).join("") +
    "</div><hr class=\"hr\">";

  // Section 07 — Capital & Dividendes
  html += secHead("07", t.section_capital, t.capital_sub) +
    "<div class=\"cap\">" +
    "<div class=\"card\">" + secTitle(t.capital_section_equity) +
    row(t.capital_social,   fEur(capitalSocial)) +
    row(t.capital_reserves, fEur(resLeg)) +
    row(t.capital_total,    fEur(capitalSocial + resLeg), true) +
    "</div>" +
    "<div class=\"card\">" + secTitle(t.capital_dividends) +
    row(t.dividends_capacity,    fEur(divGross),      true,  divGross > 0 ? "#027A48" : "#98A2B3") +
    row(t.dividends_net_vvprbis, fEur(divNetVvpr),    false, divNetVvpr > 0 ? "#027A48" : "#98A2B3") +
    row(t.dividends_net_classic, fEur(divNetClassic)) +
    "</div></div><hr class=\"hr\">";

  // Section 08 — Comparaison des scénarios
  if (scenariosComp.length > 0) {
    html += secHead("08", t.section_scenarios, t.scenarios_sub) +
      "<div class=\"card\">" +
      "<div class=\"sc-grid hd\"><div>" + esc(t.scenarios_col_name) + "</div><div class=\"tr\">" + esc(t.scenarios_col_clients) + "</div><div class=\"tr\">" + esc(t.scenarios_col_arr) + "</div><div class=\"tr\">" + esc(t.scenarios_col_costs) + "</div><div class=\"tr\">" + esc(t.scenarios_col_result) + "</div></div>";
    scenariosComp.forEach(function (sc) {
      var netColor = sc.netP >= 0 ? "#027A48" : "#B42318";
      html += "<div class=\"sc-grid" + (sc.isActive ? " sc-active" : "") + "\">" +
        "<span><span class=\"dot-sm\" style=\"background:" + esc(sc.color.replace("var(--brand)", "#E25536").replace("var(--color-error)", "#B42318").replace("var(--color-warning)", "#B54708").replace("var(--color-success)", "#027A48").replace("var(--text-muted)", "#98A2B3")) + "\"></span>" +
        "<span style=\"font-weight:" + (sc.isActive ? "700" : "400") + "\">" + esc(sc.name) + "</span>" +
        (sc.isActive ? " <span style=\"font-size:8px; color:#E25536; background:#FFF6ED; padding:1px 4px; border-radius:10px; border:1px solid #FDDDAF\">" + esc(t.scenarios_active) + "</span>" : "") +
        "</span>" +
        "<span class=\"tr\" style=\"color:#475467\">" + sc.totS + "</span>" +
        "<span class=\"tr\" style=\"font-weight:600\">" + fEur(sc.arrV) + "</span>" +
        "<span class=\"tr\" style=\"color:#475467\">" + fEur(sc.monthlyCosts) + "</span>" +
        "<span class=\"tr\" style=\"font-weight:700; color:" + netColor + "\">" + fEur(sc.netP) + "</span>" +
        "</div>";
    });
    html += "</div><hr class=\"hr\">";
  }

  // Section 09 — Positioning
  html += secHead("09", t.section_positioning, t.positioning_sub) +
    "<div style=\"background:#F9FAFB; border-radius:6px; padding:10px 12px; font-size:11px; color:#475467; line-height:1.6;\">" + esc(t.positioning_desc) + "</div>";

  html += "<div class=\"footer\"><span>Forecrest — " + esc(t.report_label || "Investment Memorandum") + "</span><span>" + esc(t.report_disclaimer || "") + "</span></div>";
  html += "</body></html>";

  var win = window.open("", "_blank");
  if (!win) {
    alert(isFr ? "Autorisez les popups pour g\u00e9n\u00e9rer le rapport." : "Allow popups to generate the report.");
    return;
  }
  win.document.write(html);
  win.document.close();
  setTimeout(function () { win.print(); }, 500);
}

export function openInvestorReport(data, lang) {
  var {
    totalRevenue, totalMRR, totS, monthlyCosts, ebitda, ebitdaMargin,
    netP, isProfitable, netBurn, divGross, fr, bfr, tresoNette,
    ltv, ltvCac, payback, arpuMonthly, cfg, resLeg, isoc, vatBalance,
  } = data;

  function fEur(v) {
    if (v == null || isNaN(v)) return "0 EUR";
    return Math.round(v).toLocaleString(lang === "fr" ? "fr-BE" : "en-GB") + "\u00a0EUR";
  }
  function fPct(v) {
    if (v == null || isNaN(v)) return "0%";
    return (v * 100).toFixed(1) + "%";
  }

  var isFr = lang === "fr";
  var date = new Date().toLocaleDateString(isFr ? "fr-BE" : "en-GB", { year: "numeric", month: "long", day: "numeric" });

  var netMargin = totalRevenue > 0 ? netP / totalRevenue : 0;

  function row(label, value, bold, colorClass) {
    return (
      "<div class=\"row" + (bold ? " bold" : "") + "\">" +
      "<span class=\"row-label\">" + label + "</span>" +
      "<span class=\"row-value" + (colorClass ? " " + colorClass : "") + "\">" + value + "</span>" +
      "</div>"
    );
  }

  var saasBlock = (totS > 0 && arpuMonthly > 0) ? (
    "<div class=\"section\">" +
    "<div class=\"section-title\">" + (isFr ? "M\u00e9triques SaaS" : "SaaS Metrics") + "</div>" +
    "<div class=\"three-col\">" +
    "<div class=\"card\"><div class=\"card-title\">ARPU</div><div class=\"big-num\">" + fEur(arpuMonthly) + "</div><div class=\"note\">" + (isFr ? "MRR / clients sign\u00e9s" : "MRR / signed clients") + "</div></div>" +
    "<div class=\"card\"><div class=\"card-title\">LTV</div><div class=\"big-num\">" + (ltv > 0 ? fEur(ltv) : "\u2013") + "</div><div class=\"note\">ARPU \u00f7 churn (" + fPct(cfg.churnMonthly || 0.03) + "/mois)</div></div>" +
    "<div class=\"card\"><div class=\"card-title\">LTV:CAC</div><div class=\"big-num\" style=\"color:" + (ltvCac >= 3 ? "#027A48" : ltvCac > 0 ? "#B54708" : "#101828") + "\">" + (ltvCac > 0 ? ltvCac.toFixed(1) + "x" : "\u2013") + "</div><div class=\"note\">" + (ltvCac >= 3 ? (isFr ? "\u2265 3x \u2014 excellent" : "\u2265 3x \u2014 excellent") : ltvCac > 0 ? (isFr ? "< 3x \u2014 \u00e0 am\u00e9liorer" : "< 3x \u2014 needs improvement") : (isFr ? "CAC non d\u00e9fini" : "CAC not set")) + "</div></div>" +
    "</div>" +
    (payback > 0 ? "<div class=\"note\" style=\"margin-top:6px\">" + (isFr ? "Payback period : " : "Payback period: ") + payback.toFixed(1) + (isFr ? " mois" : " months") + "</div>" : "") +
    "</div>"
  ) : "";

  var html = "<!DOCTYPE html><html lang=\"" + lang + "\"><head><meta charset=\"UTF-8\">" +
    "<title>" + (isFr ? "Rapport Investisseur" : "Investor Report") + "</title>" +
    "<style>" +
    "* { margin:0; padding:0; box-sizing:border-box; }" +
    "body { font-family: system-ui,-apple-system,sans-serif; font-size:13px; color:#101828; background:white; }" +
    "@page { size:A4 portrait; margin:14mm 16mm; }" +
    "@media print { * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; } }" +
    ".header { border-bottom:3px solid #E25536; padding-bottom:14px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:flex-end; }" +
    ".logo img { height:32px; display:block; }" +
    ".report-meta { text-align:right; }" +
    ".report-meta-title { font-size:13px; font-weight:700; color:#101828; }" +
    ".report-meta-date { font-size:11px; color:#98A2B3; margin-top:2px; }" +
    ".kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:18px; }" +
    ".kpi { padding:12px; background:#F9FAFB; border-radius:8px; border:1px solid #EAECF0; }" +
    ".kpi-label { font-size:10px; font-weight:600; color:#667085; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:5px; }" +
    ".kpi-value { font-size:20px; font-weight:700; color:#101828; letter-spacing:-0.02em; }" +
    ".kpi-value.brand { color:#E25536; }" +
    ".kpi-value.ok { color:#027A48; }" +
    ".kpi-value.err { color:#B42318; }" +
    ".kpi-sub { font-size:10px; color:#98A2B3; margin-top:2px; }" +
    ".two-col { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px; }" +
    ".three-col { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:10px; }" +
    ".four-col { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:8px; }" +
    ".section { margin-bottom:16px; }" +
    ".section-title { font-size:10px; font-weight:700; color:#E25536; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px; padding-bottom:4px; border-bottom:1px solid #FECDCA; }" +
    ".card { background:white; border:1px solid #EAECF0; border-radius:8px; padding:12px; }" +
    ".card-title { font-size:11px; font-weight:700; color:#344054; margin-bottom:8px; }" +
    ".big-num { font-size:18px; font-weight:700; color:#101828; letter-spacing:-0.02em; }" +
    ".row { display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px solid #F2F4F7; font-size:12px; }" +
    ".row:last-child { border-bottom:none; }" +
    ".row-label { color:#475467; }" +
    ".row-value { font-weight:600; color:#101828; }" +
    ".row-value.ok { color:#027A48; }" +
    ".row-value.err { color:#B42318; }" +
    ".row-value.brand { color:#E25536; }" +
    ".row.bold .row-label { font-weight:700; color:#101828; }" +
    ".val-box { text-align:center; padding:8px; background:#F9FAFB; border-radius:6px; border:1px solid #EAECF0; }" +
    ".val-mult { font-size:10px; font-weight:700; color:#E25536; margin-bottom:4px; }" +
    ".val-num { font-size:14px; font-weight:700; color:#101828; }" +
    ".note { font-size:10px; color:#98A2B3; margin-top:4px; line-height:1.4; }" +
    ".badge { display:inline-flex; padding:2px 8px; border-radius:20px; font-size:10px; font-weight:600; }" +
    ".badge.ok { background:#ECFDF3; color:#027A48; border:1px solid #A6F4C5; }" +
    ".badge.err { background:#FEF3F2; color:#B42318; border:1px solid #FECDCA; }" +
    ".footer { margin-top:16px; padding-top:10px; border-top:1px solid #EAECF0; font-size:10px; color:#98A2B3; display:flex; justify-content:space-between; }" +
    "</style></head><body>" +

    "<div class=\"header\">" +
    "<div class=\"logo\"><img src=\"" + logoUrl + "\" alt=\"Logo\" /></div>" +
    "<div class=\"report-meta\"><div class=\"report-meta-title\">" + (isFr ? "Rapport Investisseur" : "Investor Report") + "</div><div class=\"report-meta-date\">" + date + "</div></div>" +
    "</div>" +

    "<div class=\"kpi-grid\">" +
    "<div class=\"kpi\"><div class=\"kpi-label\">" + (isFr ? "ARR consolid\u00e9" : "Consolidated ARR") + "</div><div class=\"kpi-value brand\">" + fEur(totalRevenue) + "</div><div class=\"kpi-sub\">" + (isFr ? "Hors taxes" : "Ex. VAT") + "</div></div>" +
    "<div class=\"kpi\"><div class=\"kpi-label\">MRR</div><div class=\"kpi-value\">" + fEur(totalMRR) + "</div><div class=\"kpi-sub\">" + (isFr ? "Revenu mensuel r\u00e9current" : "Monthly recurring revenue") + "</div></div>" +
    "<div class=\"kpi\"><div class=\"kpi-label\">EBITDA</div><div class=\"kpi-value " + (ebitda >= 0 ? "ok" : "err") + "\">" + fEur(ebitda) + "</div><div class=\"kpi-sub\">" + fPct(Math.abs(ebitdaMargin)) + " " + (isFr ? "marge" : "margin") + "</div></div>" +
    "<div class=\"kpi\"><div class=\"kpi-label\">" + (isFr ? "Clients sign\u00e9s" : "Signed clients") + "</div><div class=\"kpi-value\">" + totS + "</div><div class=\"kpi-sub\">" + (isFr ? "\u00c9tablissements actifs" : "Active establishments") + "</div></div>" +
    "</div>" +

    "<div class=\"two-col\">" +
    "<div class=\"section\"><div class=\"section-title\">" + (isFr ? "Compte de r\u00e9sultat" : "Income statement") + "</div><div class=\"card\">" +
    row(isFr ? "CA net HT" : "Net revenue ex. VAT", fEur(totalRevenue), false, "brand") +
    row(isFr ? "Charges d'exploitation" : "Operating expenses", "\u2212\u00a0" + fEur(monthlyCosts * 12), false, "err") +
    row("EBITDA", fEur(ebitda), true, ebitda >= 0 ? "ok" : "err") +
    row(isFr ? "R\u00e9sultat net" : "Net profit", fEur(netP), true, netP >= 0 ? "ok" : "err") +
    "</div></div>" +

    "<div class=\"section\"><div class=\"section-title\">" + (isFr ? "Sant\u00e9 financi\u00e8re" : "Financial health") + "</div><div class=\"card\">" +
    row(isFr ? "Marge EBITDA" : "EBITDA margin", fPct(ebitdaMargin), false, ebitdaMargin >= 0.2 ? "ok" : ebitdaMargin >= 0 ? "" : "err") +
    row(isFr ? "Marge nette" : "Net margin", fPct(netMargin), false, netMargin >= 0.1 ? "ok" : netMargin >= 0 ? "" : "err") +
    row(isFr ? "Charges/mois" : "Monthly costs", fEur(monthlyCosts)) +
    row(isFr ? "Burn mensuel" : "Monthly burn", isProfitable ? (isFr ? "Rentable" : "Profitable") : fEur(netBurn), true, isProfitable ? "ok" : "err") +
    "</div></div>" +
    "</div>" +

    saasBlock +

    "<div class=\"section\"><div class=\"section-title\">" + (isFr ? "Valorisation (multiples ARR)" : "Valuation (ARR multiples)") + "</div>" +
    "<div class=\"four-col\">" +
    [3, 5, 8, 10].map(function (m) {
      return "<div class=\"val-box\"><div class=\"val-mult\">" + m + "x ARR</div><div class=\"val-num\">" + fEur(totalRevenue * m) + "</div></div>";
    }).join("") +
    "</div></div>" +

    "<div class=\"two-col\">" +
    "<div class=\"section\"><div class=\"section-title\">" + (isFr ? "Structure financi\u00e8re" : "Financial structure") + "</div><div class=\"card\">" +
    row(isFr ? "Capital + r\u00e9serves" : "Capital + reserves", fEur(cfg.capitalSocial + resLeg)) +
    row(isFr ? "Fonds de roulement" : "Working capital", fEur(fr), true, fr >= 0 ? "ok" : "err") +
    row("BFR", fEur(bfr), false, bfr <= 0 ? "ok" : "err") +
    row(isFr ? "Tr\u00e9sorerie nette" : "Net cash position", fEur(tresoNette), true, tresoNette >= 0 ? "ok" : "err") +
    "</div></div>" +

    "<div class=\"section\"><div class=\"section-title\">" + (isFr ? "Dividendes" : "Dividends") + "</div><div class=\"card\">" +
    row(isFr ? "Capacit\u00e9 de distribution" : "Distributable capacity", fEur(divGross)) +
    row(isFr ? "Net pr\u00e9compte 30%" : "Net classic 30%", fEur(divGross * 0.70)) +
    row("Net VVPRbis 15%", fEur(divGross * 0.85), true, "ok") +
    "</div></div>" +
    "</div>" +

    "<div class=\"footer\">" +
    "<span></span>" +
    "<span>" + (isFr ? "Projections bas\u00e9es sur les param\u00e8tres actuels. Non audit\u00e9." : "Projections based on current parameters. Not audited.") + "</span>" +
    "</div>" +

    "</body></html>";

  var win = window.open("", "_blank");
  if (!win) {
    alert(isFr ? "Autorisez les popups pour g\u00e9n\u00e9rer le rapport." : "Allow popups to generate the report.");
    return;
  }
  win.document.write(html);
  win.document.close();
  setTimeout(function () { win.print(); }, 500);
}
