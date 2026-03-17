// fee = base × varRate + fixFee
export function calcFee(base, varRate, fixFee) {
  return base * varRate + fixFee;
}

// Legacy rounding: snap to .50 if frac < 0.50, to next integer if frac > 0.60, else keep
export function roundEx(fee) {
  var frac = fee - Math.floor(fee);
  if (frac < 0.5) return Math.floor(fee) + 0.5;
  if (frac > 0.6) return Math.floor(fee) + 1;
  return fee;
}

// Parametric rounding: round UP to the nearest `step` (0.10, 0.25, 0.50, 1.00).
// step=0 means no rounding (exact).
export function roundStep(fee, step) {
  if (!step || step <= 0) return fee;
  return Math.ceil(fee / step) * step;
}

// Psychological rounding: round UP to the nearest integer then apply ending (.49 or .99).
// ending = 0.49 or 0.99. If fee is already below the ending, use it directly.
export function roundPsych(fee, ending) {
  if (!ending) return fee;
  var floor = Math.floor(fee);
  var target = floor + ending;
  if (fee <= target) return target;
  return floor + 1 + ending;
}

// Scale-based rounding: pick rounding step based on the fee amount.
// scale = [{ upTo: 1.00, step: 0.10 }, { upTo: 3.00, step: 0.25 }, ...]
// The last tier covers everything above (upTo is ignored / treated as Infinity).
export function roundScaled(fee, scale) {
  if (!scale || !scale.length) return fee;
  for (var i = 0; i < scale.length; i++) {
    if (i === scale.length - 1 || fee <= scale[i].upTo) {
      return roundStep(fee, scale[i].step);
    }
  }
  return fee;
}

// Apply a mix profile and/or cash override to a base payment methods array.
// Returns a new methods array with adjusted mix values.
// profileMix: { methodId: mixValue } from MIX_PROFILES (or null for global).
// cashOverride: number 0-1 (or null to keep profile default).
export function applyMixProfile(baseMethods, profileMix, cashOverride) {
  if (!baseMethods || !baseMethods.length) return baseMethods;
  // Start from profile mix or base methods
  var methods = baseMethods.map(function (m) {
    var mix = profileMix && profileMix[m.id] != null ? profileMix[m.id] : m.mix;
    return { ...m, mix: mix };
  });
  // Apply cash override: set cash mix, redistribute rest proportionally
  if (cashOverride != null) {
    var nonCashTotal = 0;
    for (var i = 0; i < methods.length; i++) {
      if (methods[i].id !== "cash") nonCashTotal += methods[i].mix;
    }
    var remaining = 1 - cashOverride;
    var scale = nonCashTotal > 0 ? remaining / nonCashTotal : 0;
    methods = methods.map(function (m) {
      if (m.id === "cash") return { ...m, mix: cashOverride };
      return { ...m, mix: m.mix * scale };
    });
  }
  return methods;
}

// Weighted Stripe cost across all payment methods.
// Returns { sc, perMethod } where perMethod[i] = cost for that method on `amount`.
export function stripeWeighted(amount, methods) {
  var sc = 0;
  var perMethod = [];
  for (var i = 0; i < methods.length; i++) {
    var m = methods[i];
    var cost = amount * m.sVar + m.sFix;
    perMethod.push({ id: m.id, cost: cost, weighted: m.mix * cost });
    sc += m.mix * cost;
  }
  return { sc: sc, perMethod: perMethod };
}

// Weighted GU commission across all payment methods.
// Returns blended fee = sum(mix * (basket * guVar + guFix)).
export function guWeighted(basket, methods) {
  var fee = 0;
  var perMethod = [];
  for (var i = 0; i < methods.length; i++) {
    var m = methods[i];
    var mFee = basket * (m.guVar || 0) + (m.guFix || 0);
    perMethod.push({ id: m.id, fee: mFee, weighted: m.mix * mFee });
    fee += m.mix * mFee;
  }
  return { fee: fee, perMethod: perMethod };
}

// Per-booking revenue calculation:
// gf = Σ(mix_i × (basket × guVar_i + guFix_i))   weighted GU commission
// rf = round(gf)                                  rounded fee (consumer-facing)
// cp = basket + clientFee                          client pays (basket + fee if bearer=client)
// sc = Σ(mix_i × (cp × sVar_i + sFix_i))          weighted Stripe processing cost
// netHT = (rf − sc) / (1 + TVA)                   net revenue excl. VAT
// Stripe Connect fees are per payout, not per transaction — see connectAnnual().
export function bkg(basket, cfg) {
  var methods = cfg.paymentMethods;
  var hasPerMethod = methods && methods.length > 0 && methods[0].guVar !== undefined;

  // Compute gross GU fee (blended across methods or legacy global)
  var gf;
  if (hasPerMethod) {
    gf = guWeighted(basket, methods).fee;
  } else {
    gf = calcFee(basket, cfg.varFee, cfg.fixFee);
  }

  // Rounding: scale-based, psychological (.49/.99), step, or legacy
  var rf;
  if (cfg.roundingPsych) {
    rf = roundPsych(gf, cfg.roundingPsych);
  } else if (cfg.roundingScale && cfg.roundingScale.length > 0) {
    rf = roundScaled(gf, cfg.roundingScale);
  } else {
    var step = cfg.roundingStep != null ? cfg.roundingStep : null;
    rf = step != null ? roundStep(gf, step) : roundEx(gf);
  }

  // Fee bearer determines what the client pays
  var bearer = cfg.feeBearer || "client";
  var clientFee = bearer === "pro" ? 0 : bearer === "split" ? rf / 2 : rf;
  var cp = basket + clientFee;
  var feel = basket > 0 ? gf / basket : 0;

  var sc, effSVar, effSFix;
  if (methods && methods.length > 0) {
    var sw = stripeWeighted(cp, methods);
    sc = sw.sc;
    effSVar = methods.reduce(function (s, m) { return s + m.mix * m.sVar; }, 0);
    effSFix = methods.reduce(function (s, m) { return s + m.mix * m.sFix; }, 0);
  } else {
    var tpe = cfg.tpeRatio != null ? cfg.tpeRatio : 1;
    effSVar = tpe * cfg.sVar + (1 - tpe) * (cfg.onlineSVar != null ? cfg.onlineSVar : 0.015);
    effSFix = tpe * cfg.sFix + (1 - tpe) * (cfg.onlineSFix != null ? cfg.onlineSFix : 0.25);
    sc = cp * effSVar + effSFix;
  }

  var st = sc;
  // GU keeps the rounding surplus: revenue = rounded fee, not raw fee
  var netHT = (rf - sc) / (1 + cfg.vat);
  return { gf, rf, cp, delta: rf - gf, feel, sc, sco: 0, st, netHT, effSVar, effSFix, bearer };
}

