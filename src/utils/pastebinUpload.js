/**
 * Pastebin upload for oversized viewer snapshots.
 *
 * Uses 0x0.st — a public, anonymous, no-auth file-upload service with permissive CORS.
 * Files expire between 30 days (≈10 MB) and 365 days (small files). Public URLs.
 * Data sent: the compressed viewer payload (base64url text). Not encrypted — treat
 * as "anyone with the link can view the BP".
 *
 * Flow:
 *   1. `uploadPayloadToPastebin(payload)` → returns a paste ID (short token).
 *   2. Viewer URL becomes `<origin>/?viewPaste=<id>` (well within QR capacity).
 *   3. When the app boots with `?viewPaste=<id>`, it calls `fetchPayloadFromPastebin(id)`
 *      and redirects to the classic `/?view=<payload>` URL.
 */

var PASTEBIN_BASE = "https://0x0.st";

function extractIdFromUrl(url) {
  if (!url || typeof url !== "string") return "";
  var clean = url.trim();
  var slash = clean.lastIndexOf("/");
  if (slash < 0) return clean;
  return clean.slice(slash + 1);
}

/**
 * Upload a text payload to 0x0.st as a file.
 *
 * @param {string} payload - text content to upload (typically a compressed, base64url snapshot)
 * @returns {Promise<{ ok, id?, url?, error? }>}
 */
export async function uploadPayloadToPastebin(payload) {
  if (!payload || typeof payload !== "string") return { ok: false, error: "missing_payload" };
  try {
    var form = new FormData();
    var blob = new Blob([payload], { type: "text/plain" });
    form.append("file", blob, "snapshot.txt");
    // 30-day expiration (max window 0x0.st offers for small files is actually longer,
    // but we request a conservative value via the "expires" field in hours).
    form.append("expires", "720");
    var resp = await fetch(PASTEBIN_BASE, { method: "POST", body: form });
    if (!resp.ok) return { ok: false, error: "upload_failed_" + resp.status };
    var url = (await resp.text()).trim();
    if (!url || url.indexOf("http") !== 0) return { ok: false, error: "invalid_response" };
    return { ok: true, id: extractIdFromUrl(url), url: url };
  } catch (err) {
    return { ok: false, error: (err && err.message) || "network_error" };
  }
}

/**
 * Fetch a payload back from 0x0.st by its paste id.
 *
 * @param {string} id - paste identifier (e.g. "ABcd.txt")
 * @returns {Promise<{ ok, payload?, error? }>}
 */
export async function fetchPayloadFromPastebin(id) {
  if (!id || typeof id !== "string") return { ok: false, error: "missing_id" };
  // Reject anything that isn't a safe short token to prevent arbitrary URL injection
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(id)) return { ok: false, error: "invalid_id" };
  try {
    var resp = await fetch(PASTEBIN_BASE + "/" + id, { method: "GET" });
    if (!resp.ok) return { ok: false, error: "fetch_failed_" + resp.status };
    var text = (await resp.text()).trim();
    if (!text) return { ok: false, error: "empty" };
    return { ok: true, payload: text };
  } catch (err) {
    return { ok: false, error: (err && err.message) || "network_error" };
  }
}
