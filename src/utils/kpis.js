/**
 * Business-type KPI calculation registry.
 * Returns an object of KPIs specific to cfg.businessType.
 *
 * Usage in App.jsx:
 *   var bizKpis = calcBusinessKpis(cfg.businessType, { totalRevenue, monthlyCosts, ebitda, netP, cfg, sals, streams, debts });
 */

function saasKpis(p) {
  var cfg = p.cfg;
  var mrr = p.totalRevenue / 12;
  var arr = p.totalRevenue;
  var churn = cfg.churnMonthly || 0.03;
  var expansionRate = cfg.expansionRate || 0.02;
  var contractionRate = cfg.contractionRate || 0.01;
  var growthRate = cfg.revenueGrowthRate || 0.10;

  var expansionMRR = mrr * expansionRate;
  var contractionMRR = mrr * contractionRate;
  var churnedMRR = mrr * churn;
  var newMRR = mrr * growthRate / 12; // monthly new from annual growth

  // Net Revenue Retention: (start + expansion - contraction - churned) / start
  var nrr = mrr > 0 ? (mrr + expansionMRR - contractionMRR - churnedMRR) / mrr : 0;

  // Quick Ratio: (new + expansion) / (contraction + churned)
  var lostMRR = contractionMRR + churnedMRR;
  var quickRatio = lostMRR > 0 ? (newMRR + expansionMRR) / lostMRR : 0;

  // Rule of 40: revenue growth % + EBITDA margin %
  var ebitdaMargin = p.totalRevenue > 0 ? p.ebitda / p.totalRevenue : 0;
  var ruleOf40 = (growthRate * 100) + (ebitdaMargin * 100);

  // ARPU
  var headcount = (p.sals || []).filter(function (s) { return s.net > 0; }).length;
  var arpu = mrr; // per-company MRR if no client count

  // LTV / CAC
  var ltv = churn > 0 ? arpu / churn : 0;
  var cac = cfg.cacTarget || 0;
  var ltvCac = cac > 0 && ltv > 0 ? ltv / cac : 0;
  var paybackMonths = cac > 0 && arpu > 0 ? cac / arpu : 0;

  // Trial conversion
  var trialConversion = cfg.trialConversionRate || 0.05;

  return {
    type: "saas",
    kpis: [
      { id: "mrr", value: mrr, format: "eur" },
      { id: "arr", value: arr, format: "eur" },
      { id: "nrr", value: nrr, format: "pct" },
      { id: "expansion_mrr", value: expansionMRR, format: "eur" },
      { id: "contraction_mrr", value: contractionMRR, format: "eur" },
      { id: "churned_mrr", value: churnedMRR, format: "eur" },
      { id: "quick_ratio", value: quickRatio, format: "ratio" },
      { id: "rule_of_40", value: ruleOf40, format: "number" },
      { id: "ltv", value: ltv, format: "eur" },
      { id: "cac", value: cac, format: "eur" },
      { id: "ltv_cac", value: ltvCac, format: "ratio" },
      { id: "payback_months", value: paybackMonths, format: "months" },
      { id: "churn_rate", value: churn, format: "pct" },
      { id: "trial_conversion", value: trialConversion, format: "pct" },
      { id: "growth_rate", value: growthRate, format: "pct" },
    ],
    debug: {
      expansionRate: expansionRate,
      contractionRate: contractionRate,
      newMRR: newMRR,
      lostMRR: lostMRR,
    },
  };
}