// Annual Stripe Connect costs for one establishment:
// annPayoutFee = basket × medY × cVar + payoutsPerYear × cFix
// annAccountFee = connectMonthly × 12
// payoutsPerYear = payPerMonth × 12 × opW/52
export function connectAnnual(basket, volStats, cfg) {
  var cVar = cfg.cVar != null ? cfg.cVar : 0.0025;
  var cFix = cfg.cFix != null ? cfg.cFix : 0.10;
  var monthly = cfg.connectMonthly != null ? cfg.connectMonthly : 2;
  var payPerMonth = cfg.payoutsPerMonth != null ? cfg.payoutsPerMonth : 4;
  // Scale payouts to operating weeks (opW out of 52)
  var payoutsPerYear = payPerMonth * 12 * volStats.opW / 52;
  var annPayoutFee = basket * volStats.medY * cVar + payoutsPerYear * cFix;
  var annAccountFee = monthly * 12;
  return { annPayoutFee, annAccountFee, payoutsPerYear: Math.round(payoutsPerYear), total: annPayoutFee + annAccountFee };
}

// Volume: daily capacity and staffed bookings → annual totals
// capD = floor(hd×60 / dur) × min(chairs, emp) × occ   daily capacity
// opW = 52 − closedW                                    operating weeks/year
// medY = (capD + stfD)/2 × dw × opW                     median annual bookings
export function vol(prof) {
  var ch = prof.chairs || prof.emp;
  var eff = Math.min(ch, prof.emp);
  var capD = Math.floor((prof.hd * 60) / prof.dur) * eff * prof.occ;
  var stfD = prof.bkgD ? prof.bkgD * eff : capD;
  var cW = capD * prof.dw;
  var sW = stfD * prof.dw;
  var mW = (cW + sW) / 2;
  // closedW: semaines de fermeture (congés légaux ~4 sem, extra-légaux ~1 sem, fermeture sectorielle ~1 sem = 6 par défaut)
  var opW = 52 - (prof.closedW != null ? prof.closedW : 6);
  return { capY: cW * opW, stfY: sW * opW, medY: mW * opW, opW };
}

export function tier(netYearly, feel, tiers, feelLimits) {
  if (netYearly >= tiers.S && feel <= feelLimits.good) return "S";
  if (netYearly >= tiers.A && feel <= feelLimits.acc) return "A";
  if (netYearly >= tiers.B) return "B";
  if (netYearly >= tiers.C) return "C";
  return "D";
}

// Commission = netFeesYear × rate × (durationMonths / 12)
// netFeesYear = netYr × signed (net revenue HT after Stripe, VAT & Connect)
// rate: internal = internalPct (15%), external = tier-based (silver/gold/diamond)
export function commissionCalc(prof, cfg) {
  var so = prof.salesOwner;
  if (!so || so.type === "none" || prof.signed <= 0) {
    return { annual: 0, monthly: 0, rate: 0, isInternal: false, employeeId: null, partnerName: null, partnerTier: null };
  }
  var comm = cfg.commissions || {};
  var netFeesYear = (prof.netYr || 0) * prof.signed;
  var rate = 0;
  var isInternal = so.type === "internal";

  if (isInternal) {
    rate = comm.internalPct || 0.15;
  } else {
    var tierCfg = (comm.tiers || {})[so.partnerTier || "silver"];
    rate = tierCfg ? tierCfg.pct : 0.05;
  }

  var months = comm.durationMonths || 12;
  var annual = netFeesYear * rate * (months / 12);
  return {
    annual: annual,
    monthly: annual / 12,
    rate: rate,
    isInternal: isInternal,
    employeeId: isInternal ? so.employeeId : null,
    partnerName: !isInternal ? (so.partnerName || "") : null,
    partnerTier: !isInternal ? (so.partnerTier || "silver") : null,
  };
}

// Belgian ISOC (corporate tax) — two-bracket progressive:
// isocR = min(EBITDA, 100k) × 20%           reduced rate (PME)
// isocS = max(EBITDA − 100k, 0) × 25%       standard rate
// isocEff = (isocR + isocS) / EBITDA         effective tax rate
// resLeg = min(netP × 5%, capitalSocial × 10%)  legal reserve cap
export function calcIsoc(ebitda, capitalSocial) {
  var isocR = ebitda > 0 ? Math.min(ebitda, 100000) * 0.20 : 0;
  var isocS = ebitda > 100000 ? (ebitda - 100000) * 0.25 : 0;
  var isoc = isocR + isocS;
  var isocEff = ebitda > 0 ? isoc / ebitda : 0;
  var netP = ebitda - isoc;
  var resLeg = netP > 0 ? Math.min(netP * 0.05, capitalSocial * 0.10) : 0;
  return { isocR, isocS, isoc, isocEff, netP, resLeg };
}

// Monthly MRR from extra revenue streams (Shine, sponsored, proSub, marketplace, brandData, brandAds, enterprise).
// totS = total signed prospects, revActiveUsers = active app users.
export function calcExtraStreamsMRR(rev, totS, revActiveUsers) {
  var en = rev.enabled || {};
  return (
    (en.shine !== false ? Math.round(revActiveUsers * rev.shine.conversionRate) * rev.shine.price : 0) +
    (en.sponsored !== false ? Math.round(totS * rev.sponsored.adoptionRate) * rev.sponsored.bookingsPerMonth * rev.sponsored.cpa : 0) +
    (en.proSub !== false ? Math.round(totS * rev.proSub.conversionRate) * rev.proSub.priceWeek * 4.33 : 0) +
    (en.marketplace !== false ? Math.round(totS * rev.marketplace.adoptionRate) * rev.marketplace.ordersPerProMonth * rev.marketplace.avgOrderValue * rev.marketplace.commissionRate : 0) +
    (en.brandData !== false ? rev.brandData.clients * rev.brandData.monthlyPrice : 0) +
    (en.brandAds !== false ? revActiveUsers * rev.brandAds.impressionsPerUser * rev.brandAds.fillRate * rev.brandAds.cpm / 1000 : 0) +
    (en.enterprise !== false ? rev.enterprise.clients * rev.enterprise.avgEmployees * rev.enterprise.adoptionRate * rev.enterprise.feePerEmployee : 0) +
    (en.whiteLabel !== false && rev.whiteLabel ? rev.whiteLabel.clients * (rev.whiteLabel.monthlyLicense + rev.whiteLabel.avgEstablishmentsPerClient * rev.whiteLabel.avgMonthlyBookingsPerEstablishment * rev.whiteLabel.avgBasketPerEstablishment * rev.whiteLabel.revenueSharePct) : 0)
  );
}

// Belgian salary reverse calculation:
// brutO = net / (1 − onss − prec)        gross salary from net
// onssV = brutO × onss                   employee ONSS (13.07%)
// precV = brutO × prec                   withholding tax (17.23%)
// patrV = brutO × patr                   employer ONSS (25.07%)
// brutE = brutO + patrV                  total employer cost
export function salCalc(net, onss, prec, patr) {
  if (!net || net <= 0) {
    return { net: 0, brutO: 0, brutE: 0, onssV: 0, precV: 0, patrV: 0, total: 0 };
  }
  var brutO = net / (1 - onss - prec);
  var onssV = brutO * onss;
  var precV = brutO * prec;
  var patrV = brutO * patr;
  var brutE = brutO + patrV;
  return { net, brutO, brutE, onssV, precV, patrV, total: brutE };
}

