import { useState, useRef, useCallback, useEffect } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { HexColorPicker } from "react-colorful";
import {
  DownloadSimple, MagnifyingGlass, Globe,
  CheckCircle, XCircle, CircleNotch, QrCode, Sun, Moon, Plus, CaretDown, PaintBucket,
  EnvelopeSimple, Phone, WifiHigh, Lock, TextT, AddressBook, LinkSimple, WarningCircle, Eye, EyeSlash,
} from "@phosphor-icons/react";
import { PageLayout, Button, SelectDropdown, DataTable, Badge, SearchInput, FilterDropdown, ActionBtn } from "../components";
import { useT } from "../context";

/* ── Styles ── */

var CARD = {
  border: "1px solid var(--border)",
  borderRadius: "var(--r-lg)",
  background: "var(--bg-card)",
  padding: "var(--sp-5)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--sp-4)",
};

var SECTION_LABEL = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  margin: 0,
};

var FIELD_LABEL = {
  fontSize: 12,
  fontWeight: 500,
  color: "var(--text-secondary)",
  marginBottom: 4,
};

var INPUT_STYLE = {
  width: "100%",
  height: 40,
  padding: "0 var(--sp-3)",
  fontSize: 14,
  border: "1px solid var(--border)",
  borderRadius: "var(--r-md)",
  background: "var(--input-bg)",
  color: "var(--text-primary)",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

/* ── Form field with leading icon, hint, error — Untitled UI pattern ── */
function FormField({ label, icon, leading, hint, error, children }) {
  var Icon = icon;
  var hasLeading = !!leading || !!icon;
  var borderColor = error ? "var(--color-error)" : "var(--border)";

  return (
    <div>
      {label ? <div style={FIELD_LABEL}>{label}</div> : null}
      <div style={{ position: "relative", display: "flex", alignItems: "stretch" }}>
        {leading ? (
          <div style={{
            display: "flex", alignItems: "center",
            padding: "0 12px", fontSize: 13, color: "var(--text-muted)", fontWeight: 500,
            background: "var(--bg-accordion)",
            border: "1px solid " + borderColor, borderRight: "none",
            borderRadius: "var(--r-md) 0 0 var(--r-md)",
            whiteSpace: "nowrap", userSelect: "none",
          }}>
            {leading}
          </div>
        ) : null}
        <div style={{ position: "relative", flex: 1 }}>
          {Icon && !leading ? (
            <div style={{ position: "absolute", left: 12, top: 0, bottom: 0, display: "flex", alignItems: "center", pointerEvents: "none" }}>
              <Icon size={16} weight="regular" color="var(--text-muted)" />
            </div>
          ) : null}
          {children({ style: Object.assign({}, INPUT_STYLE, {
            paddingLeft: Icon && !leading ? 36 : "var(--sp-3)",
            borderColor: borderColor,
            borderRadius: leading ? "0 var(--r-md) var(--r-md) 0" : "var(--r-md)",
          }) })}
        </div>
        {error ? (
          <div style={{ position: "absolute", right: 12, top: 0, bottom: 0, display: "flex", alignItems: "center", pointerEvents: "none" }}>
            <WarningCircle size={16} weight="fill" color="var(--color-error)" />
          </div>
        ) : null}
      </div>
      {hint || error ? (
        <div style={{ marginTop: 4, fontSize: 12, color: error ? "var(--color-error)" : "var(--text-faint)", lineHeight: 1.4 }}>
          {error || hint}
        </div>
      ) : null}
    </div>
  );
}

var TLDS = [".be", ".com", ".eu", ".io", ".app"];

var SIZE_OPTIONS = [
  { value: "256", label: "Petit" },
  { value: "512", label: "Moyen" },
  { value: "1024", label: "Grand" },
];

var EC_OPTIONS = [
  { value: "L", label: "Basique" },
  { value: "M", label: "Standard" },
  { value: "Q", label: "Élevée" },
  { value: "H", label: "Maximale" },
];

var FORMAT_OPTIONS = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
  { value: "svg", label: "SVG" },
];

var QR_TYPES = [
  { value: "url", label: "URL", prefix: "", placeholder: "www.monsite.be", icon: LinkSimple, leading: "https://", hint: "Entrez l'adresse de votre site web.", hintEn: "Enter your website address." },
  { value: "text", label: "Texte", prefix: "", placeholder: "Mon texte libre", icon: TextT, hint: "Texte libre encodé dans le QR code.", hintEn: "Free text encoded in the QR code." },
  { value: "email", label: "Email", prefix: "mailto:", placeholder: "olivia@exemple.be", icon: EnvelopeSimple, hint: "L'application mail s'ouvrira au scan.", hintEn: "The mail app will open on scan." },
  { value: "phone", label: "Téléphone", prefix: "tel:", placeholder: "470 12 34 56", icon: Phone, hint: "Le téléphone composera le numéro au scan.", hintEn: "The phone will dial the number on scan." },
  { value: "wifi", label: "WiFi", prefix: "", placeholder: "Nom du réseau", icon: WifiHigh, hint: "Le téléphone se connectera automatiquement au scan.", hintEn: "The phone will auto-connect on scan." },
  { value: "vcard", label: "vCard", prefix: "", placeholder: "Prénom Nom", icon: AddressBook, hint: "Ajoute un contact directement au carnet d'adresses.", hintEn: "Adds a contact directly to the address book." },
];

