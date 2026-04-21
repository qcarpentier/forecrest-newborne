import { describe, it, expect } from "vitest";
import {
  buildViewerSnapshot,
  encodeViewerSnapshot,
  decodeViewerSnapshot,
  getViewerPayloadFromUrl,
  VIEWER_FORMAT_VERSION,
  VIEWER_URL_HARD_LIMIT,
} from "./viewerSnapshot.js";

function fullState(overrides) {
  var base = {
    cfg: {
      companyName: "Acme",
      legalForm: "srl",
      capitalSocial: 20000,
      email: "founder@acme.com",
      phone: "+32 400 11 22 33",
      address: "Rue Test 1",
      userName: "founder",
      firstName: "Alice",
      lastName: "Martin",
      tvaNumber: "BE0123456789",
      currency: "EUR",
    },
    costs: [{ cat: "Ops", items: [{ id: "c1", l: "Rent", a: 1000, freq: "monthly" }] }],
    sals: [{ id: "s1", role: "CEO", net: 2500, type: "director" }],
    streams: [{ cat: "Rev", items: [{ id: "r1", l: "SaaS", price: 50, qty: 10, behavior: "recurring" }] }],
    debts: [],
    assets: [],
    stocks: [],
    grants: [],
    shareholders: [],
    poolSize: 1000,
    roundSim: {},
    esopEnabled: false,
    crowdfunding: { enabled: false },
    marketing: {},
    affiliation: {},
    production: {},
    planSections: [],
  };
  return Object.assign(base, overrides || {});
}

describe("buildViewerSnapshot", function () {
  it("strips PII from cfg", function () {
    var snap = buildViewerSnapshot(fullState());
    expect(snap.cfg.email).toBeUndefined();
    expect(snap.cfg.phone).toBeUndefined();
    expect(snap.cfg.address).toBeUndefined();
    expect(snap.cfg.userName).toBeUndefined();
    expect(snap.cfg.firstName).toBeUndefined();
    expect(snap.cfg.lastName).toBeUndefined();
    expect(snap.cfg.tvaNumber).toBeUndefined();
  });

  it("preserves business fields in cfg", function () {
    var snap = buildViewerSnapshot(fullState());
    expect(snap.cfg.companyName).toBe("Acme");
    expect(snap.cfg.legalForm).toBe("srl");
    expect(snap.cfg.capitalSocial).toBe(20000);
    expect(snap.cfg.currency).toBe("EUR");
  });

  it("preserves all business state keys", function () {
    var snap = buildViewerSnapshot(fullState());
    expect(snap.costs).toBeDefined();
    expect(snap.sals).toBeDefined();
    expect(snap.streams).toBeDefined();
    expect(snap.grants).toBeDefined();
  });

  it("is idempotent", function () {
    var a = buildViewerSnapshot(fullState());
    var b = buildViewerSnapshot(a);
    expect(JSON.stringify(b.cfg)).toBe(JSON.stringify(a.cfg));
  });

  it("returns {} for invalid input", function () {
    expect(buildViewerSnapshot(null)).toEqual({});
    expect(buildViewerSnapshot(undefined)).toEqual({});
  });
});

describe("encode / decode round-trip", function () {
  it("encodes minimal state and decodes identically (without PII)", function () {
    var state = fullState();
    var encoded = encodeViewerSnapshot(state, { appVersion: "0.1.46.0", origin: "https://test" });
    var env = decodeViewerSnapshot(encoded.payload);
    expect(env.v).toBe(VIEWER_FORMAT_VERSION);
    expect(env.appVersion).toBe("0.1.46.0");
    expect(env.companyName).toBe("Acme");
    expect(env.snap.cfg.companyName).toBe("Acme");
    expect(env.snap.cfg.email).toBeUndefined();
    expect(env.snap.costs.length).toBe(1);
  });

  it("preserves numeric precision", function () {
    var state = fullState({ cfg: Object.assign({}, fullState().cfg, { capitalSocial: 12345.67, vat: 0.21 }) });
    var encoded = encodeViewerSnapshot(state, { appVersion: "0.1.46.0" });
    var env = decodeViewerSnapshot(encoded.payload);
    expect(env.snap.cfg.capitalSocial).toBe(12345.67);
    expect(env.snap.cfg.vat).toBe(0.21);
  });

  it("preserves unicode in companyName", function () {
    var state = fullState({ cfg: Object.assign({}, fullState().cfg, { companyName: "Étoile 中 🚀" }) });
    var encoded = encodeViewerSnapshot(state, { appVersion: "0.1.46.0" });
    var env = decodeViewerSnapshot(encoded.payload);
    expect(env.snap.cfg.companyName).toBe("Étoile 中 🚀");
    expect(env.companyName).toBe("Étoile 中 🚀");
  });

  it("default state encodes under soft limit", function () {
    var encoded = encodeViewerSnapshot(fullState(), { appVersion: "0.1.46.0" });
    expect(encoded.sizeLevel).toBe("ok");
  });
});