// Belgian independant / freelancer calculation:
// Social contributions ~20.5% of net professional income (quarterly provisional)
// IPP (personal income tax) via progressive brackets (2026 rates)
export function indepCalc(netAnnual) {
  if (!netAnnual || netAnnual <= 0) {
    return { netAnnual: 0, socialContrib: 0, taxEstimate: 0, netAfterTax: 0, netMonthly: 0, totalCost: 0 };
  }
  var socialPct = 0.205;
  var socialContrib = netAnnual * socialPct;

  // Taxable income after social deduction
  var taxable = Math.max(netAnnual - socialContrib, 0);

  // Belgian progressive tax brackets (IPP 2026)
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

  // Tax-free allowance (~10.160€ in 2026)
  var taxFree = Math.min(taxable * 0.25, 10160);
  tax = Math.max(tax - taxFree * 0.25, 0);

  // Municipal tax surcharge (~7% average)
  tax = tax * 1.07;

  var netAfterTax = netAnnual - socialContrib - tax;
  return {
    netAnnual: netAnnual,
    socialContrib: socialContrib,
    taxEstimate: tax,
    netAfterTax: netAfterTax,
    netMonthly: netAfterTax / 12,
    totalCost: netAnnual, // For independants, the net income IS the business cost
  };
}

// ── Infrastructure benchmark & cost engine ──────────────────────────────────
// ── Bi-profile helpers ──────────────────────────────────────────────────────

function profileVolumes(p, sessions, users, mul) {
  var reqs = sessions * (p.workerReqsPerSession || 0) * mul;
  // D1 bills per ROW read, not per query — multiply by avgRowsPerQuery
  var rowMul = p.avgRowsPerQuery || 1;
  var sqlQueries = sessions * (p.sqlReadsPerSession || 0) * mul;
  return {
    mWorkerReqs: reqs,
    mCpuMs: reqs * (p.cpuMsPerReq || 0),
    mSqlQueries: sqlQueries,                          // actual query count (for latency)
    mSqlReads: sqlQueries * rowMul,                    // billed row reads (for cost)
    mSqlWrites: sessions * (p.sqlWritesPerSession || 0) * mul,
    mKvReads: sessions * (p.kvReadsPerSession || 0) * mul,
    mKvWrites: sessions * (p.kvWritesPerSession || 0) * mul,
    mR2Reads: sessions * (p.r2ReadsPerSession || 0) * mul,
    mR2Writes: sessions * (p.r2WritesPerSession || 0) * mul,
    mQueueOps: sessions * (p.queueMsgsPerSession || 0) * mul * 3,
    mLogEvents: sessions * (p.logEventsPerSession || 0) * mul,
    mDoReqs: sessions * (p.doRequestsPerSession || 0) * mul,
    mDoGbSec: sessions * (p.doGbSecPerSession || 0) * mul,
    mImageTransforms: sessions * (p.imageTransformsPerSession || 0) * mul,
    sqlStorageGB: users * (p.sqlKBPerUser || 0) / 1000000,
    kvStorageGB: users * (p.kvKBPerUser || 0) / 1000000,
    r2StorageGB: users * (p.r2MBPerUser || 0) / 1000,
    totalUsers: users,
    totalSessions: sessions,
  };
}

function sumVolumes(a, b) {
  var r = {};
  var keys = Object.keys(a);
  for (var i = 0; i < keys.length; i++) {
    r[keys[i]] = (a[keys[i]] || 0) + (b[keys[i]] || 0);
  }
  return r;
}