/* ── QR foreground color presets — 2 rows of 6 ── */
var FG_COLORS = [
  "#0E0E0D", "#334155", "#1E3A5F", "#1E40AF", "#7C3AED", "#E8431A",
  "#475569", "#0D9488", "#166534", "#2563EB", "#DB2777", "#D97706",
];

/* ── QR Color Palette (2-row grid + popover color picker) ── */
function QrColorPalette({ value, onChange, label }) {
  var [pickerOpen, setPickerOpen] = useState(false);
  var popRef = useRef(null);
  var isCustom = FG_COLORS.indexOf(value) === -1;

  /* Close popover on outside click */
  useEffect(function () {
    if (!pickerOpen) return;
    function onDown(e) { if (popRef.current && !popRef.current.contains(e.target)) setPickerOpen(false); }
    document.addEventListener("mousedown", onDown);
    return function () { document.removeEventListener("mousedown", onDown); };
  }, [pickerOpen]);

  return (
    <div>
      {label ? <div style={FIELD_LABEL}>{label}</div> : null}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 28px)", gap: 6 }}>
        {FG_COLORS.map(function (color) {
          var isActive = value.toLowerCase() === color.toLowerCase();
          return (
            <button key={color} type="button" onClick={function () { onChange(color); setPickerOpen(false); }} title={color}
              style={{
                width: 28, height: 28, borderRadius: "50%", border: "none", background: color, cursor: "pointer", padding: 0,
                boxShadow: isActive ? "0 0 0 2px var(--bg-card), 0 0 0 3.5px " + color : "inset 0 0 0 1px rgba(0,0,0,0.08)",
                transition: "box-shadow 0.12s",
              }}
            />
          );
        })}
        {/* Pick custom color button */}
        <div style={{ position: "relative" }}>
          <button type="button" onClick={function () { setPickerOpen(function (v) { return !v; }); }}
            style={{
              width: 28, height: 28, borderRadius: "50%", cursor: "pointer", padding: 0,
              border: isCustom ? "none" : "1.5px dashed var(--border-strong)",
              background: isCustom ? value : "var(--bg-accordion)",
              boxShadow: isCustom ? "0 0 0 2px var(--bg-card), 0 0 0 3.5px " + value : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "box-shadow 0.12s",
            }}>
            {!isCustom ? <Plus size={14} weight="bold" color="var(--text-faint)" /> : null}
          </button>
          {pickerOpen ? (
            <div ref={popRef} style={{
              position: "absolute", top: 36, right: 0, zIndex: 50,
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)", boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
              padding: 12,
            }}>
              <HexColorPicker color={value} onChange={onChange} style={{ width: 200, height: 160 }} />
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: value, border: "1px solid var(--border)", flexShrink: 0 }} />
                <input type="text" value={value} onChange={function (e) { onChange(e.target.value); }} maxLength={7}
                  style={Object.assign({}, INPUT_STYLE, { height: 28, fontSize: 12, fontFamily: "ui-monospace, monospace" })}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton QR (placeholder) ── */

function SkeletonQR() {
  var cells = [];
  var i, j;
  for (i = 0; i < 5; i++) {
    for (j = 0; j < 5; j++) {
      var isCorner = (i < 2 && j < 2) || (i < 2 && j > 2) || (i > 2 && j < 2);
      cells.push(
        <div
          key={i + "-" + j}
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            background: isCorner ? "var(--border)" : (i + j) % 2 === 0 ? "var(--border)" : "transparent",
            opacity: isCorner ? 0.8 : 0.4,
          }}
        />
      );
    }
  }
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(5, 18px)",
      gap: 4,
      opacity: 0.6,
    }}>
      {cells}
    </div>
  );
}

/* ── QR Code Tool ── */

