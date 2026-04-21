import { useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { QrCode, Copy, DownloadSimple, ArrowClockwise, CheckCircle, Warning, ArrowSquareOut, FileArrowDown } from "@phosphor-icons/react";
import Modal, { ModalBody, ModalFooter } from "./Modal";
import ButtonUtility from "./ButtonUtility";
import { useT, useLang } from "../context";
import { encodeViewerSnapshot, VIEWER_URL_HARD_LIMIT, VIEWER_URL_SOFT_LIMIT } from "../utils/viewerSnapshot";
import { VERSION } from "../constants/config";

function formatBytes(n) {
  if (n < 1024) return n + " B";
  return (n / 1024).toFixed(1) + " KB";
}

function slug(str) {
  return (str || "snapshot").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "snapshot";
}

export default function ViewerSharePanel({ open, onClose, getFullSnapshot }) {
  var t = useT();
  var { lang } = useLang();
  var vt = (t && t.viewer) || {};
  var canvasRef = useRef(null);
  var [copied, setCopied] = useState(false);
  var [nonce, setNonce] = useState(0);

  var encoded = useMemo(function () {
    if (!open) return null;
    try {
      var full = getFullSnapshot();
      var origin = (typeof window !== "undefined" && window.location && window.location.origin) || "";
      return encodeViewerSnapshot(full, {
        appVersion: VERSION,
        origin: origin,
      });
    } catch (e) {
      return { error: e && e.message ? e.message : "encode_failed" };
    }
  // eslint-disable-next-line
  }, [open, nonce]);

  var url = useMemo(function () {
    if (!encoded || encoded.error) return "";
    var origin = (typeof window !== "undefined" && window.location && window.location.origin) || "";
    return origin + "/?view=" + encoded.payload;
  }, [encoded]);

  if (!open) return null;

  var isOversized = encoded && encoded.sizeLevel === "over";
  var isWarn = encoded && encoded.sizeLevel === "warn";

  function handleCopy() {
    if (!url) return;
    try {
      navigator.clipboard.writeText(url).then(function () {
        setCopied(true);
        setTimeout(function () { setCopied(false); }, 2000);
      });
    } catch (e) {}
  }

  function handleDownloadPng() {
    var canvas = canvasRef.current && canvasRef.current.querySelector("canvas");
    if (!canvas) return;
    try {
      var dataUrl = canvas.toDataURL("image/png");
      var a = document.createElement("a");
      var company = (encoded && encoded.envelope && encoded.envelope.companyName) || "";
      a.download = "forecrest-" + slug(company) + "-qr.png";
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {}
  }

  function handleFallbackExport() {
    if (!encoded || !encoded.envelope) return;
    try {
      var blob = new Blob([JSON.stringify(encoded.envelope, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      var company = (encoded.envelope && encoded.envelope.companyName) || "";
      a.download = "forecrest-" + slug(company) + ".fcviewer.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (e) {}
  }

  function handleRegenerate() {
    setNonce(function (v) { return v + 1; });
    setCopied(false);
  }

  function handlePreview() {
    if (!url) return;
    try { window.open(url, "_blank", "noopener,noreferrer"); } catch (e) {}
  }

  var createdLabel = "";
  if (encoded && encoded.envelope && encoded.envelope.createdAt) {
    try {
      createdLabel = new Date(encoded.envelope.createdAt).toLocaleString(lang === "en" ? "en-US" : "fr-FR", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch (e) {}
  }

  var sizeColor = isOversized ? "var(--color-error)" : isWarn ? "var(--color-warning)" : "var(--color-success)";
  var sizeText = isOversized ? (vt.size_over || "Payload too large for QR")
    : isWarn ? (vt.size_warn || "Dense QR — scan in good light")
    : (vt.size_ok || "Optimal size");

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={vt.panel_title || (lang === "fr" ? "Partager en lecture seule" : "Share read-only")}
      subtitle={vt.panel_subtitle || (lang === "fr" ? "Un QR code figé. Les données actuelles seront visibles en lecture seule." : "A frozen QR code. Current data will be visible read-only.")}
      icon={<QrCode size={22} weight="duotone" color="var(--brand)" />}
    >
      <ModalBody>
        {encoded && encoded.error ? (
          <div style={{ padding: "var(--sp-4)", background: "var(--color-error-bg)", border: "1px solid var(--color-error-border)", borderRadius: "var(--r-md)", color: "var(--color-error)", fontSize: 13 }}>
            {vt.encode_error || "Failed to generate link"}
          </div>
        ) : null}

        {encoded && !encoded.error ? (
          <>
            {/* QR or fallback */}
            <div ref={canvasRef} style={{
              display: "flex", justifyContent: "center", alignItems: "center",
              padding: "var(--sp-5)",
              background: isOversized ? "var(--color-warning-bg)" : "#FFF",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--border)",
              marginBottom: "var(--sp-4)",
              minHeight: 280,
            }}>
              {isOversized ? (
                <div style={{ textAlign: "center", maxWidth: 320 }}>
                  <Warning size={40} weight="duotone" color="var(--color-warning)" style={{ marginBottom: "var(--sp-3)" }} />
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-2)" }}>
                    {vt.fallback_title || (lang === "fr" ? "Données trop volumineuses" : "Data too large")}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "var(--sp-3)" }}>
                    {vt.fallback_desc || (lang === "fr"
                      ? "Votre Forecrest contient trop de données pour un QR code. Téléchargez un fichier et envoyez-le par email ou messagerie."
                      : "Your Forecrest has too much data for a QR code. Download a file and send it by email or chat.")}
                  </div>
                  <button
                    type="button"
                    onClick={handleFallbackExport}
                    style={{
                      padding: "8px 16px", fontSize: 13, fontWeight: 600,
                      color: "#fff", background: "var(--brand)",
                      border: "none", borderRadius: "var(--r-md)", cursor: "pointer",
                      display: "inline-flex", alignItems: "center", gap: 6,
                    }}
                  >
                    <FileArrowDown size={14} weight="bold" />
                    {vt.fallback_download || (lang === "fr" ? "Télécharger le fichier" : "Download file")}
                  </button>
                </div>
              ) : (
                <QRCodeCanvas
                  value={url}
                  size={256}
                  level="M"
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                  includeMargin={true}
                />
              )}
            </div>

            {/* URL preview */}
            {!isOversized ? (
              <div style={{
                fontSize: 11, color: "var(--text-muted)",
                background: "var(--bg-page)",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--r-md)",
                padding: "8px 12px",
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                wordBreak: "break-all",
                marginBottom: "var(--sp-3)",
                maxHeight: 54, overflow: "hidden",
              }}>
                {url}
              </div>
            ) : null}

            {/* Meta info */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-2) var(--sp-4)", fontSize: 12, color: "var(--text-muted)", marginBottom: "var(--sp-3)" }}>
              <div>
                <div style={{ color: "var(--text-faint)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {vt.company_label || (lang === "fr" ? "Entreprise" : "Company")}
                </div>
                <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                  {(encoded.envelope && encoded.envelope.companyName) || "—"}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--text-faint)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {vt.created_label || (lang === "fr" ? "Généré" : "Generated")}
                </div>
                <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{createdLabel}</div>
              </div>
              <div>
                <div style={{ color: "var(--text-faint)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {vt.size_label || (lang === "fr" ? "Taille" : "Size")}
                </div>
                <div style={{ color: sizeColor, fontWeight: 600 }}>
                  {formatBytes(encoded.payloadBytes)} · {sizeText}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--text-faint)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {vt.version_label || "Forecrest"}
                </div>
                <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>v{(encoded.envelope && encoded.envelope.appVersion) || VERSION}</div>
              </div>
            </div>

            {/* Privacy note */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: "var(--sp-2)",
              padding: "var(--sp-3)",
              background: "var(--brand-bg)",
              border: "1px solid var(--brand-border)",
              borderRadius: "var(--r-md)",
              fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5,
            }}>
              <CheckCircle size={14} weight="fill" color="var(--brand)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                {vt.privacy_note || (lang === "fr"
                  ? "Ce lien n'inclut pas votre email, téléphone ni adresse. Les données sont figées au moment de la génération."
                  : "This link does not include your email, phone or address. Data is frozen at generation time.")}
              </span>
            </div>
          </>
        ) : null}
      </ModalBody>

      <ModalFooter>
        {!isOversized && encoded && !encoded.error ? (
          <>
            <button
              type="button"
              onClick={handlePreview}
              style={{
                padding: "8px 14px", fontSize: 13, fontWeight: 600,
                color: "var(--text-secondary)",
                background: "transparent",
                border: "1px solid var(--border-strong)",
                borderRadius: "var(--r-md)", cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              <ArrowSquareOut size={14} weight="bold" />
              {vt.action_preview || (lang === "fr" ? "Prévisualiser" : "Preview")}
            </button>
            <ButtonUtility
              icon={<ArrowClockwise size={16} />}
              variant="default"
              size="md"
              onClick={handleRegenerate}
              title={vt.action_regenerate || (lang === "fr" ? "Régénérer" : "Regenerate")}
            />
            <ButtonUtility
              icon={<DownloadSimple size={16} />}
              variant="default"
              size="md"
              onClick={handleDownloadPng}
              title={vt.action_download_png || (lang === "fr" ? "Télécharger PNG" : "Download PNG")}
            />
            <button
              type="button"
              onClick={handleCopy}
              style={{
                padding: "8px 16px", fontSize: 13, fontWeight: 600,
                color: "#fff",
                background: copied ? "var(--color-success)" : "var(--brand)",
                border: "none", borderRadius: "var(--r-md)", cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 6,
                transition: "background 0.15s",
              }}
            >
              {copied ? <CheckCircle size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
              {copied ? (vt.action_copied || (lang === "fr" ? "Copié" : "Copied")) : (vt.action_copy_link || (lang === "fr" ? "Copier le lien" : "Copy link"))}
            </button>
          </>
        ) : null}
        {isOversized ? (
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px", fontSize: 13, fontWeight: 600,
              color: "var(--text-secondary)", background: "transparent",
              border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)", cursor: "pointer",
            }}
          >
            {t.close || "Close"}
          </button>
        ) : null}
      </ModalFooter>
    </Modal>
  );
}