// Computes monthly volumes, overage costs per Cloudflare service, capacity
// analysis (RPS, CPU utilisation, concurrency), and bottleneck detection.
// Supports bi-profile mode when infra.profiles is present.
// Pricing from: developers.cloudflare.com/workers|d1|kv|r2|queues/pricing
// Uses decimal GB (1 GB = 1 000 000 KB) per cloud provider convention.
export function infraCost(infra, totalClients) {
  var zero = {
    totalUsers: 0, totalSessions: 0, totalClients: 0, monthly: 0, overageCost: 0, planBaseCost: 0,
    costPerClient: 0, costPerUser: 0,
    workersCost: 0, d1Cost: 0, kvCost: 0, r2Cost: 0, queuesCost: 0, logsCost: 0, authCost: 0, doCost: 0,
    imagesCost: 0,
    workerReqCost: 0, cpuCost: 0, sqlReadCost: 0, sqlWriteCost: 0, sqlStorageCost: 0,
    kvReadCost: 0, kvWriteCost: 0, kvStorageCost: 0,
    r2ReadCost: 0, r2WriteCost: 0, r2StorageCost: 0, queueOpCost: 0, logEventCost: 0,
    doReqCost: 0, doGbSecCost: 0,
    mWorkerReqs: 0, mCpuMs: 0, mSqlReads: 0, mSqlWrites: 0, mKvReads: 0, mKvWrites: 0,
    mR2Reads: 0, mR2Writes: 0, effectiveR2Reads: 0, mQueueOps: 0, mLogEvents: 0, mDoReqs: 0, mDoGbSec: 0,
    mImageTransforms: 0,
    sqlStorageGB: 0, kvStorageGB: 0, r2StorageGB: 0,
    avgRPS: 0, activeRPS: 0, peakRPS: 0, cpuUtilPerReq: 0, concurrentAtPeak: 0,
    p50Latency: 0, p99Latency: 0,
    quotaUsage: [], bottleneck: null, maxClients: Infinity,
    consumerData: null, proData: null, profileMode: false,
  };
  if (!infra) return zero;

  // Allow establishments to be decoupled from pipeline
  totalClients = infra.simulatedClients > 0 ? infra.simulatedClients : totalClients;

  var hasProfiles = infra.profiles && infra.profiles.consumer && infra.profiles.pro;
  var intensityMul = 1;
  if (infra.loadIntensity) {
    var INTENSITIES = [
      { id: "conservative", multiplier: 0.6 }, { id: "moderate", multiplier: 0.8 },
      { id: "baseline", multiplier: 1.0 }, { id: "aggressive", multiplier: 1.5 },
      { id: "stress_test", multiplier: 2.5 },
    ];
    for (var li = 0; li < INTENSITIES.length; li++) {
      if (INTENSITIES[li].id === infra.loadIntensity) { intensityMul = INTENSITIES[li].multiplier; break; }
    }
  }

  var upc = infra.usersPerClient || 0;
  var spm = infra.sessionsPerUserMonth || 0;
  var storageFactor = Math.min(infra.dataAgeMonths || 1, infra.dataRetentionMonths || 12);

  var totalUsers, totalSessions, mWorkerReqs, mCpuMs, mSqlQueries, mSqlReads, mSqlWrites;
  var mKvReads, mKvWrites, mR2Reads, mR2Writes, mQueueOps, mLogEvents, mDoReqs, mDoGbSec;
  var mImageTransforms;
  var sqlStorageGB, kvStorageGB, r2StorageGB;
  var consumerData = null, proData = null, profileMode = false;

  if (hasProfiles) {
    profileMode = true;
    var cp = infra.profiles.consumer;
    var pp = infra.profiles.pro;
    var consumerUsers, proUsers;
    if (infra.simulatedUsers > 0) {
      // Manual override: distribute proportionally
      var cBase = infra.consumerUsers || 0;
      var pBase = totalClients * (infra.proUsersPerClient || 0);
      var sumBase = cBase + pBase || 1;
      consumerUsers = Math.round(infra.simulatedUsers * cBase / sumBase);
      proUsers = infra.simulatedUsers - consumerUsers;
    } else {
      // Consumer users: direct count (decoupled from establishments)
      // Pro users: per-establishment (staff)
      // Fallback to legacy usersPerClient × clients only if consumerUsers is undefined (old snapshots)
      consumerUsers = infra.consumerUsers != null ? infra.consumerUsers : (totalClients * upc);
      proUsers = totalClients * (infra.proUsersPerClient || 0);
    }
    var consumerSessions = consumerUsers * spm;
    var proSessions = proUsers * spm;

    consumerData = profileVolumes(cp, consumerSessions, consumerUsers, intensityMul);
    consumerData.sqlStorageGB *= storageFactor;
    consumerData.kvStorageGB *= storageFactor;
    consumerData.r2StorageGB *= storageFactor;
    proData = profileVolumes(pp, proSessions, proUsers, intensityMul);
    proData.sqlStorageGB *= storageFactor;
    proData.kvStorageGB *= storageFactor;
    proData.r2StorageGB *= storageFactor;
    var combined = sumVolumes(consumerData, proData);

    totalUsers = combined.totalUsers;
    totalSessions = combined.totalSessions;
    mWorkerReqs = combined.mWorkerReqs; mCpuMs = combined.mCpuMs;
    mSqlQueries = combined.mSqlQueries; mSqlReads = combined.mSqlReads; mSqlWrites = combined.mSqlWrites;
    mKvReads = combined.mKvReads; mKvWrites = combined.mKvWrites;
    mR2Reads = combined.mR2Reads; mR2Writes = combined.mR2Writes;
    mQueueOps = combined.mQueueOps; mLogEvents = combined.mLogEvents;
    mDoReqs = combined.mDoReqs; mDoGbSec = combined.mDoGbSec;
    mImageTransforms = combined.mImageTransforms;
    sqlStorageGB = combined.sqlStorageGB; kvStorageGB = combined.kvStorageGB;
    r2StorageGB = combined.r2StorageGB;
  } else {
    // Legacy single-profile path (backward compat)
    totalUsers = infra.simulatedUsers > 0 ? infra.simulatedUsers : totalClients * upc;
    totalSessions = totalUsers * spm;
    mWorkerReqs = totalSessions * (infra.workerReqsPerSession || 0) * intensityMul;
    mCpuMs = mWorkerReqs * (infra.cpuMsPerReq || 0);
    var legacyRowMul = infra.avgRowsPerQuery || 1;
    mSqlQueries = totalSessions * (infra.sqlReadsPerSession || 0) * intensityMul;
    mSqlReads = mSqlQueries * legacyRowMul;
    mSqlWrites = totalSessions * (infra.sqlWritesPerSession || 0) * intensityMul;
    mKvReads = totalSessions * (infra.kvReadsPerSession || 0) * intensityMul;
    mKvWrites = totalSessions * (infra.kvWritesPerSession || 0) * intensityMul;
    mR2Reads = totalSessions * (infra.r2ReadsPerSession || 0) * intensityMul;
    mR2Writes = totalSessions * (infra.r2WritesPerSession || 0) * intensityMul;
    var opsPerMsg = infra.queueOpsPerMessage || 3;
    mQueueOps = totalSessions * (infra.queueMsgsPerSession || 0) * intensityMul * opsPerMsg;
    mLogEvents = totalSessions * (infra.logEventsPerSession || 0) * intensityMul;
    mDoReqs = totalSessions * (infra.doRequestsPerSession || 0) * intensityMul;
    mDoGbSec = totalSessions * (infra.doGbSecPerSession || 0) * intensityMul;
    mImageTransforms = totalSessions * (infra.imageTransformsPerSession || 0) * intensityMul;
    sqlStorageGB = totalUsers * (infra.sqlKBPerUser || 0) / 1000000 * storageFactor;
    kvStorageGB = totalUsers * (infra.kvKBPerUser || 0) / 1000000 * storageFactor;
    r2StorageGB = totalUsers * (infra.r2MBPerUser || 0) / 1000 * storageFactor;
  }

  // effectiveR2Reads = mR2Reads × (1 − cacheHitRate) — only cache misses billed
  var r2CacheHitRate = infra.r2CacheHitRate || 0;
  var effectiveR2Reads = mR2Reads * (1 - r2CacheHitRate);

  // overageCost = max(0, usage − quota) × unitPrice per service
  function ov(total, quota) { return Math.max(0, total - (quota || 0)); }

  var workerReqCost = ov(mWorkerReqs, infra.quotaWorkerReqs) * (infra.workerReqPrice || 0);
  var cpuCost = ov(mCpuMs, infra.quotaCpuMs) * (infra.cpuMsPrice || 0);
  var sqlReadCost = ov(mSqlReads, infra.quotaSqlReads) * (infra.sqlReadPrice || 0);
  var sqlWriteCost = ov(mSqlWrites, infra.quotaSqlWrites) * (infra.sqlWritePrice || 0);
  var sqlStorageCost = ov(sqlStorageGB, infra.quotaSqlStorageGB) * (infra.sqlStoragePrice || 0);
  var kvReadCost = ov(mKvReads, infra.quotaKvReads) * (infra.kvReadPrice || 0);
  var kvWriteCost = ov(mKvWrites, infra.quotaKvWrites) * (infra.kvWritePrice || 0);
  var kvStorageCost = ov(kvStorageGB, infra.quotaKvStorageGB) * (infra.kvStoragePrice || 0);
  // R2 reads: use effective reads (after CDN cache) for cost
  var r2ReadCost = ov(effectiveR2Reads, infra.quotaR2Reads) * (infra.r2ReadPrice || 0);
  var r2WriteCost = ov(mR2Writes, infra.quotaR2Writes) * (infra.r2WritePrice || 0);
  var r2StorageCost = ov(r2StorageGB, infra.quotaR2StorageGB) * (infra.r2StoragePrice || 0);
  var queueOpCost = ov(mQueueOps, infra.quotaQueueOps) * (infra.queueOpPrice || 0);
  var logEventCost = ov(mLogEvents, infra.quotaLogEvents) * (infra.logEventPrice || 0);
  var doReqCost = ov(mDoReqs, infra.quotaDoReqs) * (infra.doReqPrice || 0);
  var doGbSecCost = ov(mDoGbSec, infra.quotaDoGbSec) * (infra.doGbSecPrice || 0);
  var authCost = totalSessions * (infra.authCostPerLogin || 0);
  // Cloudflare Images: $1/1000 transformations (resize, WebP, AVIF)
  var imagesCost = mImageTransforms * (infra.imageTransformPrice || 0);

  // ── Service totals ──
  var workersCost = workerReqCost + cpuCost;
  var d1Cost = sqlReadCost + sqlWriteCost + sqlStorageCost;
  var kvCost = kvReadCost + kvWriteCost + kvStorageCost;
  var r2Cost = r2ReadCost + r2WriteCost + r2StorageCost;
  var queuesCost = queueOpCost;
  var logsCost = logEventCost;
  var doCost = doReqCost + doGbSecCost;
  var overageCost = workersCost + d1Cost + kvCost + r2Cost + queuesCost + logsCost + doCost + authCost + imagesCost;
  var planBaseCost = infra.planBaseCost || 0;
  var monthly = planBaseCost + overageCost;

  // ── Unit economics ──
  var costPerClient = totalClients > 0 ? monthly / totalClients : 0;
  var costPerUser = totalUsers > 0 ? monthly / totalUsers : 0;

  // ── Capacity analysis ──
  // avgRPS = reqs / secsInMonth
  // activeRPS = reqs / (activeH × 3600 × activeD × 30/7)
  // peakRPS = activeRPS × peakMultiplier
  // concurrency = peakRPS × sessionDuration / reqsPerSession
  var activeH, activeD, peakMul, wCpuMs, wSessionDur, wReqsPerSess, wNetworkMs;
  if (profileMode) {
    var cSess = consumerData.totalSessions;
    var pSess = proData.totalSessions;
    var allSess = cSess + pSess || 1;
    var cReqs = consumerData.mWorkerReqs;
    var pReqs = proData.mWorkerReqs;
    var allReqs = cReqs + pReqs || 1;
    var cP = infra.profiles.consumer;
    var pP = infra.profiles.pro;
    activeH = Math.max(cP.activeHoursPerDay || 10, pP.activeHoursPerDay || 10);
    activeD = Math.max(cP.activeDaysPerWeek || 6, pP.activeDaysPerWeek || 6);
    peakMul = Math.max(cP.peakMultiplier || 1, pP.peakMultiplier || 1);
    wCpuMs = (cReqs * (cP.cpuMsPerReq || 0) + pReqs * (pP.cpuMsPerReq || 0)) / allReqs;
    wSessionDur = (cSess * (cP.avgSessionDurationSec || 90) + pSess * (pP.avgSessionDurationSec || 90)) / allSess;
    wReqsPerSess = allReqs / allSess;
    wNetworkMs = (cSess * (cP.networkOverheadMs || 15) + pSess * (pP.networkOverheadMs || 15)) / allSess;
  } else {
    activeH = infra.activeHoursPerDay || 10;
    activeD = infra.activeDaysPerWeek || 6;
    peakMul = infra.peakMultiplier || 1;
    wCpuMs = infra.cpuMsPerReq || 0;
    wSessionDur = infra.avgSessionDurationSec || 180;
    wReqsPerSess = infra.workerReqsPerSession || 1;
    wNetworkMs = infra.networkOverheadMs || 15;
  }
  var activeSecsMonth = activeH * 3600 * activeD * (30 / 7);
  var secsInMonth = 30 * 86400;
  var avgRPS = mWorkerReqs / secsInMonth;
  var activeRPS = activeSecsMonth > 0 ? mWorkerReqs / activeSecsMonth : 0;
  var peakRPS = activeRPS * peakMul;
  var cpuUtilPerReq = wCpuMs / (infra.maxCpuMsPerReq || 30000);
  var concurrentAtPeak = wReqsPerSess > 0 ? peakRPS * wSessionDur / wReqsPerSess : 0;

  // ── Latency estimation ──
  // ioLatency = (sqlQueries+sqlWrites)/reqs × d1RttMs + (kvReads+kvWrites)/reqs × kvRttMs
  // p50 = cpuMs + networkMs + ioLatency
  // p99 = cpuMs × 2.5 + networkMs + ioLatency × 2
  // Uses mSqlQueries (actual query count) not mSqlReads (row-inflated for billing)
  var d1QueriesPerReq = mWorkerReqs > 0 ? (mSqlQueries + mSqlWrites) / mWorkerReqs : 0;
  var kvOpsPerReq = mWorkerReqs > 0 ? (mKvReads + mKvWrites) / mWorkerReqs : 0;
  var d1RttMs = infra.d1LatencyMs || 2;   // ~2ms per D1 query (same-region)
  var kvRttMs = infra.kvLatencyMs || 15;   // ~15ms avg KV read (global, cached ~5ms)
  var ioLatency = d1QueriesPerReq * d1RttMs + kvOpsPerReq * kvRttMs;
  var p50Latency = wCpuMs + wNetworkMs + ioLatency;
  var p99Latency = wCpuMs * 2.5 + wNetworkMs + ioLatency * 2;

  // ── Bottleneck analysis ──
  var quotaUsage = [
    { service: "Workers", metric: "requests", usage: mWorkerReqs, quota: infra.quotaWorkerReqs || 0, cost: workerReqCost },
    { service: "Workers", metric: "cpu_ms", usage: mCpuMs, quota: infra.quotaCpuMs || 0, cost: cpuCost },
    { service: "D1", metric: "reads", usage: mSqlReads, quota: infra.quotaSqlReads || 0, cost: sqlReadCost },
    { service: "D1", metric: "writes", usage: mSqlWrites, quota: infra.quotaSqlWrites || 0, cost: sqlWriteCost },
    { service: "D1", metric: "storage_gb", usage: sqlStorageGB, quota: infra.quotaSqlStorageGB || 0, cost: sqlStorageCost },
    { service: "KV", metric: "reads", usage: mKvReads, quota: infra.quotaKvReads || 0, cost: kvReadCost },
    { service: "KV", metric: "writes", usage: mKvWrites, quota: infra.quotaKvWrites || 0, cost: kvWriteCost },
    { service: "KV", metric: "storage_gb", usage: kvStorageGB, quota: infra.quotaKvStorageGB || 0, cost: kvStorageCost },
    { service: "R2", metric: "reads", usage: effectiveR2Reads, quota: infra.quotaR2Reads || 0, cost: r2ReadCost },
    { service: "R2", metric: "writes", usage: mR2Writes, quota: infra.quotaR2Writes || 0, cost: r2WriteCost },
    { service: "R2", metric: "storage_gb", usage: r2StorageGB, quota: infra.quotaR2StorageGB || 0, cost: r2StorageCost },
    { service: "Queues", metric: "operations", usage: mQueueOps, quota: infra.quotaQueueOps || 0, cost: queueOpCost },
    { service: "Logs", metric: "events", usage: mLogEvents, quota: infra.quotaLogEvents || 0, cost: logEventCost },
    { service: "DO", metric: "requests", usage: mDoReqs, quota: infra.quotaDoReqs || 0, cost: doReqCost },
    { service: "DO", metric: "gb_sec", usage: mDoGbSec, quota: infra.quotaDoGbSec || 0, cost: doGbSecCost },
  ];
  // ratio = usage/quota. When quota=0 and usage>0, ratio = Infinity (hard limit exceeded)
  quotaUsage.forEach(function (q) { q.ratio = q.quota > 0 ? q.usage / q.quota : (q.usage > 0 ? Infinity : 0); });
  quotaUsage.sort(function (a, b) { return a.ratio === b.ratio ? 0 : (b.ratio > a.ratio ? 1 : -1); });
  var bottleneck = quotaUsage[0] || null;
  var maxClients = bottleneck && bottleneck.ratio > 0
    ? Math.floor(totalClients / bottleneck.ratio)
    : Infinity;

  return {
    totalUsers: totalUsers, totalSessions: totalSessions, totalClients: totalClients,
    monthly: monthly, overageCost: overageCost, planBaseCost: planBaseCost,
    costPerClient: costPerClient, costPerUser: costPerUser,
    workersCost: workersCost, d1Cost: d1Cost, kvCost: kvCost, r2Cost: r2Cost,
    queuesCost: queuesCost, logsCost: logsCost, authCost: authCost, doCost: doCost,
    imagesCost: imagesCost,
    workerReqCost: workerReqCost, cpuCost: cpuCost,
    sqlReadCost: sqlReadCost, sqlWriteCost: sqlWriteCost, sqlStorageCost: sqlStorageCost,
    kvReadCost: kvReadCost, kvWriteCost: kvWriteCost, kvStorageCost: kvStorageCost,
    r2ReadCost: r2ReadCost, r2WriteCost: r2WriteCost, r2StorageCost: r2StorageCost,
    queueOpCost: queueOpCost, logEventCost: logEventCost,
    doReqCost: doReqCost, doGbSecCost: doGbSecCost,
    mWorkerReqs: mWorkerReqs, mCpuMs: mCpuMs,
    mSqlReads: mSqlReads, mSqlWrites: mSqlWrites,
    mKvReads: mKvReads, mKvWrites: mKvWrites,
    mR2Reads: mR2Reads, mR2Writes: mR2Writes, effectiveR2Reads: effectiveR2Reads,
    mQueueOps: mQueueOps, mLogEvents: mLogEvents,
    mDoReqs: mDoReqs, mDoGbSec: mDoGbSec,
    mImageTransforms: mImageTransforms,
    sqlStorageGB: sqlStorageGB, kvStorageGB: kvStorageGB, r2StorageGB: r2StorageGB,
    avgRPS: avgRPS, activeRPS: activeRPS, peakRPS: peakRPS,
    cpuUtilPerReq: cpuUtilPerReq, concurrentAtPeak: concurrentAtPeak,
    p50Latency: p50Latency, p99Latency: p99Latency,
    quotaUsage: quotaUsage, bottleneck: bottleneck, maxClients: maxClients,
    consumerData: consumerData, proData: proData, profileMode: profileMode,
  };
}

