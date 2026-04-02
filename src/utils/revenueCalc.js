/**
 * Revenue stream calculation engine.
 * Each stream has a `behavior` determining how revenue is computed.
 */

var REVENUE_BEHAVIORS = {
  recurring:       { frequency: "monthly", driverKey: "clients",      pcmn: "7020" },
  per_transaction: { frequency: "monthly", driverKey: "orders",       pcmn: "7010" },
  per_user:        { frequency: "monthly", driverKey: "users",        pcmn: "7020" },
  project:         { frequency: "annual",  driverKey: "projects",     pcmn: "7020" },
  daily_rate:      { frequency: "annual",  driverKey: "days",         pcmn: "7020" },
  hourly:          { frequency: "monthly", driverKey: "hours",        pcmn: "7020" },
  commission:      { frequency: "monthly", driverKey: "transactions", pcmn: "7030" },
  royalty:         { frequency: "monthly", driverKey: "licences",     pcmn: "7500" },
  one_time:        { frequency: "once",    driverKey: "units",        pcmn: "7500" },
  subsidy:         { frequency: "once",    driverKey: "units",        pcmn: "7300" },
  stock_variation: { frequency: "annual",  driverKey: "units",        pcmn: "7100" },
  capitalized_production: { frequency: "annual", driverKey: "units",  pcmn: "7200" },
};

export { REVENUE_BEHAVIORS };

export function calcStreamMonthly(item) {
  var b = REVENUE_BEHAVIORS[item.behavior];
  if (!b) b = REVENUE_BEHAVIORS.recurring;
  var price = item.price || 0;
  var qty = item.qty || 0;
  if (b.frequency === "monthly") return price * qty;
  if (b.frequency === "annual") return (price * qty) / 12;
  // one_time: not recurring, excluded from MRR
  return 0;
}

export function calcStreamAnnual(item) {
  var b = REVENUE_BEHAVIORS[item.behavior];
  if (!b) b = REVENUE_BEHAVIORS.recurring;
  var price = item.price || 0;
  var qty = item.qty || 0;
  if (b.frequency === "monthly") return price * qty * 12;
  if (b.frequency === "annual") return price * qty;
  if (b.frequency === "once") return price * qty;
  return 0;
}

export function calcStreamPcmn(item) {
  var b = REVENUE_BEHAVIORS[item.behavior];
  return b ? b.pcmn : "7020";
}

export function calcTotalRevenue(streams) {
  var total = 0;
  (streams || []).forEach(function (cat) {
    (cat.items || []).forEach(function (item) {
      total += calcStreamAnnual(item);
    });
  });
  return total;
}

export function calcTotalMRR(streams) {
  var total = 0;
  (streams || []).forEach(function (cat) {
    (cat.items || []).forEach(function (item) {
      total += calcStreamMonthly(item);
    });
  });
  return total;
}

// Get driver label for a behavior (for UI display)
export function getDriverLabel(behavior, lang) {
  var labels = {
    recurring:       { fr: "Clients",          en: "Clients" },
    per_transaction: { fr: "Commandes/mois",   en: "Orders/mo" },
    per_user:        { fr: "Utilisateurs",     en: "Users" },
    project:         { fr: "Projets/an",       en: "Projects/yr" },
    daily_rate:      { fr: "Jours/an",         en: "Days/yr" },
    hourly:          { fr: "Heures/mois",      en: "Hours/mo" },
    commission:      { fr: "Transactions/mois", en: "Transactions/mo" },
    royalty:         { fr: "Licences actives",  en: "Active licences" },
    one_time:        { fr: "Unités",           en: "Units" },
  };
  var entry = labels[behavior] || labels.recurring;
  return lang === "en" ? entry.en : entry.fr;
}

// Get price label suffix for a behavior
export function getPriceLabel(behavior, lang) {
  var labels = {
    recurring:       { fr: "€/mois",        en: "€/mo" },
    per_transaction: { fr: "€/transaction",  en: "€/order" },
    per_user:        { fr: "€/utilisateur",  en: "€/user" },
    project:         { fr: "€/projet",       en: "€/project" },
    daily_rate:      { fr: "€/jour",         en: "€/day" },
    hourly:          { fr: "€/heure",        en: "€/hr" },
    commission:      { fr: "€/transaction",  en: "€/transaction" },
    royalty:         { fr: "€/licence/mois", en: "€/licence/mo" },
    one_time:        { fr: "€",              en: "€" },
  };
  var entry = labels[behavior] || labels.recurring;
  return lang === "en" ? entry.en : entry.fr;
}

