import { useState, useRef, useEffect } from "react";
import { DownloadSimple, UploadSimple, CloudArrowUp, CheckCircle, WarningCircle, LinkSimple } from "@phosphor-icons/react";
import { useT } from "../context";
import { Button } from "../components";
import Modal, { ModalBody, ModalFooter, ModalDivider } from "./Modal";

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

  useEffect(function () {
    if (!open) {
      setImportText("");
      setError(null);
      setSuccess(false);
      setDragging(false);
      setLinkCopied(false);
    }
  }, [open]);

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

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={t.io_title}
      subtitle={t.io_subtitle}
    >
      <ModalDivider />

      <ModalBody>
        {/* ── Export ── */}
        <div style={{
          padding: "var(--sp-4)", borderRadius: "var(--r-lg)",
          border: "1px solid var(--border)", marginBottom: "var(--sp-5)",
          marginTop: "var(--sp-5)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
                {t.io_export}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.io_export_desc}</div>
            </div>
            <Button color="secondary" size="md" onClick={handleExport} iconLeading={<DownloadSimple size={15} weight="bold" />} sx={{ flexShrink: 0, marginLeft: "var(--sp-4)" }}>
              {t.io_export_btn}
            </Button>
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
            <Button
              color={linkCopied ? "secondary" : "secondary"}
              size="md"
              onClick={handleShare}
              iconLeading={linkCopied ? <CheckCircle size={15} weight="fill" /> : <LinkSimple size={15} weight="bold" />}
              sx={{
                flexShrink: 0, marginLeft: "var(--sp-4)",
                borderColor: linkCopied ? "var(--color-success-border)" : undefined,
                background: linkCopied ? "var(--color-success-bg)" : undefined,
                color: linkCopied ? "var(--color-success)" : undefined,
              }}
            >
              {linkCopied ? t.io_share_copied : t.io_share_btn}
            </Button>
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
      </ModalBody>

      <ModalFooter>
        <Button color="tertiary" size="md" onClick={onClose}>
          {t.io_cancel}
        </Button>
        <Button
          color="primary"
          size="md"
          onClick={handleApply}
          isDisabled={!canApply}
          iconLeading={<UploadSimple size={14} weight="bold" />}
        >
          {t.io_apply}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