function ecommerceKpis(p) {
  var cfg = p.cfg;
  var revenue = p.totalRevenue;
  var ordersPerMonth = cfg.ordersPerMonth || 0;
  var annualOrders = ordersPerMonth * 12;
  var visitors = cfg.monthlyVisitors || 0;
  var annualVisitors = visitors * 12;

  var aov = annualOrders > 0 ? revenue / annualOrders : 0;
  var conversionRate = annualVisitors > 0 ? annualOrders / annualVisitors : 0;
  var cartAbandonment = cfg.cartAbandonmentRate || 0.70;
  var repeatPurchase = cfg.repeatPurchaseRate || 0.25;
  var returnRate = cfg.returnRate || 0.05;
  var shippingCostRatio = revenue > 0 ? (cfg.avgShippingCost * annualOrders) / revenue : 0;
  var fulfillmentTotal = (cfg.fulfillmentCostPerOrder || 0) * annualOrders;

  // Contribution margin: (revenue - shipping - fulfillment - returns) / revenue
  var returnCost = revenue * returnRate;
  var shippingCost = cfg.avgShippingCost * annualOrders;
  var contributionMargin = revenue > 0 ? (revenue - shippingCost - fulfillmentTotal - returnCost) / revenue : 0;

  // CLV: AOV * purchase frequency * lifespan
  var purchaseFrequency = repeatPurchase > 0 ? 1 / (1 - repeatPurchase) : 1;
  var avgLifespanYears = 2;
  var clv = aov * purchaseFrequency * avgLifespanYears;

  return {
    type: "ecommerce",
    kpis: [
      { id: "gmv", value: revenue, format: "eur" },
      { id: "aov", value: aov, format: "eur" },
      { id: "orders_monthly", value: ordersPerMonth, format: "number" },
      { id: "conversion_rate", value: conversionRate, format: "pct" },
      { id: "cart_abandonment", value: cartAbandonment, format: "pct" },
      { id: "repeat_purchase", value: repeatPurchase, format: "pct" },
      { id: "return_rate", value: returnRate, format: "pct" },
      { id: "shipping_ratio", value: shippingCostRatio, format: "pct" },
      { id: "contribution_margin", value: contributionMargin, format: "pct" },
      { id: "clv", value: clv, format: "eur" },
    ],
    debug: {
      annualOrders: annualOrders,
      returnCost: returnCost,
      shippingCost: shippingCost,
      fulfillmentTotal: fulfillmentTotal,
      purchaseFrequency: purchaseFrequency,
    },
  };
}

function retailKpis(p) {
  var cfg = p.cfg;
  var revenue = p.totalRevenue;
  var storeSize = cfg.storeSize || 0;
  var headcount = (p.sals || []).filter(function (s) { return s.net > 0; }).length;
  var footfall = cfg.monthlyFootfall || 0;
  var transactions = cfg.monthlyTransactions || 0;
  var annualTransactions = transactions * 12;
  var shrinkage = cfg.shrinkageRate || 0.015;
  var itemsPerTransaction = cfg.avgItemsPerTransaction || 2.5;

  var revenuePerM2 = storeSize > 0 ? revenue / storeSize : 0;
  var salesPerEmployee = headcount > 0 ? revenue / headcount : 0;
  var footfallConversion = footfall > 0 ? transactions / footfall : 0;
  var avgTransactionValue = annualTransactions > 0 ? revenue / annualTransactions : 0;
  var shrinkageLoss = revenue * shrinkage;

  return {
    type: "retail",
    kpis: [
      { id: "revenue_per_m2", value: revenuePerM2, format: "eur" },
      { id: "sales_per_employee", value: salesPerEmployee, format: "eur" },
      { id: "footfall_conversion", value: footfallConversion, format: "pct" },
      { id: "avg_transaction", value: avgTransactionValue, format: "eur" },
      { id: "items_per_transaction", value: itemsPerTransaction, format: "number" },
      { id: "monthly_footfall", value: footfall, format: "number" },
      { id: "monthly_transactions", value: transactions, format: "number" },
      { id: "shrinkage_rate", value: shrinkage, format: "pct" },
      { id: "shrinkage_loss", value: shrinkageLoss, format: "eur" },
    ],
    debug: {
      storeSize: storeSize,
      annualTransactions: annualTransactions,
    },
  };
}

function servicesKpis(p) {
  var cfg = p.cfg;
  var revenue = p.totalRevenue;
  var hourlyRate = cfg.avgHourlyRate || 0;
  var consultants = cfg.consultantCount || (p.sals || []).filter(function (s) { return s.net > 0; }).length;
  var utilTarget = cfg.utilizationTarget || 0.75;
  var projectMargin = cfg.avgProjectMargin || 0.35;
  var clientRetention = cfg.clientRetentionRate || 0.85;
  var revenueConc = cfg.revenueConcentrationTop10 || 0.40;
  var pipeline = cfg.pipelineValue || 0;
  var projectWeeks = cfg.avgProjectDurationWeeks || 4;

  var revenuePerConsultant = consultants > 0 ? revenue / consultants : 0;

  // Available hours: ~1760h/year (220 days * 8h)
  var availableHours = consultants * 220 * 8;
  var billableHours = hourlyRate > 0 && revenue > 0 ? revenue / hourlyRate : availableHours * utilTarget;
  var actualUtilization = availableHours > 0 ? billableHours / availableHours : 0;

  var pipelineCoverage = revenue > 0 ? pipeline / revenue : 0;
  var backlogMonths = revenue > 0 ? (pipeline / (revenue / 12)) : 0;

  return {
    type: "services",
    kpis: [
      { id: "utilization", value: actualUtilization, format: "pct" },
      { id: "utilization_target", value: utilTarget, format: "pct" },
      { id: "hourly_rate", value: hourlyRate, format: "eur" },
      { id: "revenue_per_consultant", value: revenuePerConsultant, format: "eur" },
      { id: "project_margin", value: projectMargin, format: "pct" },
      { id: "pipeline_coverage", value: pipelineCoverage, format: "ratio" },
      { id: "backlog_months", value: backlogMonths, format: "months" },
      { id: "client_retention", value: clientRetention, format: "pct" },
      { id: "revenue_concentration", value: revenueConc, format: "pct" },
      { id: "avg_project_weeks", value: projectWeeks, format: "number" },
    ],
    debug: {
      consultants: consultants,
      availableHours: availableHours,
      billableHours: billableHours,
    },
  };
}

