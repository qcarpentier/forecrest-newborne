/**
 * Pastebin upload for oversized viewer snapshots.
 *
 * Tries multiple free public pastebin services in order until one succeeds.
 * Each provider is tried fully client-side (fetch) — if one fails for CORS,
 * auth, rate-limit or network reasons, the next one is tried automatically.
 *
 * Flow:
 *   1. `uploadPayloadToPastebin(payload)` → { ok, provider, id, url }.
 *   2. Viewer URL = `<origin>/?viewPaste=<provider>:<id>`.
 *   3. Boot reads `?viewPaste=...`, calls `fetchPayloadFromPastebin(ref)`,
 *      then redirects to the classic `?view=<payload>` URL.
 *
 * Security: payloads are compressed+base64, not encrypted. Anyone with the
 * short link can view the BP. Treat as "public read-only by obscurity".
 */

var PROVIDERS = {
  paste_rs: {
    id: "paste_rs",
    baseUrl: "https://paste.rs",
  },
  zerox0: {
    id: "zerox0",
    baseUrl: "https://0x0.st",
  },
};

function extractIdFromUrl(url) {
  if (!url || typeof url !== "string") return "";
  var clean = url.trim();
  // Remove protocol + host → keep only the last path component
  var match = clean.match(/[^\/]+$/);
  return match ? match[0] : clean;
}

// ── paste.rs ────────────────────────────────────────────────────────────────
async function uploadPasteRs(payload) {
  var resp = await fetch(PROVIDERS.paste_rs.baseUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: payload,
  });
  if (!resp.ok) throw new Error("paste_rs_" + resp.status);
  var url = (await resp.text()).trim();
  if (!url || url.indexOf("http") !== 0) throw new Error("paste_rs_invalid");
  // paste.rs returns URLs like https://paste.rs/abc (id is the last path segment,
  // possibly with an extension like .txt if someone appends one — we strip any ext)
  var id = extractIdFromUrl(url).split(".")[0];
  return { id: id, url: PROVIDERS.paste_rs.baseUrl + "/" + id };
}

async function fetchPasteRs(id) {
  var resp = await fetch(PROVIDERS.paste_rs.baseUrl + "/" + encodeURIComponent(id));
  if (!resp.ok) throw new Error("paste_rs_get_" + resp.status);
  return (await resp.text()).trim();
}

// ── 0x0.st ──────────────────────────────────────────────────────────────────
async function uploadZerox0(payload) {
  var form = new FormData();
  var blob = new Blob([payload], { type: "text/plain" });
  form.append("file", blob, "snapshot.txt");
  form.append("expires", "720");
  var resp = await fetch(PROVIDERS.zerox0.baseUrl, { method: "POST", body: form });
  if (!resp.ok) throw new Error("zerox0_" + resp.status);
  var url = (await resp.text()).trim();
  if (!url || url.indexOf("http") !== 0) throw new Error("zerox0_invalid");
  var id = extractIdFromUrl(url);
  return { id: id, url: url };
}

async function fetchZerox0(id) {
  var resp = await fetch(PROVIDERS.zerox0.baseUrl + "/" + encodeURIComponent(id));
  if (!resp.ok) throw new Error("zerox0_get_" + resp.status);
  return (await resp.text()).trim();
}

var UPLOADERS = [
  { id: "paste_rs", fn: uploadPasteRs },
  { id: "zerox0", fn: uploadZerox0 },
];

/**
 * Upload a text payload. Returns a reference string of the form "<provider>:<id>"
 * that's safe to embed in a URL and short enough for a QR.
 */
export async function uploadPayloadToPastebin(payload) {
  if (!payload || typeof payload !== "string") return { ok: false, error: "missing_payload" };
  var attempts = [];
  for (var i = 0; i < UPLOADERS.length; i++) {
    var up = UPLOADERS[i];
    try {
      var res = await up.fn(payload);
      return { ok: true, provider: up.id, id: res.id, url: res.url, ref: up.id + ":" + res.id, attempts: attempts };
    } catch (err) {
      attempts.push({ provider: up.id, error: (err && err.message) || "unknown" });
    }
  }
  return { ok: false, error: "all_providers_failed", attempts: attempts };
}

/**
 * Fetch a payload by reference. Accepts both new-style ("<provider>:<id>")
 * and legacy references (plain id → defaults to zerox0).
 */
export async function fetchPayloadFromPastebin(ref) {
  if (!ref || typeof ref !== "string") return { ok: false, error: "missing_ref" };
  var provider, id;
  var sep = ref.indexOf(":");
  if (sep > 0) {
    provider = ref.slice(0, sep);
    id = ref.slice(sep + 1);
  } else {
    provider = "zerox0";
    id = ref;
  }
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(id)) return { ok: false, error: "invalid_id" };
  try {
    var text;
    if (provider === "paste_rs") text = await fetchPasteRs(id);
    else if (provider === "zerox0") text = await fetchZerox0(id);
    else return { ok: false, error: "unknown_provider_" + provider };
    if (!text) return { ok: false, error: "empty" };
    return { ok: true, payload: text };
  } catch (err) {
    return { ok: false, error: (err && err.message) || "network_error" };
  }
}