describe("versioning", function () {
  it("decodes v:1 payload", function () {
    var encoded = encodeViewerSnapshot(fullState(), { appVersion: "0.1.46.0" });
    var env = decodeViewerSnapshot(encoded.payload);
    expect(env.v).toBe(1);
  });

  it("throws VERSION_AHEAD when v is too new", function () {
    /* Manually craft a payload with v:99 */
    var state = fullState();
    var encoded = encodeViewerSnapshot(state, { appVersion: "0.1.46.0" });
    /* Re-encode with forged envelope — simulate by injecting a fake envelope */
    var fakeEnv = JSON.stringify({ v: 99, snap: { cfg: {} }, createdAt: Date.now() });
    var bytes = new TextEncoder().encode(fakeEnv);
    var pako = require("pako");
    var compressed = pako.deflate(bytes, { level: 9 });
    var bin = "";
    var CHUNK = 0x8000;
    for (var i = 0; i < compressed.length; i += CHUNK) {
      bin += String.fromCharCode.apply(null, compressed.subarray(i, i + CHUNK));
    }
    var payload = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(function () { decodeViewerSnapshot(payload); }).toThrow();
    try { decodeViewerSnapshot(payload); } catch (e) { expect(e.viewerCode).toBe("VERSION_AHEAD"); }
  });
});

describe("expiry", function () {
  it("throws EXPIRED when expiresAt is in the past", function () {
    var encoded = encodeViewerSnapshot(fullState(), {
      appVersion: "0.1.46.0",
      createdAt: Date.now() - 10000,
      expiresInMs: 1000,
    });
    expect(function () { decodeViewerSnapshot(encoded.payload); }).toThrow();
    try { decodeViewerSnapshot(encoded.payload); } catch (e) { expect(e.viewerCode).toBe("EXPIRED"); }
  });

  it("accepts payload with null expiresAt (no expiry)", function () {
    var encoded = encodeViewerSnapshot(fullState(), { appVersion: "0.1.46.0" });
    var env = decodeViewerSnapshot(encoded.payload);
    expect(env.expiresAt).toBeNull();
  });
});

describe("error codes", function () {
  it("throws CORRUPT on empty payload", function () {
    try { decodeViewerSnapshot(""); } catch (e) { expect(e.viewerCode).toBe("CORRUPT"); }
  });

  it("throws CORRUPT on invalid base64", function () {
    try { decodeViewerSnapshot("!@#$%^&*()"); } catch (e) {
      expect(["CORRUPT", "TOO_LARGE"]).toContain(e.viewerCode);
    }
  });

  it("throws TOO_LARGE on absurdly long payload", function () {
    var huge = "A".repeat(VIEWER_URL_HARD_LIMIT * 5);
    try { decodeViewerSnapshot(huge); } catch (e) { expect(e.viewerCode).toBe("TOO_LARGE"); }
  });
});

describe("getViewerPayloadFromUrl", function () {
  it("extracts ?view= query parameter", function () {
    var result = getViewerPayloadFromUrl("https://example.com/?view=abc123");
    expect(result).toBe("abc123");
  });

  it("returns null when no view param", function () {
    expect(getViewerPayloadFromUrl("https://example.com/")).toBeNull();
  });

  it("returns null for malformed URL", function () {
    expect(getViewerPayloadFromUrl("not-a-url")).toBeNull();
  });
});