function QrCodeTool({ t }) {
  var [text, setText] = useState("");
  var [qrType, setQrType] = useState("url");
  var [size, setSize] = useState("256");
  var [ecLevel, setEcLevel] = useState("M");
  var [fgColor, setFgColor] = useState("#E8431A");
  var [bgColor, setBgColor] = useState("#FFFFFF");
  var [bgMode, setBgMode] = useState("light");
  var [bgPickerOpen, setBgPickerOpen] = useState(false);
  var bgPopRef = useRef(null);
  useEffect(function () {
    if (!bgPickerOpen) return;
    function onDown(e) { if (bgPopRef.current && !bgPopRef.current.contains(e.target)) setBgPickerOpen(false); }
    document.addEventListener("mousedown", onDown);
    return function () { document.removeEventListener("mousedown", onDown); };
  }, [bgPickerOpen]);
  var [format, setFormat] = useState("png");
  var [formatOpen, setFormatOpen] = useState(false);
  var formatPopRef = useRef(null);
  useEffect(function () {
    if (!formatOpen) return;
    function onDown(e) { if (formatPopRef.current && !formatPopRef.current.contains(e.target)) setFormatOpen(false); }
    document.addEventListener("mousedown", onDown);
    return function () { document.removeEventListener("mousedown", onDown); };
  }, [formatOpen]);
  var [history, setHistory] = useState([]);
  var [historyFilter, setHistoryFilter] = useState("all");
  var [historySearch, setHistorySearch] = useState("");
  var [wifiPassword, setWifiPassword] = useState("");
  var [showPassword, setShowPassword] = useState(false);
  var [phoneCountry, setPhoneCountry] = useState("+32");
  var [phoneOpen, setPhoneOpen] = useState(false);
  var phonePopRef = useRef(null);
  useEffect(function () {
    if (!phoneOpen) return;
    function onDown(e) { if (phonePopRef.current && !phonePopRef.current.contains(e.target)) setPhoneOpen(false); }
    document.addEventListener("mousedown", onDown);
    return function () { document.removeEventListener("mousedown", onDown); };
  }, [phoneOpen]);
  var canvasRef = useRef(null);
  var svgRef = useRef(null);

  var activeType = QR_TYPES[0];
  QR_TYPES.forEach(function (qt) { if (qt.value === qrType) activeType = qt; });

  /* Build the encoded value based on type */
  function buildQrValue() {
    var raw = text.trim();
    if (!raw) return "";
    if (qrType === "phone") {
      return "tel:" + phoneCountry + raw.replace(/\s/g, "");
    }
    if (qrType === "wifi") {
      return "WIFI:S:" + raw + ";T:WPA;P:" + wifiPassword + ";;";
    }
    if (qrType === "vcard") {
      return "BEGIN:VCARD\nVERSION:3.0\nFN:" + raw + "\nEND:VCARD";
    }
    if (qrType === "url") {
      return "https://" + raw.replace(/^https?:\/\//, "");
    }
    if (activeType.prefix && raw.indexOf(activeType.prefix) !== 0) {
      return activeType.prefix + raw;
    }
    return raw;
  }

  /* Validation */
  var validationError = null;
  var raw = text.trim();
  if (raw.length > 0) {
    if (qrType === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
      validationError = t.qr_err_email || "Adresse email invalide.";
    }
    if (qrType === "url" && !/^[a-zA-Z0-9][\w.-]*\.[a-zA-Z]{2,}/.test(raw.replace(/^https?:\/\//, ""))) {
      validationError = t.qr_err_url || "Adresse web invalide.";
    }
    if (qrType === "phone" && !/^\d[\d\s]{5,}$/.test(raw)) {
      validationError = t.qr_err_phone || "Numéro de téléphone invalide.";
    }
  }

  var qrValue = buildQrValue();
  var displayText = qrValue || "https://forecrest.app";
  var canDownload = text.trim().length > 0 && !validationError;

  /* Type change handler — reset text */
  function handleTypeChange(val) {
    setQrType(val);
    setText("");
    setWifiPassword("");
  }

  /* Add to history */
  function addToHistory(fmt) {
    var entry = {
      id: Date.now(),
      text: text.trim().length > 40 ? text.trim().substring(0, 40) + "..." : text.trim(),
      fullText: qrValue,
      type: qrType,
      format: fmt.toUpperCase(),
      timestamp: new Date().toLocaleTimeString(),
      fgColor: fgColor,
      bgColor: bgColor,
      size: parseInt(size, 10),
    };
    setHistory(function (prev) { return [entry].concat(prev).slice(0, 5); });
  }

  /* Download handlers */
  var handleDownload = useCallback(function () {
    if (!canDownload) return;

    if (format === "svg") {
      /* SVG download */
      var svgEl = svgRef.current;
      if (!svgEl) return;
      var svgNode = svgEl.querySelector ? svgEl.querySelector("svg") : svgEl;
      if (!svgNode) return;
      var serializer = new XMLSerializer();
      var svgData = serializer.serializeToString(svgNode);
      var blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.download = "qrcode.svg";
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      addToHistory("svg");
      return;
    }

    /* PNG / JPEG download via canvas */
    var wrapper = canvasRef.current;
    if (!wrapper) return;
    var canvas = wrapper.querySelector("canvas");
    if (!canvas) return;
    var mime = format === "jpeg" ? "image/jpeg" : "image/png";
    var quality = format === "jpeg" ? 0.92 : undefined;
    var ext = format === "jpeg" ? "jpg" : "png";
    var dataUrl = quality !== undefined ? canvas.toDataURL(mime, quality) : canvas.toDataURL(mime);
    var a = document.createElement("a");
    a.download = "qrcode." + ext;
    a.href = dataUrl;
    a.click();
    addToHistory(format);
  }, [format, qrValue, canDownload, fgColor, bgColor]);


  return (
    <>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-4)", alignItems: "stretch" }}>
      {/* ── Left: Configuration ── */}
      <div style={CARD}>
        <h3 style={SECTION_LABEL}>{t.qr_config || "Configuration"}</h3>

        {/* QR Type */}
        <div>
          <div style={FIELD_LABEL}>{t.qr_type || "Type"}</div>
          <SelectDropdown
            value={qrType}
            onChange={handleTypeChange}
            options={QR_TYPES.map(function (qt) { return { value: qt.value, label: qt.label }; })}
          />
        </div>

        {/* Content input — phone has country picker, others use FormField */}
        {qrType === "phone" ? (
          <div>
            <div style={FIELD_LABEL}>{t.qr_value || "Contenu"}</div>
            <div style={{ display: "flex" }}>
              {(function () {
                var COUNTRIES = [
                  { code: "+32", flag: "🇧🇪", label: "BE +32" },
                  { code: "+33", flag: "🇫🇷", label: "FR +33" },
                  { code: "+31", flag: "🇳🇱", label: "NL +31" },
                  { code: "+49", flag: "🇩🇪", label: "DE +49" },
                  { code: "+44", flag: "🇬🇧", label: "GB +44" },
                  { code: "+352", flag: "🇱🇺", label: "LU +352" },
                  { code: "+1", flag: "🇺🇸", label: "US +1" },
                  { code: "+41", flag: "🇨🇭", label: "CH +41" },
                ];
                var current = COUNTRIES[0];
                COUNTRIES.forEach(function (c) { if (c.code === phoneCountry) current = c; });
                return (
                  <div style={{ position: "relative" }}>
                    <button type="button" onClick={function () { setPhoneOpen(function (v) { return !v; }); }}
                      style={{
                        height: 40, padding: "0 10px", fontSize: 13, fontWeight: 600,
                        border: "1px solid " + (validationError ? "var(--color-error)" : "var(--border)"),
                        borderRight: "none", borderRadius: "var(--r-md) 0 0 var(--r-md)",
                        background: "var(--bg-accordion)", color: "var(--text-primary)",
                        fontFamily: "inherit", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                      <span>{current.flag}</span>
                      <span>{current.code}</span>
                      <CaretDown size={10} color="var(--text-faint)" />
                    </button>
                    {phoneOpen ? (
                      <div ref={phonePopRef} style={{
                        position: "absolute", top: 44, left: 0, zIndex: 50,
                        background: "var(--bg-card)", border: "1px solid var(--border)",
                        borderRadius: "var(--r-lg)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                        padding: 4, minWidth: 120,
                      }}>
                        {COUNTRIES.map(function (c) {
                          var isActive = phoneCountry === c.code;
                          return (
                            <button key={c.code} type="button"
                              onClick={function () { setPhoneCountry(c.code); setPhoneOpen(false); }}
                              style={{
                                display: "flex", alignItems: "center", gap: 8, width: "100%",
                                padding: "7px 10px", border: "none", borderRadius: "var(--r-md)",
                                background: isActive ? "var(--brand-bg)" : "transparent",
                                color: isActive ? "var(--brand)" : "var(--text-secondary)",
                                fontSize: 13, fontWeight: isActive ? 600 : 400,
                                cursor: "pointer", fontFamily: "inherit",
                              }}
                              onMouseEnter={function (e) { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
                              onMouseLeave={function (e) { e.currentTarget.style.background = isActive ? "var(--brand-bg)" : "transparent"; }}
                            >
                              <span>{c.flag}</span>
                              <span>{c.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })()}
              <input type="tel" value={text} onChange={function (e) { setText(e.target.value); }}
                placeholder={activeType.placeholder}
                style={Object.assign({}, INPUT_STYLE, {
                  borderRadius: "0 var(--r-md) var(--r-md) 0",
                  borderColor: validationError ? "var(--color-error)" : "var(--border)",
                })}
              />
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: validationError ? "var(--color-error)" : "var(--text-faint)", lineHeight: 1.4 }}>
              {validationError || activeType.hint}
            </div>
          </div>
        ) : (
          <FormField
            label={t.qr_value || "Contenu"}
            icon={activeType.icon}
            leading={activeType.leading}
            hint={validationError || activeType.hint}
            error={validationError}
          >
            {function (props) {
              return (
                <input
                  type={qrType === "email" ? "email" : "text"}
                  value={text}
                  onChange={function (e) { setText(e.target.value); }}
                  placeholder={activeType.placeholder}
                  style={props.style}
                />
              );
            }}
          </FormField>
        )}

        {/* WiFi password field */}
        {qrType === "wifi" ? (
          <div>
            <div style={FIELD_LABEL}>{t.qr_wifi_password || "Mot de passe WiFi"}</div>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 12, top: 0, bottom: 0, display: "flex", alignItems: "center", pointerEvents: "none" }}>
                <Lock size={16} weight="regular" color="var(--text-muted)" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={wifiPassword}
                onChange={function (e) { setWifiPassword(e.target.value); }}
                placeholder="••••••••"
                style={Object.assign({}, INPUT_STYLE, { paddingLeft: 36, paddingRight: 40 })}
              />
              <button type="button" onClick={function () { setShowPassword(function (v) { return !v; }); }}
                style={{ position: "absolute", right: 8, top: 0, bottom: 0, display: "flex", alignItems: "center", border: "none", background: "none", cursor: "pointer", padding: 4, color: "var(--text-muted)" }}>
                {showPassword ? <EyeSlash size={16} weight="regular" /> : <Eye size={16} weight="regular" />}
              </button>
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-faint)", lineHeight: 1.4 }}>
              {t.qr_wifi_hint || "Laissez vide si le réseau est ouvert."}
            </div>
          </div>
        ) : null}

        {/* QR color palette */}
        <QrColorPalette value={fgColor} onChange={setFgColor} label={t.qr_fg_color || "Couleur du QR"} />

      </div>

      {/* ── Right: Preview + Download ── */}
      <div style={CARD}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={SECTION_LABEL}>{t.qr_preview || "Aperçu"}</h3>
          {/* Background picker — 36x36 color button with popover */}
          <div style={{ position: "relative" }}>
            <button type="button" onClick={function () { setBgPickerOpen(function (v) { return !v; }); }}
              style={{
                width: 36, height: 36, borderRadius: "var(--r-md)", cursor: "pointer",
                border: "1px solid var(--border)", background: bgColor,
                boxShadow: "inset 0 0 0 2px var(--bg-card), inset 0 0 0 3px var(--border-light)",
                transition: "box-shadow 0.12s",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              title={t.qr_bg_color || "Couleur de fond"}
            >
              <PaintBucket size={16} weight="duotone" color={(function () {
                /* Simple luminance check for contrast */
                var hex = bgColor.replace("#", "");
                if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
                var r = parseInt(hex.substring(0, 2), 16);
                var g = parseInt(hex.substring(2, 4), 16);
                var b = parseInt(hex.substring(4, 6), 16);
                var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                return lum > 0.55 ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.7)";
              })()} />
            </button>
            {bgPickerOpen ? (
              <div ref={bgPopRef} style={{
                position: "absolute", top: 42, right: 0, zIndex: 50,
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)", boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                padding: 12, width: 212,
              }}>
                {/* Light / Dark toggle */}
                <div style={{ display: "flex", gap: 0, marginBottom: 10 }}>
                  {[
                    { id: "light", icon: Sun, l: t.qr_bg_light || "Clair", color: "#FFFFFF" },
                    { id: "dark", icon: Moon, l: t.qr_bg_dark || "Sombre", color: "#0E0E0D" },
                  ].map(function (o) {
                    var active = bgMode === o.id;
                    var BIcon = o.icon;
                    return (
                      <button key={o.id} type="button"
                        onClick={function () { setBgMode(o.id); setBgColor(o.color); }}
                        style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                          height: 32, fontSize: 12, fontWeight: active ? 600 : 400,
                          border: "1px solid " + (active ? "var(--brand)" : "var(--border)"),
                          background: active ? "var(--brand-bg)" : "transparent",
                          color: active ? "var(--brand)" : "var(--text-muted)",
                          cursor: "pointer", fontFamily: "inherit",
                          borderRadius: o.id === "light" ? "var(--r-md) 0 0 var(--r-md)" : "0 var(--r-md) var(--r-md) 0",
                          marginLeft: o.id === "dark" ? -1 : 0,
                        }}>
                        <BIcon size={13} weight={active ? "fill" : "regular"} />
                        {o.l}
                      </button>
                    );
                  })}
                </div>
                {/* Color picker */}
                <HexColorPicker color={bgColor} onChange={function (c) { setBgColor(c); setBgMode("custom"); }} style={{ width: "100%", height: 140 }} />
              </div>
            ) : null}
          </div>
        </div>

        {/* Preview area */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--sp-5)",
          borderRadius: "var(--r-md)",
          border: "1px solid var(--border)",
          background: bgColor,
          minHeight: 200,
        }}>
          {canDownload ? (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--sp-2)",
            }}>
              {/* Hidden canvas for PNG/JPEG */}
              <div ref={canvasRef} style={{ position: "absolute", left: -9999, top: -9999 }}>
                <QRCodeCanvas
                  value={displayText}
                  size={parseInt(size, 10)}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  level={ecLevel}
                />
              </div>
              {/* Visible SVG preview */}
              <div ref={svgRef} style={{
                background: bgColor,
                borderRadius: "var(--r-sm)",
                padding: 8,
                lineHeight: 0,
              }}>
                <QRCodeSVG
                  value={displayText}
                  size={size === "256" ? 140 : size === "512" ? 200 : 280}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  level={ecLevel}
                  style={{ display: "block", maxWidth: "100%", height: "auto", transition: "width 0.2s, height 0.2s" }}
                />
              </div>
            </div>
          ) : (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--sp-3)",
            }}>
              <SkeletonQR />
              <span style={{
                fontSize: 12,
                color: "var(--text-faint)",
                fontWeight: 500,
              }}>
                {t.qr_empty || "Entrez un contenu pour générer le QR code"}
              </span>
            </div>
          )}
        </div>

        {/* Size bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            {SIZE_OPTIONS.map(function (opt) {
              var isActive = size === opt.value;
              return (
                <button key={opt.value} type="button" onClick={function () { setSize(opt.value); }}
                  style={{ border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, fontSize: 11, fontWeight: isActive ? 700 : 400, color: isActive ? "var(--brand)" : "var(--text-faint)" }}>
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div style={{ position: "relative", height: 20, display: "flex", alignItems: "center", cursor: "pointer" }}
            onClick={function (e) {
              var rect = e.currentTarget.getBoundingClientRect();
              var pct = (e.clientX - rect.left) / rect.width;
              var idx = Math.round(pct * (SIZE_OPTIONS.length - 1));
              idx = Math.max(0, Math.min(idx, SIZE_OPTIONS.length - 1));
              setSize(SIZE_OPTIONS[idx].value);
            }}
            onMouseDown={function (e) {
              e.preventDefault();
              var bar = e.currentTarget;
              function onMove(ev) {
                var rect = bar.getBoundingClientRect();
                var pct = (ev.clientX - rect.left) / rect.width;
                var idx = Math.round(pct * (SIZE_OPTIONS.length - 1));
                idx = Math.max(0, Math.min(idx, SIZE_OPTIONS.length - 1));
                setSize(SIZE_OPTIONS[idx].value);
              }
              function onUp() {
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
              }
              document.addEventListener("mousemove", onMove);
              document.addEventListener("mouseup", onUp);
            }}
          >
            <div style={{ position: "absolute", left: 0, right: 0, display: "flex", alignItems: "center", height: 4 }}>
              {SIZE_OPTIONS.map(function (opt, i) {
                var idx = SIZE_OPTIONS.findIndex(function (o) { return o.value === size; });
                var filled = i <= idx;
                var isLast = i === SIZE_OPTIONS.length - 1;
                return (
                  <div key={opt.value} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: filled ? "var(--brand)" : "var(--border)", transition: "background 0.15s" }} />
                    {!isLast ? <div style={{ width: 2, height: 12, background: "var(--border-strong)", flexShrink: 0, borderRadius: 1 }} /> : null}
                  </div>
                );
              })}
            </div>
            <div style={{
              position: "absolute",
              left: "calc(" + (SIZE_OPTIONS.findIndex(function (o) { return o.value === size; }) / Math.max(SIZE_OPTIONS.length - 1, 1) * 100) + "% - 8px)",
              width: 16, height: 16, borderRadius: "50%",
              background: "var(--brand)", border: "2px solid var(--bg-card)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
              cursor: "grab", transition: "left 0.15s ease",
              zIndex: 1,
            }} />
          </div>
        </div>

        {/* Download buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-2)" }}>
          <Button
            color="primary"
            size="lg"
            onClick={function () { setFormat("png"); handleDownload(); }}
            isDisabled={!canDownload}
            iconLeading={<DownloadSimple size={16} weight="bold" />}
            sx={{ width: "100%" }}
          >
            {t.qr_download || "Télécharger PNG"}
          </Button>
          <div style={{ position: "relative" }}>
            <Button
              color="tertiary"
              size="lg"
              onClick={function () { setFormatOpen(function (v) { return !v; }); }}
              isDisabled={!canDownload}
              iconTrailing={<CaretDown size={14} />}
              sx={{ width: "100%" }}
            >
              {t.qr_more_formats || "Plus de formats"}
            </Button>
            {formatOpen ? (
              <div ref={formatPopRef} style={{
                position: "absolute", bottom: "calc(100% + 4px)", right: 0, zIndex: 50,
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                padding: 4, minWidth: 140,
              }}>
                {[
                  { value: "png", label: "PNG" },
                  { value: "jpeg", label: "JPEG" },
                  { value: "svg", label: "SVG" },
                ].map(function (opt) {
                  return (
                    <button key={opt.value} type="button"
                      onClick={function () { setFormat(opt.value); setFormatOpen(false); setTimeout(function () { handleDownload(); }, 50); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, width: "100%",
                        padding: "8px 12px", border: "none", borderRadius: "var(--r-md)",
                        background: "transparent", cursor: "pointer", fontFamily: "inherit",
                        fontSize: 13, color: "var(--text-secondary)",
                      }}
                      onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg-hover)"; }}
                      onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; }}
                    >
                      <DownloadSimple size={14} color="var(--text-muted)" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

      </div>
    </div>

    {/* History DataTable below cards */}
    <div style={{ marginTop: "var(--gap-lg)" }}>
      <DataTable
        data={(function () {
          var list = history;
          if (historyFilter !== "all") list = list.filter(function (e) { return e.type === historyFilter; });
          if (historySearch.trim()) {
            var q = historySearch.trim().toLowerCase();
            list = list.filter(function (e) { return (e.text || "").toLowerCase().indexOf(q) !== -1; });
          }
          return list;
        })()}
        columns={[
          {
            id: "preview", header: "", enableSorting: false,
            meta: { align: "center", compactPadding: true, width: 1 },
            cell: function (info) {
              var e = info.row.original;
              return (
                <div style={{ width: 32, height: 32, borderRadius: "var(--r-sm)", overflow: "hidden", background: e.bgColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <QRCodeSVG value={e.fullText} size={28} fgColor={e.fgColor} bgColor={e.bgColor} level="L" />
                </div>
              );
            },
          },
          {
            id: "text", accessorKey: "text",
            header: t.qr_col_content || "Contenu",
            enableSorting: true, meta: { align: "left", grow: true, minWidth: 160 },
            cell: function (info) { return info.getValue() || "—"; },
          },
          {
            id: "type", accessorKey: "type",
            header: t.qr_col_type || "Catégorie",
            enableSorting: true, meta: { align: "left" },
            cell: function (info) {
              var v = info.getValue();
              var found = null;
              QR_TYPES.forEach(function (qt) { if (qt.value === v) found = qt; });
              return found ? <Badge color="gray" size="sm">{found.label}</Badge> : v;
            },
          },
          {
            id: "format", accessorKey: "format",
            header: t.qr_col_format || "Format",
            enableSorting: true, meta: { align: "center" },
            cell: function (info) { return <Badge color="brand" size="sm">{info.getValue()}</Badge>; },
          },
          {
            id: "timestamp", accessorKey: "timestamp",
            header: t.qr_col_time || "Heure",
            enableSorting: false, meta: { align: "right" },
          },
          {
            id: "actions", header: "", enableSorting: false,
            meta: { align: "center", compactPadding: true, width: 1 },
            cell: function (info) {
              var e = info.row.original;
              return (
                <ActionBtn icon={<DownloadSimple size={14} />} title={t.qr_redownload || "Retélécharger"} onClick={function () {
                  setText(e.fullText.replace(/^mailto:|^tel:|^https:\/\//, ""));
                  setFgColor(e.fgColor);
                  setBgColor(e.bgColor);
                  setSize(String(e.size || 256));
                  setTimeout(function () {
                    var btn = document.querySelector("[data-qr-download]");
                    if (btn) btn.click();
                  }, 100);
                }} />
              );
            },
          },
        ]}
        toolbar={
          <>
            <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
              <SearchInput value={historySearch} onChange={setHistorySearch} placeholder={t.qr_search || "Rechercher..."} />
              <FilterDropdown value={historyFilter} onChange={setHistoryFilter} options={[
                { value: "all", label: t.qr_filter_all || "Toutes les catégories" },
              ].concat(QR_TYPES.map(function (qt) { return { value: qt.value, label: qt.label }; }))} />
            </div>
            <div />
          </>
        }
        emptyState={
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-3)", padding: "var(--sp-6)" }}>
            <QrCode size={24} weight="duotone" color="var(--text-muted)" />
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t.qr_empty || "Aucun QR code généré"}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{t.qr_empty_hint || "Téléchargez un QR code pour le voir ici."}</div>
          </div>
        }
        getRowId={function (row) { return String(row.id); }}
        emptyMinHeight={160}
      />
    </div>
    </>
  );
}

/* ── Domain Checker Tool ── */

function StatusBadge({ status, t }) {
  if (status === "checking") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 11, fontWeight: 600, color: "var(--color-info)",
      }}>
        <CircleNotch size={12} weight="bold" style={{ animation: "spin 0.8s linear infinite" }} />
        {t.domain_checking || "Vérification..."}
      </span>
    );
  }
  if (status === "taken") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 11, fontWeight: 600, color: "var(--color-error)",
      }}>
        <XCircle size={14} weight="fill" />
        {t.domain_taken || "Déjà pris"}
      </span>
    );
  }
  if (status === "available") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 11, fontWeight: 600, color: "var(--color-success)",
      }}>
        <CheckCircle size={14} weight="fill" />
        {t.domain_available || "Potentiellement disponible"}
      </span>
    );
  }
  if (status === "error") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 11, fontWeight: 600, color: "var(--color-warning)",
      }}>
        {t.domain_error || "Erreur de vérification"}
      </span>
    );
  }
  return null;
}