// ── Marketing Digital cost engine ─────────────────────────────────────────────
// Computes per-channel funnel metrics, blended CAC, ROAS, LTV/CAC.
// marketing = null → returns zero object (module disabled).
//
// Per-channel formulas:
//   Meta:        impressions = budget/cpm × 1000, clicks = imp × ctr, clients = clicks × conv × trial
//   Google:      clicks = budget/cpc, leads = clicks × conv, clients = leads × leadToClient
//   Influencers: reach = count × reachPer, engaged = reach × engRate, clients = engaged × conv
//   SEO:         leads = traffic × conv, clients = leads × leadToClient
//   Email:       opens = list × openRate × campaigns, clicks = opens × clickRate, conv = clicks × conv
//
// Blended: CAC = totalSpend / totalClients, ROAS = revenue / spend, LTV = ARPU / churn
export function marketingCalc(marketing, totalClients, arrV, churnMonthly) {
  var zero = {
    monthly: 0, annual: 0,
    channels: {
      meta: { budget: 0, impressions: 0, clicks: 0, leads: 0, clients: 0, cpc: 0, cpa: 0 },
      google: { budget: 0, clicks: 0, leads: 0, clients: 0, cpc: 0, cpa: 0 },
      influencers: { budget: 0, reach: 0, engaged: 0, clients: 0, cpa: 0 },
      seo: { budget: 0, traffic: 0, leads: 0, clients: 0, cpa: 0 },
      email: { budget: 0, opens: 0, clicks: 0, conversions: 0, cpa: 0 },
    },
    funnel: { totalImpressions: 0, totalClicks: 0, totalLeads: 0, totalClients: 0 },
    cacBlended: 0, roas: 0, ltv: 0, ltvCac: 0,
    niches: [],
  };
  if (!marketing) return zero;

  // ── Meta Ads ──
  var mc = marketing.meta || {};
  var metaBudget = mc.enabled !== false ? (mc.budget || 0) : 0;
  var metaImpressions = mc.cpm > 0 ? metaBudget / mc.cpm * 1000 : 0;
  var metaClicks = metaImpressions * (mc.ctr || 0);
  var metaLeads = metaClicks * (mc.convRate || 0);
  var metaClients = metaLeads * (mc.trialToClient || 0);
  var metaCpc = metaClicks > 0 ? metaBudget / metaClicks : 0;
  var metaCpa = metaClients > 0 ? metaBudget / metaClients : 0;

  // ── Google Ads ──
  var gc = marketing.google || {};
  var googleBudget = gc.enabled !== false ? (gc.budget || 0) : 0;
  var googleClicks = gc.cpcAvg > 0 ? googleBudget / gc.cpcAvg : 0;
  var googleLeads = googleClicks * (gc.convRate || 0);
  var googleClients = googleLeads * (gc.leadToClient || 0);
  var googleCpc = gc.cpcAvg || 0;
  var googleCpa = googleClients > 0 ? googleBudget / googleClients : 0;

  // ── Influenceurs ──
  var ic = marketing.influencers || {};
  var inflBudget = ic.enabled !== false ? (ic.count || 0) * (ic.costPerInfluencer || 0) : 0;
  var inflReach = ic.enabled !== false ? (ic.count || 0) * (ic.reachPerInfluencer || 0) : 0;
  var inflEngaged = inflReach * (ic.engagementRate || 0);
  var inflClients = inflEngaged * (ic.convRate || 0);
  var inflCpa = inflClients > 0 ? inflBudget / inflClients : 0;

  // ── SEO / Content ──
  var seoc = marketing.seo || {};
  var seoBudget = seoc.enabled !== false ? (seoc.toolsCost || 0) + (seoc.contentCost || 0) : 0;
  var seoTraffic = seoc.enabled !== false ? (seoc.estimatedTraffic || 0) : 0;
  var seoLeads = seoTraffic * (seoc.convRate || 0);
  var seoClients = seoLeads * (seoc.leadToClient || 0);
  var seoCpa = seoClients > 0 ? seoBudget / seoClients : 0;

  // ── Email / CRM ──
  var emc = marketing.email || {};
  var emailBudget = emc.enabled !== false ? (emc.toolCost || 0) : 0;
  var emailOpens = emc.enabled !== false ? (emc.listSize || 0) * (emc.openRate || 0) * (emc.campaignsPerMonth || 0) : 0;
  var emailClicks = emailOpens * (emc.clickRate || 0);
  var emailConversions = emailClicks * (emc.convRate || 0);
  var emailCpa = emailConversions > 0 ? emailBudget / emailConversions : 0;

  // ── Totals ──
  var totalSpend = metaBudget + googleBudget + inflBudget + seoBudget + emailBudget;
  var totalNewClients = metaClients + googleClients + inflClients + seoClients + emailConversions;
  var totalImpressions = metaImpressions + inflReach;
  var totalClicks = metaClicks + googleClicks + emailClicks;
  var totalLeads = metaLeads + googleLeads + seoLeads;

  var cacBlended = totalNewClients > 0 ? totalSpend / totalNewClients : 0;

  // ARPU: auto from pipeline or manual override
  var arpu = marketing.avgRevenuePerClient > 0
    ? marketing.avgRevenuePerClient
    : (totalClients > 0 ? arrV / totalClients / 12 : 0);
  var ltv = churnMonthly > 0 ? arpu / churnMonthly : 0;
  var ltvCac = cacBlended > 0 ? ltv / cacBlended : 0;
  var roas = totalSpend > 0 ? (totalNewClients * arpu * 12) / (totalSpend * 12) : 0;

  // ── Niches ──
  var niches = (marketing.niches || []).map(function (n) {
    var nicheBudget = totalSpend * (n.budgetPct || 0);
    var nicheClients = totalNewClients * (n.budgetPct || 0);
    var nicheCac = nicheClients > 0 ? nicheBudget / nicheClients : 0;
    return { id: n.id, name: n.name, budget: nicheBudget, clients: nicheClients, cac: nicheCac, budgetPct: n.budgetPct || 0 };
  });

  return {
    monthly: totalSpend,
    annual: totalSpend * 12,
    channels: {
      meta: { budget: metaBudget, impressions: metaImpressions, clicks: metaClicks, leads: metaLeads, clients: metaClients, cpc: metaCpc, cpa: metaCpa },
      google: { budget: googleBudget, clicks: googleClicks, leads: googleLeads, clients: googleClients, cpc: googleCpc, cpa: googleCpa },
      influencers: { budget: inflBudget, reach: inflReach, engaged: inflEngaged, clients: inflClients, cpa: inflCpa },
      seo: { budget: seoBudget, traffic: seoTraffic, leads: seoLeads, clients: seoClients, cpa: seoCpa },
      email: { budget: emailBudget, opens: emailOpens, clicks: emailClicks, conversions: emailConversions, cpa: emailCpa },
    },
    funnel: { totalImpressions: totalImpressions, totalClicks: totalClicks, totalLeads: totalLeads, totalClients: totalNewClients },
    cacBlended: cacBlended,
    roas: roas,
    ltv: ltv,
    ltvCac: ltvCac,
    niches: niches,
  };
}

