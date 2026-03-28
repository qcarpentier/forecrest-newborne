import { useState, useEffect } from "react";
import { subscribeSyncState, getSyncState } from "../utils/syncEngine";
import { useT } from "../context/useLang";

var STATUS_CONFIG = {
  synced: { color: "var(--color-success)", animate: false },
  syncing: { color: "var(--brand)", animate: true },
  pending: { color: "var(--color-warning)", animate: false },
  offline: { color: "var(--text-faint)", animate: false },
  error: { color: "var(--color-error)", animate: false },
};

export default function SyncStatusBadge() {
  var t = useT().auth;
  var [state, setState] = useState(getSyncState);

  useEffect(function () {
    return subscribeSyncState(function (s) {
      setState({ status: s.status, lastSync: s.lastSync, error: s.error });
    });
  }, []);

  var cfg = STATUS_CONFIG[state.status] || STATUS_CONFIG.synced;
  var label = t["sync_status_" + state.status] || state.status;

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontSize: 12, color: "var(--text-muted)",
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%",
        background: cfg.color,
        animation: cfg.animate ? "pulse 1.2s ease infinite" : "none",
        flexShrink: 0,
      }} />
      <span style={{ fontWeight: 500 }}>{label}</span>
      {state.lastSync ? (
        <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
          ({t.sync_last_sync}: {new Date(state.lastSync).toLocaleTimeString()})
        </span>
      ) : null}
    </div>
  );
}