function DomainCheckerTool({ t }) {
  var [domain, setDomain] = useState("");
  var [results, setResults] = useState({});
  var [loading, setLoading] = useState(false);

  function checkDomain(fullDomain) {
    setResults(function (prev) {
      var next = {};
      Object.keys(prev).forEach(function (k) { next[k] = prev[k]; });
      next[fullDomain] = "checking";
      return next;
    });

    fetch("https://dns.google/resolve?name=" + encodeURIComponent(fullDomain) + "&type=A")
      .then(function (res) { return res.json(); })
      .then(function (data) {
        // Status 3 = NXDOMAIN (domain not found)
        var status = data.Status === 3 ? "available" : "taken";
        setResults(function (prev) {
          var next = {};
          Object.keys(prev).forEach(function (k) { next[k] = prev[k]; });
          next[fullDomain] = status;
          return next;
        });
      })
      .catch(function () {
        setResults(function (prev) {
          var next = {};
          Object.keys(prev).forEach(function (k) { next[k] = prev[k]; });
          next[fullDomain] = "error";
          return next;
        });
      });
  }

  function handleCheck() {
    var name = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\s/g, "");
    if (!name) return;

    // Strip TLD if user typed one
    var base = name.replace(/\.[a-z]+$/i, "");
    setLoading(true);

    TLDS.forEach(function (tld) {
      checkDomain(base + tld);
    });

    // Clear loading flag after a short delay (individual statuses track per-domain)
    setTimeout(function () { setLoading(false); }, 300);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleCheck();
  }

  var name = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\s/g, "").replace(/\.[a-z]+$/i, "");

  return (
    <div style={CARD}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
        <Globe size={16} weight="bold" color="var(--text-muted)" />
        <h3 style={SECTION_LABEL}>{t.domain_title || "Vérificateur de nom de domaine"}</h3>
      </div>

      {/* Domain input */}
      <div>
        <div style={FIELD_LABEL}>{t.domain_title ? "Nom de domaine" : "Domain name"}</div>
        <div style={{ display: "flex", gap: "var(--sp-2)" }}>
          <input
            type="text"
            value={domain}
            onChange={function (e) { setDomain(e.target.value); }}
            onKeyDown={handleKeyDown}
            placeholder={t.domain_placeholder || "monentreprise"}
            style={Object.assign({}, INPUT_STYLE, { flex: 1 })}
          />
          <Button
            color="primary"
            size="md"
            onClick={handleCheck}
            isDisabled={!domain.trim()}
            isLoading={loading}
            iconLeading={<MagnifyingGlass size={16} weight="bold" />}
          >
            {t.domain_check || "Vérifier"}
          </Button>
        </div>
      </div>

      {/* TLD Results */}
      {name ? (
        <div style={{
          display: "flex", flexDirection: "column", gap: 0,
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md)",
          overflow: "hidden",
        }}>
          {TLDS.map(function (tld, i) {
            var full = name + tld;
            var status = results[full];
            return (
              <div
                key={tld}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--sp-2) var(--sp-3)",
                  background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg-accordion)",
                  borderBottom: i < TLDS.length - 1 ? "1px solid var(--border-light)" : "none",
                }}
              >
                <span style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}>
                  {full}
                </span>
                <StatusBadge status={status} t={t} />
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Hint */}
      <p style={{
        fontSize: 11,
        color: "var(--text-faint)",
        margin: 0,
        lineHeight: 1.5,
      }}>
        {t.domain_hint || "Vérification DNS uniquement. Un domaine sans enregistrement DNS peut tout de même être réservé. Confirmez sur un registrar."}
      </p>
    </div>
  );
}

/* ── Main Page ── */

export default function ToolsPage({ activeTab }) {
  var t = useT().tools || {};

  if (activeTab === "tool_qr") {
    return (
      <PageLayout
        title={t.qr_title || "Générateur de QR Code"}
        subtitle={t.qr_sub || "Créez un QR code personnalisé en quelques secondes."}
        icon={QrCode}
      >
        <QrCodeTool t={t} />
      </PageLayout>
    );
  }

  if (activeTab === "tool_domain") {
    return (
      <PageLayout
        title={t.domain_title || "Vérificateur de nom de domaine"}
        subtitle={t.domain_sub || "Vérifiez la disponibilité d'un nom de domaine."}
        icon={Globe}
      >
        <div style={{ maxWidth: 640 }}>
          <DomainCheckerTool t={t} />
        </div>
      </PageLayout>
    );
  }

  return null;
}