// ── CPC Simulator ────────────────────────────────────────────────────────────
// Dual-channel CPC simulator for Forecrest:
//   B2B — ads targeting establishments (salons, spas) → signed clients
//   B2C — ads targeting end users (consumers) → app installs, active users
//
// Each channel funnel:
//   adjustedCPC   = baseCPC   × modAd^eCpc
//   adjustedCVR   = baseCVR   × modLead^eCvr
//   adjustedQual  = baseQual  × modLead^eQualif
//   adjustedClose = baseClose × modLead^eCloseQ × modCap^eCloseCap
//   clicks = budget / adjustedCPC, leads = clicks × CVR, etc.
//
// Combined KPIs: total budget, total revenue, blended ROAS/ROI.
function calcChannel(ch, modAd, modLead, modCap, eCpc, eCvr, eQualif, eCloseQ, eCloseCap) {
  var zero = {
    adjustedCPC: 0, adjustedCVR: 0, adjustedQual: 0, adjustedClose: 0,
    clicksMonth: 0, leadsMonth: 0, qualifiedMonth: 0, clientsMonth: 0,
    clicksYear: 0, leadsYear: 0, qualifiedYear: 0, clientsYear: 0,
    revenueMonth: 0, revenueYear: 0,
    cpl: 0, cpa: 0, roas: 0, roi: 0, budget: 0,
  };
  if (!ch) return zero;

  var budget = ch.budget || 0;
  var baseCPC = ch.cpc || 0;
  var baseCVR = ch.cvr || 0;
  var baseQual = ch.qualRate || 0;
  var baseClose = ch.closeRate || 0;
  var clientValue = ch.clientValue || 0;

  var adjustedCPC = baseCPC * Math.pow(modAd, eCpc);
  var adjustedCVR = baseCVR * Math.pow(modLead, eCvr);
  var adjustedQual = baseQual * Math.pow(modLead, eQualif);
  var adjustedClose = baseClose * Math.pow(modLead, eCloseQ) * Math.pow(modCap, eCloseCap);

  var clicksMonth = adjustedCPC > 0 ? budget / adjustedCPC : 0;
  var leadsMonth = clicksMonth * adjustedCVR;
  var qualifiedMonth = leadsMonth * adjustedQual;
  var clientsMonth = qualifiedMonth * adjustedClose;
  var revenueMonth = clientsMonth * clientValue / 12;

  var cpl = leadsMonth > 0 ? budget / leadsMonth : 0;
  var cpa = clientsMonth > 0 ? budget / clientsMonth : 0;
  var roas = budget > 0 ? revenueMonth / budget : 0;
  var roi = budget > 0 ? (revenueMonth - budget) / budget * 100 : 0;

  return {
    adjustedCPC: adjustedCPC, adjustedCVR: adjustedCVR,
    adjustedQual: adjustedQual, adjustedClose: adjustedClose,
    clicksMonth: clicksMonth, leadsMonth: leadsMonth,
    qualifiedMonth: qualifiedMonth, clientsMonth: clientsMonth,
    clicksYear: clicksMonth * 12, leadsYear: leadsMonth * 12,
    qualifiedYear: qualifiedMonth * 12, clientsYear: clientsMonth * 12,
    revenueMonth: revenueMonth, revenueYear: revenueMonth * 12,
    cpl: cpl, cpa: cpa, roas: roas, roi: roi, budget: budget,
  };
}

