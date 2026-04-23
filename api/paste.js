/**
 * Vercel serverless proxy for pastebin uploads.
 *
 * The browser cannot directly POST to 0x0.st or paste.rs (neither returns
 * Access-Control-Allow-Origin for cross-origin POST). This function runs on
 * Vercel Edge/Node and forwards the payload server-side, so CORS is a non-issue.
 *
 * POST /api/paste { payload: "..." }  → { ok, provider, id }
 * GET  /api/paste?ref=<provider>:<id> → { ok, payload }
 */

export const config = {
  runtime: "edge",
};

const UPLOADERS = [
  { id: "paste_rs", upload: uploadPasteRs, fetch: fetchPasteRs },
  { id: "zerox0",   upload: uploadZerox0,  fetch: fetchZerox0  },
];

async function uploadPasteRs(payload) {
  const resp = await fetch("https://paste.rs", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: payload,
  });
  if (!resp.ok) throw new Error("paste_rs_" + resp.status);
  const url = (await resp.text()).trim();
  if (!url.startsWith("http")) throw new Error("paste_rs_invalid");
  const id = url.split("/").pop().split(".")[0];
  return { id };
}

async function fetchPasteRs(id) {
  const resp = await fetch("https://paste.rs/" + encodeURIComponent(id));
  if (!resp.ok) throw new Error("paste_rs_get_" + resp.status);
  return (await resp.text()).trim();
}

async function uploadZerox0(payload) {
  const form = new FormData();
  form.append("file", new Blob([payload], { type: "text/plain" }), "snap.txt");
  form.append("expires", "720");
  const resp = await fetch("https://0x0.st", { method: "POST", body: form });
  if (!resp.ok) throw new Error("zerox0_" + resp.status);
  const url = (await resp.text()).trim();
  if (!url.startsWith("http")) throw new Error("zerox0_invalid");
  const id = url.split("/").pop();
  return { id };
}

async function fetchZerox0(id) {
  const resp = await fetch("https://0x0.st/" + encodeURIComponent(id));
  if (!resp.ok) throw new Error("zerox0_get_" + resp.status);
  return (await resp.text()).trim();
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { "Content-Type": "application/json" },
  });
}

export default async function handler(req) {
  try {
    if (req.method === "POST") {
      const body = await req.json();
      const payload = body && body.payload;
      if (!payload || typeof payload !== "string") return json({ ok: false, error: "missing_payload" }, 400);
      if (payload.length > 200000) return json({ ok: false, error: "payload_too_large" }, 413);

      const attempts = [];
      for (const up of UPLOADERS) {
        try {
          const res = await up.upload(payload);
          return json({ ok: true, provider: up.id, id: res.id, ref: up.id + ":" + res.id, attempts });
        } catch (err) {
          attempts.push({ provider: up.id, error: String(err && err.message || err) });
        }
      }
      return json({ ok: false, error: "all_providers_failed", attempts }, 502);
    }

    if (req.method === "GET") {
      const url = new URL(req.url);
      const ref = url.searchParams.get("ref");
      if (!ref) return json({ ok: false, error: "missing_ref" }, 400);
      const sep = ref.indexOf(":");
      const provider = sep > 0 ? ref.slice(0, sep) : "zerox0";
      const id = sep > 0 ? ref.slice(sep + 1) : ref;
      if (!/^[A-Za-z0-9._-]{1,64}$/.test(id)) return json({ ok: false, error: "invalid_id" }, 400);

      const up = UPLOADERS.find(function (u) { return u.id === provider; });
      if (!up) return json({ ok: false, error: "unknown_provider" }, 400);
      try {
        const text = await up.fetch(id);
        if (!text) return json({ ok: false, error: "empty" }, 404);
        return json({ ok: true, payload: text });
      } catch (err) {
        return json({ ok: false, error: String(err && err.message || err) }, 502);
      }
    }

    return json({ ok: false, error: "method_not_allowed" }, 405);
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) }, 500);
  }
}
