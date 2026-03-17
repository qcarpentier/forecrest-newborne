import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, DownloadSimple, UploadSimple, CloudArrowUp, CheckCircle, WarningCircle, LinkSimple } from "@phosphor-icons/react";
import { useT } from "../context";

export default function ExportImportModal({
  open, onClose,
  cfg, costs, sals, grants, poolSize, shareholders, roundSim, streams, esopEnabled, debts,
  setCfg, setCosts, setSals, setGrants, setPoolSize, setShareholders, setRoundSim, setStreams, setEsopEnabled, setDebts,
}) {
  var t = useT().settings;
  var [importText, setImportText] = useState("");
  var [error, setError] = useState(null);
  var [success, setSuccess] = useState(false);
  var [dragging, setDragging] = useState(false);
  var [linkCopied, setLinkCopied] = useState(false);
  var fileRef = useRef(null);
  var prevOverflow = useRef("");

  useEffect(function () {
    if (open) {
      prevOverflow.current = document.documentElement.style.overflowY;
      document.documentElement.style.overflowY = "hidden";
    } else {
      document.documentElement.style.overflowY = prevOverflow.current;
      setImportText("");
      setError(null);
      setSuccess(false);
      setDragging(false);
      setLinkCopied(false);
    }
    return function () { document.documentElement.style.overflowY = prevOverflow.current; };
  }, [open]);

  useEffect(function () {
    if (!open) return;
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return function () { window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  if (!open) return null;

  function handleExport() {
    var data = JSON.stringify(
      { cfg, costs, sals, grants, poolSize, shareholders, roundSim, streams, esopEnabled, debts },
      null, 2
    );
    var blob = new Blob([data], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "forecrest-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function readFile(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      setImportText(e.target.result);
      setError(null);
    };
    reader.readAsText(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    var file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".json")) readFile(file);
  }

  function applyData(d) {
    if (d.cfg) setCfg(d.cfg);
    if (d.costs) setCosts(d.costs);
    if (d.sals) setSals(d.sals);
    if (d.grants) setGrants(d.grants);
    if (d.poolSize !== undefined) setPoolSize(d.poolSize);
    if (d.shareholders) setShareholders(d.shareholders);
    if (d.roundSim) setRoundSim(d.roundSim);
    if (d.streams) setStreams(d.streams);
    if (d.esopEnabled !== undefined) setEsopEnabled(d.esopEnabled);
    if (d.debts) setDebts(d.debts);
  }

  function handleApply() {
    try {
      var d = JSON.parse(importText);
      applyData(d);
      setError(null);
      setSuccess(true);
      setTimeout(function () { onClose(); }, 900);
    } catch (e) {
      setError(t.io_error);
    }
  }

  function handleShare() {
    var data = { cfg, costs, sals, grants, poolSize, shareholders, roundSim, streams, esopEnabled, debts };
    var hash = btoa(encodeURIComponent(JSON.stringify(data)));
    var url = window.location.origin + window.location.pathname + "#" + hash;
    navigator.clipboard.writeText(url).then(function () {
      setLinkCopied(true);
      setTimeout(function () { setLinkCopied(false); }, 2500);
    });
  }

  var canApply = importText.trim().length > 0 && !success;

  return createPortal(
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "var(--overlay-bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "var(--page-px)",
      }}
    >
      {/* Modal card */}
      <div
        onClick={function (e) { e.stopPropagation(); }}
        style={{
          background: "var(--bg-card)",
          borderRadius: "var(--r-xl)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-modal)",
          width: "100%", maxWidth: 560,
          maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          padding: "var(--sp-6) var(--sp-6) var(--sp-4)",
          borderBottom: "1px solid var(--border-light)",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
              {t.io_title}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{t.io_subtitle}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid var(--border)", borderRadius: "var(--r-md)",
              background: "transparent", cursor: "pointer", flexShrink: 0, marginLeft: "var(--sp-4)",
            }}
          >
            <X size={16} color="var(--text-muted)" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "var(--sp-6)" }}>

          {/* ── Export ── */}
          <div style={{
            padding: "var(--sp-4)", borderRadius: "var(--r-lg)",
            border: "1px solid var(--border)", marginBottom: "var(--sp-5)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
                  {t.io_export}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.io_export_desc}</div>
              </div>
              <button
                onClick={handleExport}
                style={{
                  display: "flex", alignItems: "center", gap: "var(--sp-2)",
                  padding: "8px 16px", borderRadius: "var(--r-md)",
                  border: "1px solid var(--border-strong)", background: "var(--bg-card)",
                  fontSize: 13, fontWeight: 600, color: "var(--text-secondary)",
                  cursor: "pointer", flexShrink: 0, marginLeft: "var(--sp-4)",
                  whiteSpace: "nowrap",
                }}
              >
                <DownloadSimple size={15} weight="bold" />
                {t.io_export_btn}
              </button>
            </div>
          </div>

          {/* ── Share link ── */}
          <div style={{
            padding: "var(--sp-4)", borderRadius: "var(--r-lg)",
            border: "1px solid var(--border)", marginBottom: "var(--sp-5)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
                  {t.io_share}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.io_share_desc}</div>
              </div>
              <button
                onClick={handleShare}
                style={{
                  display: "flex", alignItems: "center", gap: "var(--sp-2)",
                  padding: "8px 16px", borderRadius: "var(--r-md)",
                  border: linkCopied ? "1px solid var(--color-success-border)" : "1px solid var(--border-strong)",
                  background: linkCopied ? "var(--color-success-bg)" : "var(--bg-card)",
                  fontSize: 13, fontWeight: 600,
                  color: linkCopied ? "var(--color-success)" : "var(--text-secondary)",
                  cursor: "pointer", flexShrink: 0, marginLeft: "var(--sp-4)",
                  whiteSpace: "nowrap", transition: "all 0.2s",
                }}
              >
                {linkCopied
                  ? <><CheckCircle size={15} weight="fill" />{t.io_share_copied}</>
                  : <><LinkSimple size={15} weight="bold" />{t.io_share_btn}</>
                }
              </button>
            </div>
          </div>

          {/* ── Import ── */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
              {t.io_import_label}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: "var(--sp-4)" }}>
              {t.io_import_desc}
            </div>

            {/* Drop zone */}
            <div
              onDragOver={function (e) { e.preventDefault(); setDragging(true); }}
              onDragLeave={function () { setDragging(false); }}
              onDrop={handleDrop}
              onClick={function () { fileRef.current && fileRef.current.click(); }}
              style={{
                border: "2px dashed " + (dragging ? "var(--brand)" : "var(--border-strong)"),
                borderRadius: "var(--r-lg)",
                padding: "var(--sp-6) var(--sp-4)",
                textAlign: "center",
                cursor: "pointer",
                background: dragging ? "var(--brand-bg)" : "var(--bg-accordion)",
                transition: "all 0.15s",
                marginBottom: "var(--sp-4)",
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                style={{ display: "none" }}
                onChange={function (e) { if (e.target.files[0]) readFile(e.target.files[0]); }}
              />
              <CloudArrowUp
                size={28}
                weight="thin"
                color={dragging ? "var(--brand)" : "var(--text-faint)"}
                style={{ marginBottom: "var(--sp-2)" }}
              />
              <div style={{ fontSize: 13, fontWeight: 600, color: dragging ? "var(--brand)" : "var(--text-secondary)", marginBottom: 2 }}>
                {t.io_dropzone}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-faint)" }}>{t.io_dropzone_hint}</div>
            </div>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-4)" }}>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span style={{ fontSize: 12, color: "var(--text-faint)", fontWeight: 500 }}>{t.io_or}</span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            {/* Paste textarea */}
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-2)" }}>
              {t.io_paste_label}
            </div>
            <textarea
              value={importText}
              onChange={function (e) { setImportText(e.target.value); setError(null); setSuccess(false); }}
              placeholder={t.io_paste_placeholder}
              style={{
                width: "100%", height: 140,
                padding: "var(--sp-3)",
                border: "1px solid " + (error ? "var(--color-error-border)" : "var(--border-strong)"),
                borderRadius: "var(--r-md)",
                fontSize: 12, fontFamily: "ui-monospace, monospace",
                resize: "vertical",
                background: "var(--input-bg)",
                color: "var(--text-primary)",
                outline: "none",
                lineHeight: 1.5,
                transition: "border-color 0.15s",
              }}
            />

            {/* Error / Success feedback */}
            {error ? (
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginTop: "var(--sp-2)", fontSize: 12, color: "var(--color-error)" }}>
                <WarningCircle size={14} weight="fill" />
                {error}
              </div>
            ) : null}
            {success ? (
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginTop: "var(--sp-2)", fontSize: 12, color: "var(--color-success)" }}>
                <CheckCircle size={14} weight="fill" />
                {t.io_success}
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", justifyContent: "flex-end", gap: "var(--sp-3)",
          padding: "var(--sp-4) var(--sp-6)",
          borderTop: "1px solid var(--border-light)",
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px", borderRadius: "var(--r-md)",
              border: "1px solid var(--border-strong)", background: "var(--bg-card)",
              fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer",
            }}
          >
            {t.io_cancel}
          </button>
          <button
            onClick={handleApply}
            disabled={!canApply}
            style={{
              padding: "8px 20px", borderRadius: "var(--r-md)",
              border: "none",
              background: canApply ? "var(--brand)" : "var(--border-strong)",
              fontSize: 13, fontWeight: 600,
              color: canApply ? "var(--color-on-brand)" : "var(--text-faint)",
              cursor: canApply ? "pointer" : "default",
              display: "flex", alignItems: "center", gap: "var(--sp-2)",
              transition: "background 0.15s",
            }}
          >
            <UploadSimple size={14} weight="bold" />
            {t.io_apply}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