function freelancerKpis(p) {
  var cfg = p.cfg;
  var revenue = p.totalRevenue;
  var dailyRate = cfg.dailyRate || 0;
  var workingDays = cfg.workingDaysPerYear || 220;
  var vacation = cfg.vacationDays || 20;
  var socialRate = cfg.socialContributionRate || 0.2035;
  var daysBilled = cfg.daysBilled || 0;

  var availableDays = workingDays - vacation;
  var utilization = availableDays > 0 ? daysBilled / availableDays : 0;
  var revenuePerDay = daysBilled > 0 ? revenue / daysBilled : dailyRate;
  var maxRevenue = dailyRate * availableDays;

  var expenses = p.monthlyCosts * 12;
  var netProfessional = revenue - expenses;
  var socialContrib = netProfessional > 0 ? netProfessional * socialRate : 0;

  // IPP progressive brackets (Belgian 2026)
  var taxable = Math.max(netProfessional - socialContrib, 0);
  var tax = 0;
  var brackets = [
    { limit: 15820, rate: 0.25 },
    { limit: 27920, rate: 0.40 },
    { limit: 48320, rate: 0.45 },
    { limit: Infinity, rate: 0.50 },
  ];
  var prev = 0;
  brackets.forEach(function (b) {
    if (taxable > prev) {
      var slice = Math.min(taxable, b.limit) - prev;
      if (slice > 0) tax += slice * b.rate;
    }
    prev = b.limit;
  });
  var taxFree = Math.min(taxable * 0.25, 10160);
  tax = Math.max(tax - taxFree * 0.25, 0) * 1.07; // +7% communal

  var netAfterTax = netProfessional - socialContrib - tax;
  var quarterlyPayment = tax / 4;

  return {
    type: "freelancer",
    kpis: [
      { id: "daily_rate", value: dailyRate, format: "eur" },
      { id: "days_billed", value: daysBilled, format: "number" },
      { id: "available_days", value: availableDays, format: "number" },
      { id: "utilization", value: utilization, format: "pct" },
      { id: "revenue_per_day", value: revenuePerDay, format: "eur" },
      { id: "max_revenue", value: maxRevenue, format: "eur" },
      { id: "net_professional", value: netProfessional, format: "eur" },
      { id: "social_contributions", value: socialContrib, format: "eur" },
      { id: "tax_estimate", value: tax, format: "eur" },
      { id: "net_after_tax", value: netAfterTax, format: "eur" },
      { id: "quarterly_payment", value: quarterlyPayment, format: "eur" },
    ],
    debug: {
      availableDays: availableDays,
      taxable: taxable,
      taxFree: taxFree,
      socialRate: socialRate,
    },
  };
}

function genericKpis(p) {
  var revenue = p.totalRevenue;
  var headcount = (p.sals || []).filter(function (s) { return s.net > 0; }).length;
  var revenuePerEmployee = headcount > 0 ? revenue / headcount : 0;
  var ebitdaMargin = revenue > 0 ? p.ebitda / revenue : 0;
  var netMargin = revenue > 0 ? p.netP / revenue : 0;

  return {
    type: "other",
    kpis: [
      { id: "revenue_per_employee", value: revenuePerEmployee, format: "eur" },
      { id: "ebitda_margin", value: ebitdaMargin, format: "pct" },
      { id: "net_margin", value: netMargin, format: "pct" },
      { id: "headcount", value: headcount, format: "number" },
    ],
    debug: {},
  };
}

var CALCULATORS = {
  saas: saasKpis,
  ecommerce: ecommerceKpis,
  retail: retailKpis,
  services: servicesKpis,
  freelancer: freelancerKpis,
  other: genericKpis,
};

export function calcBusinessKpis(type, params) {
  var calc = CALCULATORS[type] || CALCULATORS.other;
  return calc(params);
}
