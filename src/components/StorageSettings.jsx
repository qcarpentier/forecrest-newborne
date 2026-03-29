import { useState } from "react";
import { CloudCheck, SignOut, Trash, ArrowsClockwise, DownloadSimple, Copy, Check, PencilSimple } from "@phosphor-icons/react";
import Card from "./Card";
import Button from "./Button";
import ExplainerBox from "./ExplainerBox";
import SyncStatusBadge from "./SyncStatusBadge";
import { useAuth } from "../context/useAuth";
import { useT } from "../context/useLang";
import { forceSave } from "../utils/syncEngine";
import { resetClient, isConfigured, getStorageMode, hasCloudConfig } from "../lib/supabase";
import SCHEMA_SQL from "../lib/schema.sql?raw";

/* ── Reusable helpers matching SettingsPage patterns ── */
function SectionBlock({ title, sub, children }) {
  return (
    <div style={{ marginBottom: "var(--sp-6)" }}>
      <div style={{ marginBottom: "var(--sp-3)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{title}</div>
        {sub ? <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 2 }}>{sub}</div> : null}
      </div>
      <Card sx={{ padding: "var(--sp-1) var(--sp-4)" }}>
        {children}
      </Card>
    </div>
  );
}

function SettingRow({ label, desc, children, last }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "12px 0", borderBottom: last ? "none" : "1px solid var(--border-light)",
      gap: "var(--sp-4)",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{label}</div>
        {desc ? <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 1 }}>{desc}</div> : null}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function StepBadge({ n }) {
  return (
    <span style={{
      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700, color: "var(--brand)", background: "var(--brand-bg)",
      border: "1px solid var(--brand-border)",
    }}>
      {n}
    </span>
  );
}

function ModeButton({ icon, label, desc, active, onClick }) {
  var Icon = icon;
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "var(--sp-3)", borderRadius: "var(--r-md)",
      border: active ? "1.5px solid var(--brand)" : "1px solid var(--border)",
      background: active ? "var(--brand-bg)" : "var(--bg-card)",
      cursor: "pointer", textAlign: "center", transition: "all 0.12s",
    }}>
      <Icon size={20} weight={active ? "duotone" : "regular"} color={active ? "var(--brand)" : "var(--text-muted)"} />
      <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? "var(--brand)" : "var(--text-primary)", marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{desc}</div>
    </button>
  );
}

