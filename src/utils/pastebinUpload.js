/**
 * Pastebin upload for oversized viewer snapshots.
 *
 * Primary path: call the in-app Vercel serverless function /api/paste, which
 * forwards the payload to paste.rs / 0x0.st server-side. Same-origin → no CORS.
 *
 * Fallback path (dev local without /api): try the public pastebins directly.
 * Most browsers will reject these as CORS blocks, but a subset of environments
 * (relaxed CORS, proxies, extensions) still lets them through.
 *
 * Reference format returned: "<provider>:<id>" — safe in URLs, short enough
 * for a QR code.
 */

var API_ENDPOINT = "/api/paste";

// ── Primary: same-origin serverless proxy ──
async function uploadViaApi(payload) {
  var resp = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload: payload }),
  });
  if (!resp.ok) throw new Error("api_" + resp.status);
  var data = await resp.json();
  if (!data || !data.ok) throw new Error((data && data.error) || "api_failed");
  return { provider: data.provider, id: data.id, ref: data.ref || (data.provider + ":" + data.id) };
}

async function fetchViaApi(ref) {
  var resp = await fetch(API_ENDPOINT + "?ref=" + encodeURIComponent(ref));
  if (!resp.ok) throw new Error("api_" + resp.status);
  var data = await resp.json();
  if (!data || !data.ok) throw new Error((data && data.error) || "api_failed");
  return data.payload;
}

// ── Direct public pastebins (may fail on CORS; kept as last-chance) ──
async function uploadPasteRsDirect(payload) {
  var resp = await fetch("https://paste.rs", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: payload,
  });
  if (!resp.ok) throw new Error("paste_rs_" + resp.status);
  var url = (await resp.text()).trim();
  if (url.indexOf("http") !== 0) throw new Error("paste_rs_invalid");
  var id = url.split("/").pop().split(".")[0];
  return { provider: "paste_rs", id: id, ref: "paste_rs:" + id };
}

async function uploadZerox0Direct(payload) {
  var form = new FormData();
  form.append("file", new Blob([payload], { type: "text/plain" }), "snap.txt");
  form.append("expires", "720");
  var resp = await fetch("https://0x0.st", { method: "POST", body: form });
  if (!resp.ok) throw new Error("zerox0_" + resp.status);
  var url = (await resp.text()).trim();
  if (url.indexOf("http") !== 0) throw new Error("zerox0_invalid");
  var id = url.split("/").pop();
  return { provider: "zerox0", id: id, ref: "zerox0:" + id };
}

/**
 * Upload a text payload. Returns { ok, ref, provider, id } or { ok: false, error }.
 */
export async function uploadPayloadToPastebin(payload) {
  if (!payload || typeof payload !== "string") return { ok: false, error: "missing_payload" };
  var attempts = [];
  var strategies = [
    { name: "api", fn: function () { return uploadViaApi(payload); } },
    { name: "paste_rs_direct", fn: function () { return uploadPasteRsDirect(payload); } },
    { name: "zerox0_direct", fn: function () { return uploadZerox0Direct(payload); } },
  ];
  for (var i = 0; i < strategies.length; i++) {
    var s = strategies[i];
    try {
      var res = await s.fn();
      return { ok: true, strategy: s.name, provider: res.provider, id: res.id, ref: res.ref, attempts: attempts };
    } catch (err) {
      attempts.push({ strategy: s.name, error: (err && err.message) || "unknown" });
    }
  }
  return { ok: false, error: "all_strategies_failed", attempts: attempts };
}

/**
 * Fetch a payload back. Accepts "<provider>:<id>" or legacy plain id (→ zerox0).
 */
export async function fetchPayloadFromPastebin(ref) {
  if (!ref || typeof ref !== "string") return { ok: false, error: "missing_ref" };
  var sep = ref.indexOf(":");
  var provider = sep > 0 ? ref.slice(0, sep) : "zerox0";
  var id = sep > 0 ? ref.slice(sep + 1) : ref;
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(id)) return { ok: false, error: "invalid_id" };
  var fullRef = provider + ":" + id;

  // Try the server-side proxy first (same-origin, no CORS).
  try {
    var text = await fetchViaApi(fullRef);
    if (text) return { ok: true, payload: text };
  } catch (e) { /* fall through */ }

  // Fallback: direct fetch (GET on public pastebins usually allows CORS).
  try {
    var url = provider === "paste_rs" ? "https://paste.rs/" + encodeURIComponent(id)
            : provider === "zerox0"   ? "https://0x0.st/" + encodeURIComponent(id)
            : null;
    if (!url) return { ok: false, error: "unknown_provider" };
    var resp = await fetch(url);
    if (!resp.ok) return { ok: false, error: "fetch_" + resp.status };
    var body = (await resp.text()).trim();
    if (!body) return { ok: false, error: "empty" };
    return { ok: true, payload: body };
  } catch (err) {
    return { ok: false, error: (err && err.message) || "network_error" };
  }
}
