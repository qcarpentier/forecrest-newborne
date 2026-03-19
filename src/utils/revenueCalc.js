/**
 * Revenue stream calculation engine.
 * Each stream has a `behavior` determining how revenue is computed.
 */

var REVENUE_BEHAVIORS = {
  recurring:       { frequency: "monthly", driverKey: "clients",  pcmn: "7020" },
  per_transaction: { frequency: "monthly", driverKey: "orders",   pcmn: "7010" },
  per_user:        { frequency: "monthly", driverKey: "users",    pcmn: "7020" },
  project:         { frequency: "annual",  driverKey: "projects", pcmn: "7020" },
  daily_rate:      { frequency: "annual",  driverKey: "days",     pcmn: "7020" },
  one_time:        { frequency: "once",    driverKey: "units",    pcmn: "7500" },
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
    recurring:       { fr: "clients",  en: "clients" },
    per_transaction: { fr: "commandes/mois", en: "orders/mo" },
    per_user:        { fr: "utilisateurs", en: "users" },
    project:         { fr: "projets/an", en: "projects/yr" },
    daily_rate:      { fr: "jours/an", en: "days/yr" },
    one_time:        { fr: "unités", en: "units" },
  };
  var entry = labels[behavior] || labels.recurring;
  return lang === "en" ? entry.en : entry.fr;
}

// Get price label suffix for a behavior
export function getPriceLabel(behavior, lang) {
  var labels = {
    recurring:       { fr: "€/mois", en: "€/mo" },
    per_transaction: { fr: "€/transaction", en: "€/order" },
    per_user:        { fr: "€/utilisateur", en: "€/user" },
    project:         { fr: "€/projet", en: "€/project" },
    daily_rate:      { fr: "€/jour", en: "€/day" },
    one_time:        { fr: "€", en: "€" },
  };
  var entry = labels[behavior] || labels.recurring;
  return lang === "en" ? entry.en : entry.fr;
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
