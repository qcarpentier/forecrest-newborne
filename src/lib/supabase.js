import { createClient } from "@supabase/supabase-js";

/* ── Default credentials from env vars (Cloud Forecrest mode) ── */
var ENV_URL = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || "";
var ENV_KEY = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || "";

var _client = null;

/**
 * Resolve credentials by priority:
 * 1. Self-hosted override in localStorage (user-provided)
 * 2. Env vars (Cloud Forecrest / .env)
 */
function resolveCredentials() {
  var selfUrl = localStorage.getItem("forecrest_sb_url");
  var selfKey = localStorage.getItem("forecrest_sb_key");

  /* Cloud Forecrest (env vars) */
  if (ENV_URL && ENV_KEY) {
    /* If localStorage has same creds as env vars, or no overrides → cloud */
    if (!selfUrl || !selfKey || (selfUrl === ENV_URL && selfKey === ENV_KEY)) {
      return { url: ENV_URL, key: ENV_KEY, mode: "cloud" };
    }
    /* localStorage has DIFFERENT creds → self-hosted override */
    return { url: selfUrl, key: selfKey, mode: "self-hosted" };
  }

  /* No env vars — self-hosted if localStorage has creds */
  if (selfUrl && selfKey) {
    return { url: selfUrl, key: selfKey, mode: "self-hosted" };
  }

  return { url: "", key: "", mode: "local" };
}

/**
 * Lazy singleton — only created on first call.
 * Priority: self-hosted localStorage > env vars (cloud) > not configured.
 */
export function getSupabase() {
  if (_client) return _client;

  var creds = resolveCredentials();
  if (!creds.url || !creds.key) return null;

  _client = createClient(creds.url, creds.key, {
    auth: {
      persistSession: true,
      storageKey: "forecrest_auth",
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return _client;
}

/**
 * Reset the client — call when URL/key changes (self-hosted config).
 */
export function resetClient() {
  _client = null;
}

/**
 * Check if Supabase credentials are available (env vars OR self-hosted).
 */
export function isConfigured() {
  var creds = resolveCredentials();
  return !!(creds.url && creds.key);
}

/**
 * Get current storage mode: "cloud" | "self-hosted" | "local"
 */
export function getStorageMode() {
  return resolveCredentials().mode;
}

/**
 * Check if env vars are set (Cloud Forecrest available).
 */
export function hasCloudConfig() {
  return !!(ENV_URL && ENV_KEY);
}

/**
 * Check if admin dashboard is enabled (VITE_ADMIN_ENABLED=true in .env).
 * Only set on Cloud Forecrest deployments — never on self-hosted/GitHub.
 */
export function isAdminEnabled() {
  return !!(typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_ADMIN_ENABLED === "true");
}