function downloadSchema() {
  var blob = new Blob([SCHEMA_SQL], { type: "text/sql" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "forecrest-schema.sql";
  a.click();
  URL.revokeObjectURL(url);
}

function copySchema(setCopied) {
  navigator.clipboard.writeText(SCHEMA_SQL).then(function () {
    setCopied(true);
    setTimeout(function () { setCopied(false); }, 2000);
  });
}

export default function StorageSettings({ getSnapshot }) {
  var t = useT().auth;
  var auth = useAuth();
  var [syncing, setSyncing] = useState(false);
  var [copied, setCopied] = useState(false);
  var [configSaved, setConfigSaved] = useState(false);
  var [editName, setEditName] = useState("");
  var [editingName, setEditingName] = useState(false);
  var [savingName, setSavingName] = useState(false);

  var cloudAvailable = hasCloudConfig();
  var currentMode = getStorageMode();
  var configured = isConfigured();

  /* Self-hosted fields */
  var [sbUrl, setSbUrl] = useState(function () {
    try { return localStorage.getItem("forecrest_sb_url") || ""; } catch (e) { return ""; }
  });
  var [sbKey, setSbKey] = useState(function () {
    try { return localStorage.getItem("forecrest_sb_key") || ""; } catch (e) { return ""; }
  });

  /* Which mode is the user viewing */
  var [viewMode, setViewMode] = useState(function () {
    if (currentMode === "self-hosted") return "selfhosted";
    if (currentMode === "cloud" || (cloudAvailable && !auth.user)) return "cloud";
    return "local";
  });

  function handleSyncNow() {
    if (!auth.workspaceId || !getSnapshot) return;
    setSyncing(true);
    forceSave(auth.workspaceId, getSnapshot()).then(function () {
      setSyncing(false);
    });
  }

  function handleSaveConfig() {
    try {
      localStorage.setItem("forecrest_sb_url", sbUrl.trim());
      localStorage.setItem("forecrest_sb_key", sbKey.trim());
      resetClient();
      setConfigSaved(true);
      setTimeout(function () { setConfigSaved(false); }, 2000);
    } catch (e) { /* noop */ }
  }

  function handleClearSelfHosted() {
    try {
      localStorage.removeItem("forecrest_sb_url");
      localStorage.removeItem("forecrest_sb_key");
      resetClient();
      setSbUrl("");
      setSbKey("");
    } catch (e) { /* noop */ }
  }

  function handleSaveName() {
    if (!editName.trim() || editName.trim() === auth.user.displayName) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    auth.updateDisplayName(editName.trim()).then(function () {
      setSavingName(false);
      setEditingName(false);
    }).catch(function () {
      setSavingName(false);
    });
  }

  function handleLogout() { auth.signOut(); }
  function handleDeleteAccount() {
    if (!window.confirm(t.settings_delete_confirm)) return;
    auth.deleteAccount();
  }

  /* ══════════════════════════════════════ */
  /* ── Logged in ── */
  /* ══════════════════════════════════════ */
  if (auth.user) {
    return (
      <>
        <SectionBlock title={t.settings_account} sub={t.settings_account_desc}>
          <SettingRow label={t.settings_email}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{auth.user.email}</span>
          </SettingRow>
          <SettingRow label={t.settings_display_name}>
            {editingName ? (
              <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
                <input
                  type="text"
                  value={editName}
                  onChange={function (e) { setEditName(e.target.value); }}
                  onKeyDown={function (e) { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                  autoFocus
                  style={{
                    width: 180, height: 32, padding: "0 var(--sp-2)",
                    border: "1px solid var(--brand)", borderRadius: "var(--r-md)",
                    background: "var(--bg-card)", color: "var(--text-primary)",
                    fontSize: 13, fontFamily: "inherit", outline: "none",
                  }}
                />
                <Button color="primary" size="sm" onClick={handleSaveName} isLoading={savingName}>
                  {t.settings_save || "OK"}
                </Button>
                <Button color="tertiary" size="sm" onClick={function () { setEditingName(false); }}>
                  {t.settings_cancel || "Annuler"}
                </Button>
              </div>
            ) : (
              <button
                onClick={function () { setEditName(auth.user.displayName || ""); setEditingName(true); }}
                style={{
                  border: "none", background: "transparent", cursor: "pointer", padding: 0,
                  fontSize: 13, color: "var(--text-secondary)", fontWeight: 500,
                  display: "flex", alignItems: "center", gap: "var(--sp-2)",
                }}
              >
                {auth.user.displayName}
                <PencilSimple size={12} color="var(--text-faint)" />
              </button>
            )}
          </SettingRow>
          <SettingRow label="Mode" last>
            <span style={{
              fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: "var(--r-sm)",
              background: currentMode === "cloud" ? "var(--brand-bg)" : "var(--color-info-bg)",
              color: currentMode === "cloud" ? "var(--brand)" : "var(--color-info)",
              border: "1px solid " + (currentMode === "cloud" ? "var(--brand-border)" : "var(--color-info-border)"),
            }}>
              {currentMode === "cloud" ? "Cloud Forecrest" : "Self-hosted"}
            </span>
          </SettingRow>
        </SectionBlock>

        <SectionBlock title={t.sync_title} sub={t.sync_desc}>
          <SettingRow label="Status">
            <SyncStatusBadge />
          </SettingRow>
          <SettingRow label={t.sync_now} last>
            <Button color="secondary" size="sm" onClick={handleSyncNow} isLoading={syncing} iconLeading={<ArrowsClockwise size={14} />}>
              {t.sync_now}
            </Button>
          </SettingRow>
        </SectionBlock>

        {currentMode !== "cloud" ? (
          <SectionBlock title={t.settings_download_sql}>
            <div style={{ padding: "12px 0", display: "flex", gap: "var(--sp-2)" }}>
              <Button color="tertiary" size="sm" onClick={downloadSchema} iconLeading={<DownloadSimple size={14} />}>
                {t.settings_download_sql}
              </Button>
              <Button color="tertiary" size="sm" onClick={function () { copySchema(setCopied); }} iconLeading={copied ? <Check size={14} /> : <Copy size={14} />}>
                {copied ? t.settings_copied : t.settings_copy_sql}
              </Button>
            </div>
          </SectionBlock>
        ) : null}

        <div style={{ display: "flex", gap: "var(--sp-3)", marginTop: "var(--sp-4)" }}>
          <Button color="tertiary-destructive" size="md" onClick={handleLogout} iconLeading={<SignOut size={16} />}>
            {t.auth_logout}
          </Button>
          <Button color="primary-destructive" size="md" onClick={handleDeleteAccount} iconLeading={<Trash size={16} />}>
            {t.auth_delete_account}
          </Button>
        </div>
      </>
    );
  }

  /* ══════════════════════════════════════ */
  /* ── Not logged in — setup guide ── */
  /* ══════════════════════════════════════ */
  return (
    <>
      {/* ── Cloud Forecrest mode (env vars set) — user not logged in = auth gate handles it ── */}
      {cloudAvailable ? (
        <ExplainerBox variant="tip" title="Cloud Forecrest">
          {t.settings_cloud_desc}
        </ExplainerBox>
      ) : null}

      {/* ── Self-hosted mode (no env vars = GitHub clone) ── */}
      {!cloudAvailable ? (
        <>
          {/* Step 1: Schema */}
          <SectionBlock
            title={<span style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}><StepBadge n={1} /> {t.settings_step_schema}</span>}
            sub={t.settings_step_schema_desc}
          >
            <div style={{ padding: "12px 0" }}>
              <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                <Button color="primary" size="sm" onClick={downloadSchema} iconLeading={<DownloadSimple size={14} />}>
                  {t.settings_download_sql}
                </Button>
                <Button color="secondary" size="sm" onClick={function () { copySchema(setCopied); }} iconLeading={copied ? <Check size={14} /> : <Copy size={14} />}>
                  {copied ? t.settings_copied : t.settings_copy_sql}
                </Button>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-faint)", marginTop: "var(--sp-3)", lineHeight: 1.5 }}>
                {t.settings_step_schema_hint}
              </p>
            </div>
          </SectionBlock>

          {/* Step 2: Config */}
          <SectionBlock
            title={<span style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}><StepBadge n={2} /> {t.settings_step_config}</span>}
            sub={t.settings_step_config_desc}
          >
            <SettingRow label={t.settings_sb_url} desc={t.settings_sb_url_hint}>
              <input type="text" value={sbUrl} onChange={function (e) { setSbUrl(e.target.value); }} placeholder="https://xxx.supabase.co"
                style={{ width: 260, height: 36, padding: "0 12px", fontSize: 12, background: "var(--bg-page)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", color: "var(--text-primary)", outline: "none" }} />
            </SettingRow>
            <SettingRow label={t.settings_sb_key} desc={t.settings_sb_key_hint} last>
              <input type="password" value={sbKey} onChange={function (e) { setSbKey(e.target.value); }} placeholder="eyJ..."
                style={{ width: 260, height: 36, padding: "0 12px", fontSize: 12, background: "var(--bg-page)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", color: "var(--text-primary)", outline: "none" }} />
            </SettingRow>
            <div style={{ padding: "12px 0 4px", display: "flex", alignItems: "center", gap: "var(--sp-3)", justifyContent: "flex-end" }}>
              {configSaved ? (
                <span style={{ fontSize: 12, color: "var(--color-success)", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                  <Check size={14} /> {t.settings_saved}
                </span>
              ) : null}
              <Button color="primary" size="sm" onClick={handleSaveConfig} isDisabled={!sbUrl.trim() || !sbKey.trim()}>
                {t.settings_save_config}
              </Button>
            </div>
          </SectionBlock>

          {/* Step 3: Auth */}
          <SectionBlock
            title={<span style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}><StepBadge n={3} /> {t.settings_step_auth}</span>}
            sub={t.settings_step_auth_desc}
          >
            <div style={{ padding: "12px 0" }}>
              <Button
                color={configured ? "primary" : "tertiary"}
                size="md" onClick={function () { auth.signOut(); }} isDisabled={!configured}
                iconLeading={<CloudCheck size={16} weight="duotone" />}
                sx={{ width: "100%" }}
              >
                {t.settings_login_btn}
              </Button>
              {!configured ? (
                <p style={{ fontSize: 12, color: "var(--text-faint)", marginTop: "var(--sp-2)", textAlign: "center" }}>
                  {t.settings_config_first}
                </p>
              ) : null}
            </div>
          </SectionBlock>
        </>
      ) : null}
    </>
  );
}