/**
 * Monthly breakdown with seasonality.
 * Returns array of 12 monthly values (Jan→Dec).
 * @param {object} item - stream item with behavior, price, qty, seasonProfile
 * @param {object} profiles - SEASONALITY_PROFILES map
 */
export function calcStreamMonthlyBreakdown(item, profiles) {
  var base = calcStreamMonthly(item);
  var profileKey = item.seasonProfile || "flat";
  var profile = (profiles && profiles[profileKey]) ? profiles[profileKey] : null;
  if (!profile) return [base, base, base, base, base, base, base, base, base, base, base, base];
  var coefs = profile.coefs || [];
  var sum = 0;
  for (var s = 0; s < 12; s++) sum += Number(coefs[s]) || 0;
  var scale = sum > 0 ? 12 / sum : 1;
  var result = [];
  for (var i = 0; i < 12; i++) {
    result.push(base * ((coefs[i] || 1) * scale));
  }
  return result;
}

/**
 * Aggregate monthly breakdown for all streams.
 * Returns array of 12 monthly totals.
 */
export function calcTotalMonthlyBreakdown(streams, profiles) {
  var totals = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  (streams || []).forEach(function (cat) {
    (cat.items || []).forEach(function (item) {
      var bd = calcStreamMonthlyBreakdown(item, profiles);
      for (var i = 0; i < 12; i++) { totals[i] += bd[i]; }
    });
  });
  return totals;
}

/**
 * Annual revenue for a stream in a given projection year.
 * Applies the stream's own growthRate (compound from year 1).
 */
export function calcStreamAnnualYear(item, year) {
  var base = calcStreamAnnual(item);
  var rate = item.growthRate || 0;
  if (year <= 1 || rate === 0) return base;
  return base * Math.pow(1 + rate, year - 1);
}

/**
 * Monthly revenue for a stream in a given projection year.
 * Applies the stream's own growthRate (compound from year 1).
 */
export function calcStreamMonthlyYear(item, year) {
  var base = calcStreamMonthly(item);
  var rate = item.growthRate || 0;
  if (year <= 1 || rate === 0) return base;
  return base * Math.pow(1 + rate, year - 1);
}

// Migrate old v1 format (y1-based) to v2 (behavior-based)
export function migrateStreamsV1ToV2(streams) {
  if (!streams || !streams.length) return streams;
  // Check if already v2
  if (streams[0].items && streams[0].items[0] && streams[0].items[0].behavior) return streams;
  // Check if v1 (has items with y1)
  if (streams[0].items && streams[0].items[0] && streams[0].items[0].y1 !== undefined) {
    return streams.map(function (cat) {
      return {
        cat: cat.cat || "Revenus",
        items: (cat.items || []).map(function (item) {
          var behavior = "recurring";
          if (item.pcmn === "7010") behavior = "per_transaction";
          if (item.pcmn === "7500" || item.pcmn === "7510" || item.pcmn === "7600") behavior = "one_time";
          if (item.pcmn === "7400" || item.pcmn === "7410") behavior = "one_time";

          var y1 = (item.y1 || 0) * (item.pu ? (item.u || 1) : 1);
          var price = y1 > 0 ? Math.round(y1 / 12 * 100) / 100 : 0;
          var qty = price > 0 ? 1 : 0;

          return {
            id: item.id || ("r" + Math.random().toString(36).slice(2, 8)),
            l: item.l || "Revenu",
            behavior: behavior,
            price: price,
            qty: qty,
            growthRate: 0,
          };
        }),
      };
    });
  }
  return streams;
}

/**
 * Calculate total monthly affiliate revenue.
 * Works with saved program data (commissionType is stored on each program).
 */
export function calcAffiliationProgramMonthly(program) {
  if (!program) return 0;
  var ct = program.commissionType || "recurring";
  var volume = program.volume || 0;
  var avgSale = program.avgSale || 0;
  var commission = program.commission || 0;
  var fromCommission = 0;
  if (ct === "recurring") {
    fromCommission = commission * avgSale * volume;
    if (program.churn > 0) fromCommission = fromCommission * (1 - (program.churn || 0));
  } else if (ct === "per_sale") {
    fromCommission = commission * avgSale * volume;
  } else {
    fromCommission = commission * volume;
  }
  if (program.cap > 0 && fromCommission > program.cap / 12) fromCommission = program.cap / 12;
  return fromCommission + (program.signupBonus || 0) * volume;
}

export function calcAffiliationMonthly(affiliation) {
  if (!affiliation || !affiliation.enabled || !affiliation.programs) return 0;
  var total = 0;
  affiliation.programs.forEach(function (program) {
    total += calcAffiliationProgramMonthly(program);
  });
  return total;
}
