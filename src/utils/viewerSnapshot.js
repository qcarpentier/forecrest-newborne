/**
 * viewerSnapshot.js — Encode/decode a read-only snapshot of Forecrest state into a URL-safe payload.
 *
 * Flow: Forecrest state → filter PII → envelope → JSON → pako deflate → base64url
 * Reverse: base64url → inflate → JSON → validate → snapshot
 *
 * Used by the "Share in read-only" feature to generate a QR code / link that a viewer can open
 * without any backend. The payload is self-contained and immutable.
 */
import { deflate, inflate } from "pako";
import { sanitizeSnapshot } from "./security.js";

export var VIEWER_FORMAT_VERSION = 1;

/* Soft limit: warn but still generate QR. Hard limit: refuse QR, fallback to file export. */
// QR-code payload limits. A v40 QR at error correction level L tops out around
// 2 950 alphanumeric chars. Keep some margin for URL prefix (~60 chars).
export var VIEWER_URL_SOFT_LIMIT = 1800;
export var VIEWER_URL_HARD_LIMIT = 2700;
export var VIEWER_MAX_DECODED_JSON = 1500000;

/* Keys stripped from cfg before encoding (user PII). */
var STRIP_CFG_KEYS = {
  email: true,
  phone: true,
  address: true,
  userName: true,
  firstName: true,
  lastName: true,
  tvaNumber: true,
};

/* Keys preserved from the full state (everything business-related). */
var INCLUDED_STATE_KEYS = [
  "cfg", "costs", "sals", "grants", "poolSize", "shareholders", "roundSim",
  "streams", "esopEnabled", "debts", "assets", "planSections",
  "crowdfunding", "stocks", "marketing", "affiliation", "production",
];

function stripCfg(cfg) {
  if (!cfg || typeof cfg !== "object") return cfg;
  var next = {};
  Object.keys(cfg).forEach(function (k) {
    if (STRIP_CFG_KEYS[k]) return;
    next[k] = cfg[k];
  });
  return next;
}

/**
 * Build a safe, PII-free snapshot from a full Forecrest state.
 * Pure function — no side effects.
 */
export function buildViewerSnapshot(fullSnapshot) {
  if (!fullSnapshot || typeof fullSnapshot !== "object") return {};
  var snap = {};
  INCLUDED_STATE_KEYS.forEach(function (k) {
    if (fullSnapshot[k] === undefined) return;
    if (k === "cfg") {
      snap[k] = stripCfg(fullSnapshot[k]);
    } else {
      snap[k] = fullSnapshot[k];
    }
  });
  return snap;
}

/* ── base64url helpers (URL-safe, no padding) ── */

function bytesToBase64Url(u8) {
  var bin = "";
  var CHUNK = 0x8000;
  for (var i = 0; i < u8.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, u8.subarray(i, i + CHUNK));
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(s) {
  var pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  var b64 = (s + "====".slice(0, pad)).replace(/-/g, "+").replace(/_/g, "/");
  var bin = atob(b64);
  var u8 = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

/**
 * Encode a full Forecrest state into a URL-safe payload string.
 *
 * @param {object} fullSnapshot - Forecrest state (from App.getFullSnapshot())
 * @param {object} opts - { appVersion, origin, expiresInMs?, createdAt? }
 * @returns {{ payload, envelope, sizeLevel, jsonBytes, payloadBytes }}
 */
export function encodeViewerSnapshot(fullSnapshot, opts) {
  var options = opts || {};
  var snap = buildViewerSnapshot(fullSnapshot);
  var safe = sanitizeSnapshot(snap);
  if (!safe) throw new Error("VIEWER_INVALID_SNAPSHOT");

  var now = typeof options.createdAt === "number" ? options.createdAt : Date.now();
  var expiresAt = null;
  if (typeof options.expiresInMs === "number" && options.expiresInMs > 0) {
    expiresAt = now + options.expiresInMs;
  }

  var envelope = {
    v: VIEWER_FORMAT_VERSION,
    appVersion: options.appVersion || "",
    origin: options.origin || "",
    createdAt: now,
    expiresAt: expiresAt,
    companyName: (safe.cfg && safe.cfg.companyName) || "",
    snap: safe,
  };

  var json = JSON.stringify(envelope);
  var jsonBytes = new TextEncoder().encode(json);
  var compressed = deflate(jsonBytes, { level: 9 });
  var payload = bytesToBase64Url(compressed);

  var size = payload.length;
  var sizeLevel = size > VIEWER_URL_HARD_LIMIT ? "over"
    : size > VIEWER_URL_SOFT_LIMIT ? "warn"
    : "ok";

  return {
    payload: payload,
    envelope: envelope,
    sizeLevel: sizeLevel,
    jsonBytes: jsonBytes.length,
    payloadBytes: payload.length,
  };
}

function makeError(code, message) {
  var e = new Error(message || code);
  e.viewerCode = code;
  return e;
}

/**
 * Decode a payload string back to a validated envelope.
 * Throws Error with .viewerCode in { CORRUPT, VERSION_AHEAD, EXPIRED, TOO_LARGE }.
 */
export function decodeViewerSnapshot(payload) {
  if (typeof payload !== "string" || payload.length === 0) {
    throw makeError("CORRUPT", "Missing viewer payload");
  }
  if (payload.length > VIEWER_URL_HARD_LIMIT * 4) {
    throw makeError("TOO_LARGE", "Viewer payload too large");
  }

  var bytes;
  try {
    bytes = base64UrlToBytes(payload);
  } catch (e) {
    throw makeError("CORRUPT", "Invalid base64 payload");
  }

  var jsonStr;
  try {
    var inflated = inflate(bytes);
    jsonStr = new TextDecoder().decode(inflated);
  } catch (e) {
    throw makeError("CORRUPT", "Decompression failed");
  }

  if (jsonStr.length > VIEWER_MAX_DECODED_JSON) {
    throw makeError("TOO_LARGE", "Decoded snapshot too large");
  }

  var envelope;
  try {
    envelope = JSON.parse(jsonStr);
  } catch (e) {
    throw makeError("CORRUPT", "Invalid JSON");
  }

  if (!envelope || typeof envelope !== "object") {
    throw makeError("CORRUPT", "Invalid envelope");
  }

  if (typeof envelope.v !== "number") {
    throw makeError("CORRUPT", "Missing format version");
  }
  if (envelope.v > VIEWER_FORMAT_VERSION) {
    throw makeError("VERSION_AHEAD", "Payload format too new");
  }

  if (typeof envelope.expiresAt === "number" && envelope.expiresAt > 0 && Date.now() > envelope.expiresAt) {
    throw makeError("EXPIRED", "Payload expired");
  }

  var cleanSnap = sanitizeSnapshot(envelope.snap);
  if (!cleanSnap) {
    throw makeError("CORRUPT", "Invalid snapshot content");
  }
  envelope.snap = cleanSnap;
  return envelope;
}

/**
 * Extract the viewer payload from the current URL, if any.
 * Supports `?view=<payload>` query parameter.
 */
export function getViewerPayloadFromUrl(urlLike) {
  try {
    var url = typeof urlLike === "string" ? new URL(urlLike) : new URL(window.location.href);
    var q = url.searchParams.get("view");
    if (q && q.length > 0) return q;
  } catch (e) {}
  return null;
}