export function cpcSimCalc(sim) {
  var chZero = {
    adjustedCPC: 0, adjustedCVR: 0, adjustedQual: 0, adjustedClose: 0,
    clicksMonth: 0, leadsMonth: 0, qualifiedMonth: 0, clientsMonth: 0,
    clicksYear: 0, leadsYear: 0, qualifiedYear: 0, clientsYear: 0,
    revenueMonth: 0, revenueYear: 0,
    cpl: 0, cpa: 0, roas: 0, roi: 0, budget: 0,
  };
  var zero = { b2b: chZero, b2c: chZero, totalBudget: 0, totalRevenueMonth: 0, totalRevenueYear: 0, blendedRoas: 0, blendedRoi: 0 };
  if (!sim) return zero;

  var modAd = sim.modAdEfficiency != null ? sim.modAdEfficiency : 1;
  var modLead = sim.modLeadQuality != null ? sim.modLeadQuality : 1;
  var modCap = sim.modInternalCapacity != null ? sim.modInternalCapacity : 1;
  var eCpc = sim.eCpc != null ? sim.eCpc : 0.7;
  var eCvr = sim.eCvr != null ? sim.eCvr : 1.3;
  var eQualif = sim.eQualif != null ? sim.eQualif : 0.8;
  var eCloseQ = sim.eCloseQ != null ? sim.eCloseQ : 0.6;
  var eCloseCap = sim.eCloseCap != null ? sim.eCloseCap : 0.8;

  var b2b = calcChannel(sim.b2b, modAd, modLead, modCap, eCpc, eCvr, eQualif, eCloseQ, eCloseCap);
  var b2c = calcChannel(sim.b2c, modAd, modLead, modCap, eCpc, eCvr, eQualif, eCloseQ, eCloseCap);

  var totalBudget = b2b.budget + b2c.budget;
  var totalRevenueMonth = b2b.revenueMonth + b2c.revenueMonth;
  var totalRevenueYear = totalRevenueMonth * 12;
  var blendedRoas = totalBudget > 0 ? totalRevenueMonth / totalBudget : 0;
  var blendedRoi = totalBudget > 0 ? (totalRevenueMonth - totalBudget) / totalBudget * 100 : 0;

  return { b2b: b2b, b2c: b2c, totalBudget: totalBudget, totalRevenueMonth: totalRevenueMonth, totalRevenueYear: totalRevenueYear, blendedRoas: blendedRoas, blendedRoi: blendedRoi };
}

