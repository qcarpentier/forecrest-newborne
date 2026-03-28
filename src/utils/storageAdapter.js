import { getSupabase, isConfigured } from "../lib/supabase";

/* ── LocalAdapter — localStorage (default, offline-first) ── */
/* Backward-compatible: uses window.storage if available (original API),
   falls back to raw localStorage. */
var LocalAdapter = {
  name: "local",

  load: function (key) {
    try {
      if (window.storage && typeof window.storage.get === "function") {
        return Promise.resolve(window.storage.get(key)).then(function (r) {
          return r ? JSON.parse(r.value) : null;
        });
      }
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  save: function (key, value) {
    try {
      if (window.storage && typeof window.storage.set === "function") {
        return window.storage.set(key, JSON.stringify(value));
      }
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* silent — quota exceeded or private browsing */
    }
  },
};

/* ── SupabaseAdapter — cloud storage via JSONB ── */
var SupabaseAdapter = {
  name: "supabase",
  _workspaceId: null,

  setWorkspaceId: function (id) {
    SupabaseAdapter._workspaceId = id;
  },

  load: function () {
    var wid = SupabaseAdapter._workspaceId;
    if (!wid || !isConfigured()) return Promise.resolve(null);

    var sb = getSupabase();
    return sb.from("workspaces")
      .select("app_state, updated_at")
      .eq("id", wid)
      .single()
      .then(function (res) {
        if (res.error || !res.data) return null;
        var state = res.data.app_state;
        if (state) state._cloudUpdatedAt = res.data.updated_at;
        return state;
      })
      .catch(function () { return null; });
  },

  save: function (key, value) {
    var wid = SupabaseAdapter._workspaceId;
    if (!wid || !isConfigured()) return Promise.resolve();

    var sb = getSupabase();
    return sb.from("workspaces")
      .update({
        app_state: value,
        updated_at: new Date().toISOString(),
      })
      .eq("id", wid)
      .then(function (res) {
        if (res.error) throw res.error;
      })
      .catch(function () { /* silent — will retry via sync engine */ });
  },
};

/* ── Adapter management ── */
var _adapter = LocalAdapter;

export function setAdapter(adapter) {
  _adapter = adapter;
}

export function getAdapter() {
  return _adapter;
}

export { LocalAdapter, SupabaseAdapter };
