import { getSupabase, isConfigured } from "../lib/supabase";

/* ── Sync state (reactive via subscribers) ── */
var syncState = {
  status: "synced",   // synced | syncing | pending | offline | error
  lastSync: null,
  error: null,
};

var _listeners = [];

function notify() {
  _listeners.forEach(function (fn) { fn(syncState); });
}

export function subscribeSyncState(fn) {
  _listeners.push(fn);
  return function () {
    _listeners = _listeners.filter(function (f) { return f !== fn; });
  };
}

export function getSyncState() {
  return syncState;
}

/* ── Debounced cloud save ── */
var _timer = null;
var DEBOUNCE_MS = 800;

/**
 * Schedule a debounced save to Supabase.
 * Always saves to localStorage immediately (offline-first).
 * Cloud save is debounced to avoid hammering the API.
 */
export function scheduleSave(workspaceId, data) {
  /* Always save locally first (use window.storage if available, else localStorage) */
  try {
    var json = JSON.stringify(data);
    if (window.storage && typeof window.storage.set === "function") {
      window.storage.set("forecrest", json);
    } else {
      localStorage.setItem("forecrest", json);
    }
    localStorage.setItem("forecrest_local_ts", new Date().toISOString());
  } catch (e) { /* quota exceeded */ }

  /* Skip cloud save if not configured or no workspace */
  if (!workspaceId || !isConfigured()) return;

  syncState.status = "pending";
  notify();

  /* Debounce cloud save */
  if (_timer) clearTimeout(_timer);
  _timer = setTimeout(function () {
    doCloudSave(workspaceId, data);
  }, DEBOUNCE_MS);
}

function doCloudSave(workspaceId, data) {
  syncState.status = "syncing";
  notify();

  var sb = getSupabase();
  sb.from("workspaces")
    .update({
      app_state: data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workspaceId)
    .then(function (res) {
      if (res.error) {
        syncState.status = "error";
        syncState.error = res.error.message;
      } else {
        syncState.status = "synced";
        syncState.lastSync = new Date().toISOString();
        syncState.error = null;
      }
      notify();
    })
    .catch(function (err) {
      if (!navigator.onLine) {
        syncState.status = "offline";
      } else {
        syncState.status = "error";
        syncState.error = err.message || "Unknown error";
      }
      notify();
    });
}

/**
 * Force an immediate cloud save (no debounce).
 * Used by "Sync now" button in settings.
 */
export function forceSave(workspaceId, data) {
  if (!workspaceId || !isConfigured()) return Promise.resolve();
  if (_timer) clearTimeout(_timer);

  /* Save to localStorage too */
  try {
    var json = JSON.stringify(data);
    if (window.storage && typeof window.storage.set === "function") {
      window.storage.set("forecrest", json);
    } else {
      localStorage.setItem("forecrest", json);
    }
    localStorage.setItem("forecrest_local_ts", new Date().toISOString());
  } catch (e) { /* noop */ }

  return new Promise(function (resolve) {
    syncState.status = "syncing";
    notify();

    var sb = getSupabase();
    sb.from("workspaces")
      .update({
        app_state: data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workspaceId)
      .then(function (res) {
        if (res.error) {
          syncState.status = "error";
          syncState.error = res.error.message;
        } else {
          syncState.status = "synced";
          syncState.lastSync = new Date().toISOString();
          syncState.error = null;
        }
        notify();
        resolve();
      })
      .catch(function () {
        syncState.status = "error";
        notify();
        resolve();
      });
  });
}

/**
 * Load from cloud and compare with local timestamp.
 * Returns the newer version.
 */
export function loadWithConflictCheck(workspaceId) {
  if (!workspaceId || !isConfigured()) return Promise.resolve(null);

  var sb = getSupabase();
  return sb.from("workspaces")
    .select("app_state, updated_at")
    .eq("id", workspaceId)
    .single()
    .then(function (res) {
      if (res.error || !res.data) return null;

      var cloudData = res.data.app_state;
      var cloudTs = res.data.updated_at;
      var localTs = localStorage.getItem("forecrest_local_ts");

      /* If cloud is newer, return cloud data */
      if (cloudTs && localTs && new Date(cloudTs) > new Date(localTs)) {
        return { source: "cloud", data: cloudData };
      }

      /* Otherwise local wins (or no cloud data) */
      return { source: "local", data: null };
    })
    .catch(function () {
      return { source: "local", data: null };
    });
}

/* ── Online/offline detection ── */
function handleOnline() {
  if (syncState.status === "offline") {
    syncState.status = "synced";
    notify();
  }
}

function handleOffline() {
  syncState.status = "offline";
  notify();
}

if (typeof window !== "undefined") {
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  if (!navigator.onLine) {
    syncState.status = "offline";
  }
}