// ESOP / IFRS 2 grant vesting calculation
export function grantCalc(g) {
  var grantMs = new Date(g.grantDate).getTime();
  var elapsed = Math.max(0, (Date.now() - grantMs) / (1000 * 60 * 60 * 24 * 30.44));
  var vm = g.vestingMonths || 1;
  var cm = g.cliffMonths || 0;
  var totalCost = g.fairValue * g.shares;
  var monthlyExpense = totalCost / vm;
  var isComplete = elapsed >= vm;
  var inCliff = elapsed < cm;
  var vestedShares = isComplete ? g.shares : inCliff ? 0 : Math.floor(g.shares * elapsed / vm);
  var recognizedCost = Math.min(elapsed, vm) / vm * totalCost;
  return {
    elapsed: Math.round(elapsed),
    vestedShares,
    unvestedShares: g.shares - vestedShares,
    vestedPct: g.shares > 0 ? vestedShares / g.shares : 0,
    monthlyExpense: isComplete ? 0 : monthlyExpense,
    totalCost,
    recognizedCost,
    status: isComplete ? "complete" : inCliff ? "cliff" : "vesting",
  };
}

// Simulate infra cost at multiple client levels for scaling curve
// Consumer users scale proportionally based on current ratio (consumers per establishment)
export function infraScaling(infra, paliers, currentClients) {
  if (!infra) return [];
  var baseConsumers = infra.consumerUsers || 0;
  var baseClients = currentClients || 1;
  return paliers.map(function (clients) {
    var simInfra = { ...infra, simulatedUsers: 0, simulatedClients: 0 };
    // Scale consumer users proportionally to establishments
    if (baseConsumers > 0 && baseClients > 0) {
      simInfra.consumerUsers = Math.round(baseConsumers * clients / baseClients);
    }
    var d = infraCost(simInfra, clients);
    return {
      clients: clients,
      monthly: d.monthly,
      overageCost: d.overageCost,
      costPerClient: d.costPerClient,
      costPerUser: d.costPerUser,
      bottleneck: d.bottleneck,
      maxClients: d.maxClients,
    };
  });
}

// Project infra cost over months with growth rate and cumulative storage
// Consumer users grow with consumerGrowthRateMonth (defaults to growthRateMonth)
export function infraProjection(infra, startClients, months) {
  if (!infra) return [];
  var growth = infra.growthRateMonth || 0;
  var consumerGrowth = infra.consumerGrowthRateMonth != null ? infra.consumerGrowthRateMonth : growth;
  var baseConsumers = infra.consumerUsers || 0;
  var results = [];
  for (var m = 0; m < months; m++) {
    var clients = Math.round(startClients * Math.pow(1 + growth, m));
    var scaled = JSON.parse(JSON.stringify(infra));
    scaled.dataAgeMonths = m + 1;
    scaled.simulatedUsers = 0;
    scaled.simulatedClients = 0;
    // Consumer users grow independently
    if (baseConsumers > 0) {
      scaled.consumerUsers = Math.round(baseConsumers * Math.pow(1 + consumerGrowth, m));
    }
    var d = infraCost(scaled, clients);
    results.push({
      month: m + 1,
      clients: clients,
      consumerUsers: scaled.consumerUsers || 0,
      monthly: d.monthly,
      overageCost: d.overageCost,
      costPerClient: d.costPerClient,
      bottleneck: d.bottleneck,
      sqlStorageGB: d.sqlStorageGB,
      kvStorageGB: d.kvStorageGB,
      r2StorageGB: d.r2StorageGB,
    });
  }
  return results;
}

/**
 * Opportunity cost calculator.
 * Computes the annual cost of staying on a competitor vs switching to Forecrest.
 *
 * @param {object} p - params
 * @param {number} p.basket         - average service price
 * @param {number} p.annualBookings - total bookings/year
 * @param {number} p.compMonthly    - competitor monthly subscription
 * @param {number} p.compCommPct    - competitor commission % on new-client bookings
 * @param {number} p.compNewRatio   - share of bookings from new clients
 * @param {number} p.compTxPct      - competitor per-transaction variable fee
 * @param {number} p.compTxFix      - competitor per-transaction fixed fee
 * @param {number} p.compOnlinePct  - share of bookings paid online
 * @param {number} p.guAnnual       - Forecrest total annual cost (subscription + fees)
 * @param {number} p.migrationCost  - one-time switching cost (training, setup)
 * @returns {object}
 */
export function oppCostCalc(p) {
  var annBk = p.annualBookings || 0;
  var bsk = p.basket || 0;

  // Competitor annual cost breakdown
  var compSub = (p.compMonthly || 0) * 12;
  var compComm = (p.compCommPct || 0) * (p.compNewRatio || 0) * annBk * bsk;
  var compTx = ((p.compTxPct || 0) * bsk + (p.compTxFix || 0)) * annBk * (p.compOnlinePct || 0);
  var compTotal = compSub + compComm + compTx;

  // Forecrest annual cost (already computed externally via bkg + connectAnnual)
  var guTotal = p.guAnnual || 0;

  // Savings per year
  var annualSavings = compTotal - guTotal;

  // Migration cost & payback
  var migrationCost = p.migrationCost || 0;
  var paybackMonths = annualSavings > 0 ? Math.ceil(migrationCost / (annualSavings / 12)) : Infinity;

  // 3-year projection
  var threeYearSavings = annualSavings * 3 - migrationCost;

  // Opportunity cost = what the salon loses per year by NOT switching (clamped to 0+)
  var opportunityCost = Math.max(0, annualSavings);

  return {
    compSub: compSub,
    compComm: compComm,
    compTx: compTx,
    compTotal: compTotal,
    guTotal: guTotal,
    annualSavings: annualSavings,
    migrationCost: migrationCost,
    paybackMonths: paybackMonths,
    threeYearSavings: threeYearSavings,
    opportunityCost: opportunityCost,
  };
}
