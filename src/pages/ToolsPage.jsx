import { useState, useRef, useEffect } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { HexColorPicker } from "react-colorful";
import {
  DownloadSimple, MagnifyingGlass, Globe,
  CheckCircle, XCircle, CircleNotch, QrCode, CaretDown,
  EnvelopeSimple, Phone, WifiHigh, Lock, TextT, AddressBook, LinkSimple, WarningCircle, Eye, EyeSlash,
  Copy, Image, X, ChatText, MapPin, CalendarPlus,
  ArrowsClockwise, BookmarkSimple, Trash, ArrowSquareOut, Star,
} from "@phosphor-icons/react";
import { createPortal } from "react-dom";
import { PageLayout, Button, DataTable, Badge, SearchInput, FilterDropdown, ActionBtn, InfoTip, KpiCard, ButtonUtility } from "../components";
import { useT, useLang, useTheme } from "../context";

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

/* ── Domain TLD categories ── */

var TLD_CATEGORIES = [
  {
    id: "popular",
    label: { fr: "Populaires", en: "Popular" },
    tlds: [".be", ".com", ".eu", ".net", ".org"],
  },
  {
    id: "tech",
    label: { fr: "Tech & Startup", en: "Tech & Startup" },
    tlds: [".io", ".app", ".dev", ".tech", ".co"],
  },
  {
    id: "business",
    label: { fr: "Business", en: "Business" },
    tlds: [".biz", ".pro", ".company", ".store", ".shop"],
  },
];

/* Indicative annual prices (EUR) — avg across major registrars (OVH, Gandi, Namecheap) */
var TLD_PRICES = {
  ".be": 7, ".com": 10, ".eu": 7, ".net": 12, ".org": 11,
  ".io": 35, ".app": 14, ".dev": 12, ".tech": 5, ".co": 25,
  ".biz": 15, ".pro": 12, ".company": 10, ".store": 18, ".shop": 12,
};

/* Registrar links for "buy" button */
var TLD_REGISTRAR = {
  ".be": "https://www.ovh.com/fr/domaines/",
  ".com": "https://www.ovh.com/fr/domaines/",
  ".eu": "https://www.ovh.com/fr/domaines/",
};
var DEFAULT_REGISTRAR = "https://www.ovh.com/fr/domaines/";

var ALL_TLDS = [];
TLD_CATEGORIES.forEach(function (cat) {
  cat.tlds.forEach(function (tld) { ALL_TLDS.push(tld); });
});

var WATCHLIST_KEY = "fc_domain_watchlist";
var HISTORY_KEY = "fc_domain_search_history";

function loadWatchlist() {
  try { return JSON.parse(localStorage.getItem(WATCHLIST_KEY)) || []; }
  catch (e) { return []; }
}

function loadSearchHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch (e) { return []; }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ── Shared domain helpers ── */

function parseDomainBase(domain) {
  return domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\s/g, "").replace(/\.[a-z]+$/i, "");
}

function validateDomainName(name, lk) {
  if (!name) return "";
  if (/[^a-z0-9\-]/i.test(name)) {
    return lk === "fr"
      ? "Un nom de domaine ne peut contenir que des lettres (a-z), chiffres (0-9) et tirets (-)."
      : "A domain name can only contain letters (a-z), digits (0-9) and hyphens (-).";
  }
  if (name.length < 2) return lk === "fr" ? "Minimum 2 caract\u00e8res." : "Minimum 2 characters.";
  if (name.length > 63) return lk === "fr" ? "Maximum 63 caract\u00e8res." : "Maximum 63 characters.";
  if (/^-|-$/.test(name)) return lk === "fr" ? "Un domaine ne peut pas commencer ou finir par un tiret." : "A domain cannot start or end with a hyphen.";
  return "";
}

function findCategory(tld) {
  var found = "";
  TLD_CATEGORIES.forEach(function (cat) {
    if (cat.tlds.indexOf(tld) !== -1) found = cat.id;
  });
  return found;
}

function getActiveTldsFor(domain, activeCategories) {
  var tlds = [];
  TLD_CATEGORIES.forEach(function (cat) {
    if (activeCategories.indexOf(cat.id) !== -1) {
      cat.tlds.forEach(function (tld) { tlds.push(tld); });
    }
  });
  var list = tlds.length > 0 ? tlds : ALL_TLDS;
  var inputTld = "";
  var dotIdx = domain.lastIndexOf(".");
  if (dotIdx > 0) inputTld = domain.substring(dotIdx).toLowerCase();
  if (inputTld && list.indexOf(inputTld) >= 0) {
    list = [inputTld].concat(list.filter(function (t) { return t !== inputTld; }));
  }
  return list;
}

function checkDomainDNS(fullDomain, setResults) {
  setResults(function (prev) {
    var next = {};
    Object.keys(prev).forEach(function (k) { next[k] = prev[k]; });
    next[fullDomain] = "checking";
    return next;
  });

  fetch("https://dns.google/resolve?name=" + encodeURIComponent(fullDomain) + "&type=A")
    .then(function (res) { return res.json(); })
    .then(function (data) {
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

var PH_DOMAINS = ["forecrest.be", "monentreprise.com", "startup.io", "maboite.eu", "mybusiness.app", "monprojet.dev"];

function timeAgo(ts, lk) {
  var diff = Date.now() - ts;
  var sec = Math.floor(diff / 1000);
  if (sec < 60) return lk === "fr" ? "à l'instant" : "just now";
  var min = Math.floor(sec / 60);
  if (min < 60) return min + (lk === "fr" ? " min" : " min ago");
  var hr = Math.floor(min / 60);
  if (hr < 24) return hr + (lk === "fr" ? " h" : " h ago");
  var d = Math.floor(hr / 24);
  return d + (lk === "fr" ? " j" : " d ago");
}

/* ── Domain name suggestions ── */

function generateSuggestions(name) {
  if (!name || name.length < 2) return [];
  var prefixes = ["get", "try", "my", "go", "use", "hey"];
  var suffixes = ["app", "io", "hq", "lab", "hub", "dev"];
  var suggestions = [];
  prefixes.forEach(function (p) { suggestions.push(p + name); });
  suffixes.forEach(function (s) { suggestions.push(name + s); });
  return suggestions.slice(0, 8);
}

/* ── Domain name quality score ── */

function scoreDomain(name, results) {
  var score = 0;
  var tips = [];
  // Length
  if (name.length <= 8) { score += 2; tips.push({ good: true, text: { fr: "Nom court et m\u00e9morable", en: "Short and memorable name" } }); }
  else if (name.length <= 12) { score += 1; tips.push({ good: true, text: { fr: "Longueur acceptable", en: "Acceptable length" } }); }
  else { tips.push({ good: false, text: { fr: "Nom long \u2014 difficile \u00e0 retenir", en: "Long name \u2014 hard to remember" } }); }
  // No hyphens
  if (name.indexOf("-") === -1) { score += 1; tips.push({ good: true, text: { fr: "Pas de tiret \u2014 plus facile \u00e0 taper", en: "No hyphens \u2014 easier to type" } }); }
  else { tips.push({ good: false, text: { fr: "Les tirets rendent le nom plus difficile \u00e0 communiquer", en: "Hyphens make the name harder to communicate" } }); }
  // No numbers
  if (!/\d/.test(name)) { score += 1; tips.push({ good: true, text: { fr: "Pas de chiffre \u2014 plus professionnel", en: "No numbers \u2014 more professional" } }); }
  else { tips.push({ good: false, text: { fr: "Les chiffres peuvent cr\u00e9er de la confusion", en: "Numbers can cause confusion" } }); }
  // .com available
  if (results && results[name + ".com"] === "available") { score += 1; tips.push({ good: true, text: { fr: ".com disponible \u2014 id\u00e9al pour la cr\u00e9dibilit\u00e9", en: ".com available \u2014 ideal for credibility" } }); }
  else if (results && results[name + ".com"] === "taken") { tips.push({ good: false, text: { fr: ".com d\u00e9j\u00e0 pris \u2014 risque de confusion avec un concurrent", en: ".com already taken \u2014 risk of confusion with a competitor" } }); }
  return { score: Math.min(score, 5), max: 5, tips: tips };
}

/* ── Registrar data for comparison drawer ── */

var REGISTRARS = [
  { name: "OVH", price: { ".be": 7, ".com": 10, ".eu": 7, ".net": 12, ".org": 11, ".io": 35, ".app": 14, ".dev": 12, ".tech": 5, ".co": 25, ".biz": 15, ".pro": 12, ".company": 10, ".store": 18, ".shop": 12 }, url: "https://www.ovh.com/fr/domaines/", color: "#000E9C" },
  { name: "Gandi", price: { ".be": 9, ".com": 14, ".eu": 9, ".net": 15, ".org": 14, ".io": 39, ".app": 16, ".dev": 14, ".tech": 8, ".co": 28 }, url: "https://www.gandi.net/fr/domaines", color: "#87C540" },
  { name: "Namecheap", price: { ".be": 8, ".com": 9, ".eu": 8, ".net": 11, ".org": 10, ".io": 33, ".app": 13, ".dev": 11, ".tech": 4, ".co": 23 }, url: "https://www.namecheap.com/domains/", color: "#DE5833" },
  { name: "Infomaniak", price: { ".be": 8, ".com": 11, ".eu": 8, ".net": 13, ".org": 12, ".io": 36, ".app": 15, ".dev": 13, ".tech": 6, ".co": 26 }, url: "https://www.infomaniak.com/fr/domaines", color: "#0FA4EA" },
];

/* ── Registrar comparison drawer ── */

function RegistrarDrawer({ domain, tld, onClose, lk }) {
  var full = domain + tld;
  var [closing, setClosing] = useState(false);
  var ANIM_MS = 200;
  var drawerRef = useRef(null);

  var sorted = REGISTRARS.slice().sort(function (a, b) {
    return (a.price[tld] || 99) - (b.price[tld] || 99);
  });

  function handleClose() {
    setClosing(true);
    setTimeout(function () { setClosing(false); onClose(); }, ANIM_MS);
  }

  useEffect(function () {
    function onKey(e) { if (e.key === "Escape") handleClose(); }
    window.addEventListener("keydown", onKey);
    return function () { window.removeEventListener("keydown", onKey); };
  }, []);

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed", inset: 0, zIndex: 899,
          background: "rgba(0,0,0,0.08)",
          opacity: closing ? 0 : 1,
          animation: closing ? "none" : "regFadeIn " + ANIM_MS + "ms ease",
          transition: closing ? "opacity " + ANIM_MS + "ms ease" : "none",
        }}
      />
      {/* Drawer */}
      <div
        ref={drawerRef}
        role="complementary"
        aria-label={lk === "fr" ? "Comparaison des registrars" : "Registrar comparison"}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: 420, maxWidth: "95vw",
          zIndex: 900,
          background: "var(--bg-card)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.08)",
          display: "flex", flexDirection: "column",
          transform: closing ? "translateX(100%)" : "translateX(0)",
          animation: closing ? "none" : "regSlideIn " + ANIM_MS + "ms ease",
          transition: closing ? "transform " + ANIM_MS + "ms ease" : "none",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: "var(--sp-3)",
          padding: "var(--sp-4) var(--sp-5)",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {lk === "fr" ? "Acheter ce domaine" : "Buy this domain"}
            </div>
            <div style={{
              fontSize: 16, fontWeight: 700, color: "var(--text-primary)",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              marginTop: 2,
            }}>
              {full}
            </div>
          </div>
          <button
            onClick={handleClose}
            type="button"
            aria-label={lk === "fr" ? "Fermer" : "Close"}
            style={{
              width: 28, height: 28,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid var(--border)", borderRadius: "var(--r-sm)",
              background: "transparent", cursor: "pointer", flexShrink: 0,
            }}
          >
            <X size={12} color="var(--text-muted)" weight="bold" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "var(--sp-4) var(--sp-5)", display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
          {sorted.map(function (reg, idx) {
            var price = reg.price[tld];
            var isCheapest = idx === 0;
            return (
              <div key={reg.name} style={{
                border: isCheapest ? "1.5px solid var(--color-success)" : "1px solid var(--border)",
                borderRadius: "var(--r-lg)",
                padding: "var(--sp-4)",
                background: isCheapest ? "var(--color-success-bg, var(--bg-accordion))" : "var(--bg-card)",
                display: "flex", alignItems: "center", gap: "var(--sp-3)",
                transition: "border-color 0.2s",
              }}>
                {/* Color dot + name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: reg.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{reg.name}</span>
                    {isCheapest ? (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: "var(--color-success)",
                        background: "var(--color-success-bg, var(--bg-accordion))",
                        border: "1px solid var(--color-success)",
                        padding: "2px 8px", borderRadius: "var(--r-full)",
                        textTransform: "uppercase", letterSpacing: "0.03em",
                      }}>
                        {lk === "fr" ? "Le moins cher" : "Cheapest"}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                    {price != null
                      ? ("~" + price + " \u20ac/" + (lk === "fr" ? "an" : "yr"))
                      : (lk === "fr" ? "Prix non disponible" : "Price not available")}
                  </div>
                </div>
                {/* Buy button */}
                <a
                  href={reg.url + "?domain=" + encodeURIComponent(full)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "6px 14px",
                    border: "1px solid var(--border)", borderRadius: "var(--r-md)",
                    background: "var(--bg-accordion)", color: "var(--text-secondary)",
                    fontSize: 12, fontWeight: 600, fontFamily: "inherit", textDecoration: "none",
                    cursor: "pointer", transition: "background 0.12s, color 0.12s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={function (e) { e.currentTarget.style.background = "var(--brand)"; e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "var(--brand)"; }}
                  onMouseLeave={function (e) { e.currentTarget.style.background = "var(--bg-accordion)"; e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <ArrowSquareOut size={14} weight="bold" />
                  {lk === "fr" ? "Visiter" : "Visit"}
                </a>
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: "var(--sp-3) var(--sp-5)",
          borderTop: "1px solid var(--border-light)",
          flexShrink: 0,
        }}>
          <p style={{ fontSize: 11, color: "var(--text-faint)", margin: 0, lineHeight: 1.5 }}>
            {lk === "fr"
              ? "Prix indicatifs \u2014 v\u00e9rifiez les tarifs actuels sur chaque registrar."
              : "Indicative prices \u2014 check current rates on each registrar."}
          </p>
        </div>
      </div>

      <style>{"\
        @keyframes regSlideIn {\
          from { transform: translateX(100%); }\
          to { transform: translateX(0); }\
        }\
        @keyframes regFadeIn {\
          from { opacity: 0; }\
          to { opacity: 1; }\
        }\
      "}</style>
    </>,
    document.body
  );
}

/* ── Export watchlist as CSV ── */

function exportWatchlistCSV(watchlist, lk) {
  var header = lk === "fr"
    ? "Domaine;Extension;Statut;Prix estim\u00e9;Derni\u00e8re v\u00e9rification"
    : "Domain;Extension;Status;Estimated Price;Last Check";
  var rows = watchlist.map(function (w) {
    var price = TLD_PRICES[w.tld] || "";
    var status = w.status === "available" ? (lk === "fr" ? "Disponible" : "Available") : w.status === "taken" ? (lk === "fr" ? "Pris" : "Taken") : w.status;
    var date = w.lastCheck ? new Date(w.lastCheck).toLocaleDateString() : "";
    return w.domain + ";" + w.tld + ";" + status + ";" + (price ? price + "\u20ac" : "") + ";" + date;
  });
  var csv = header + "\n" + rows.join("\n");
  var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.download = "domain-watchlist.csv";
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Skeleton QR (placeholder) ── */

function SkeletonQR() {
  var cells = [];
  var i, j;
  for (i = 0; i < 5; i++) {
    for (j = 0; j < 5; j++) {
      var isCorner = (i < 2 && j < 2) || (i < 2 && j > 2) || (i > 2 && j < 2);
      var isFilled = isCorner || (i + j) % 2 === 0;
      cells.push(
        <div
          key={i + "-" + j}
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            background: isFilled ? "var(--text-faint)" : "var(--border)",
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

function QrCodeTool({ t, lk }) {
  var { dark } = useTheme();

  var [text, setText] = useState("");
  var [qrType, setQrType] = useState("url");
  var [size, setSize] = useState("256");
  var [ecLevel, setEcLevel] = useState("M");
  var [fgColor, setFgColor] = useState("#E8431A");
  var [colorTheme, setColorTheme] = useState("brand");
  var [customColorOpen, setCustomColorOpen] = useState(false);
  var customColorRef = useRef(null);
  var [bgColor, setBgColor] = useState(function () { return dark ? "#0E0E0D" : "#FFFFFF"; });
  var [bgMode, setBgMode] = useState(function () { return dark ? "dark" : "light"; });
  useEffect(function () {
    if (!customColorOpen) return;
    function onDown(e) {
      if (customColorRef.current && customColorRef.current.contains(e.target)) return;
      var popover = document.querySelector("[data-custom-color-popover]");
      if (popover && popover.contains(e.target)) return;
      setCustomColorOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return function () { document.removeEventListener("mousedown", onDown); };
  }, [customColorOpen]);

  /* #1 — Theme-aware background: auto-update when theme changes */
  useEffect(function () {
    if (bgMode === "custom") return;
    setBgColor(dark ? "#0E0E0D" : "#FFFFFF");
    setBgMode(dark ? "dark" : "light");
  }, [dark]);

  var [format, setFormat] = useState("png");
  var [history, setHistory] = useState(function () {
    try {
      var stored = localStorage.getItem("fc_qr_history");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  var [historyFilter, setHistoryFilter] = useState("all");
  var [historySearch, setHistorySearch] = useState("");
  var [wifiPassword, setWifiPassword] = useState("");
  var [wifiSecurity, setWifiSecurity] = useState("WPA");
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

  /* #4 — vCard enriched fields */
  var [vcardEmail, setVcardEmail] = useState("");
  var [vcardPhone, setVcardPhone] = useState("");
  var [vcardOrg, setVcardOrg] = useState("");
  var [vcardTitle, setVcardTitle] = useState("");

  /* SMS fields */
  var [smsMessage, setSmsMessage] = useState("");

  /* Geolocation fields */
  var [geoLat, setGeoLat] = useState("");
  var [geoLng, setGeoLng] = useState("");
  var [geoLabel, setGeoLabel] = useState("");

  /* Calendar event fields */
  var [eventStart, setEventStart] = useState("");
  var [eventEnd, setEventEnd] = useState("");
  var [eventLocation, setEventLocation] = useState("");

  /* #12 — Logo upload — Forecrest F logo as default */
  var FORECREST_LOGO = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#E8431A"/><text x="20" y="28" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="800" fill="#fff">F</text></svg>');
  var [logo, setLogo] = useState(FORECREST_LOGO);
  var logoInputRef = useRef(null);

  /* #7 — Copy feedback */
  var [copyFeedback, setCopyFeedback] = useState(false);

  var canvasRef = useRef(null);
  var svgRef = useRef(null);

  /* #9 — Persist history in localStorage */
  useEffect(function () {
    try {
      localStorage.setItem("fc_qr_history", JSON.stringify(history));
    } catch (e) { /* ignore */ }
  }, [history]);

  /* #2 — Bilingual options */
  var SIZE_OPTIONS = [
    { value: "256", label: lk === "fr" ? "Petit" : "Small" },
    { value: "512", label: lk === "fr" ? "Moyen" : "Medium" },
    { value: "1024", label: lk === "fr" ? "Grand" : "Large" },
  ];

  var EC_OPTIONS = [
    { value: "L", label: lk === "fr" ? "Basique" : "Basic" },
    { value: "M", label: lk === "fr" ? "Standard" : "Standard" },
    { value: "Q", label: lk === "fr" ? "\u00c9lev\u00e9e" : "High" },
    { value: "H", label: lk === "fr" ? "Maximale" : "Maximum" },
  ];

  var FORMAT_OPTIONS = [
    { value: "png", label: "PNG" },
    { value: "jpeg", label: "JPEG" },
    { value: "svg", label: "SVG" },
  ];

  var QR_TYPES = [
    { value: "url", label: "URL", prefix: "", placeholder: lk === "fr" ? "www.monsite.be" : "www.mysite.com", icon: LinkSimple, leading: "https://", hint: lk === "fr" ? "Entrez l\u2019adresse de votre site web." : "Enter your website address." },
    { value: "text", label: lk === "fr" ? "Texte" : "Text", prefix: "", placeholder: lk === "fr" ? "Mon texte libre" : "My free text", icon: TextT, hint: lk === "fr" ? "Texte libre encod\u00e9 dans le QR code." : "Free text encoded in the QR code." },
    { value: "email", label: "Email", prefix: "mailto:", placeholder: "olivia@exemple.be", icon: EnvelopeSimple, hint: lk === "fr" ? "L\u2019application mail s\u2019ouvrira au scan." : "The mail app will open on scan." },
    { value: "phone", label: lk === "fr" ? "T\u00e9l\u00e9phone" : "Phone", prefix: "tel:", placeholder: "470 12 34 56", icon: Phone, hint: lk === "fr" ? "Le t\u00e9l\u00e9phone composera le num\u00e9ro au scan." : "The phone will dial the number on scan." },
    { value: "wifi", label: "WiFi", prefix: "", placeholder: lk === "fr" ? "Nom du r\u00e9seau" : "Network name", icon: WifiHigh, hint: lk === "fr" ? "Le t\u00e9l\u00e9phone se connectera automatiquement au scan." : "The phone will auto-connect on scan." },
    { value: "vcard", label: "vCard", prefix: "", placeholder: lk === "fr" ? "Pr\u00e9nom Nom" : "First Last", icon: AddressBook, hint: lk === "fr" ? "Ajoute un contact directement au carnet d\u2019adresses." : "Adds a contact directly to the address book." },
    { value: "sms", label: "SMS", prefix: "", placeholder: "470 12 34 56", icon: ChatText, hint: lk === "fr" ? "Pré-remplit un SMS avec un numéro et un message." : "Pre-fills an SMS with a number and message." },
    { value: "geo", label: lk === "fr" ? "Localisation" : "Location", prefix: "", placeholder: "50.8503", icon: MapPin, hint: lk === "fr" ? "Ouvre l\u2019application de navigation au scan." : "Opens the navigation app on scan." },
    { value: "event", label: lk === "fr" ? "Événement" : "Event", prefix: "", placeholder: lk === "fr" ? "Nom de l\u2019événement" : "Event name", icon: CalendarPlus, hint: lk === "fr" ? "Ajoute un événement au calendrier du téléphone." : "Adds an event to the phone\u2019s calendar." },
  ];

  var WIFI_SEC_OPTIONS = [
    { value: "WPA2", label: "WPA2" },
    { value: "WPA", label: "WPA" },
    { value: "WEP", label: "WEP" },
    { value: "nopass", label: lk === "fr" ? "Ouvert" : "Open" },
  ];

  var activeType = QR_TYPES[0];
  QR_TYPES.forEach(function (qt) { if (qt.value === qrType) activeType = qt; });

  /* Build the encoded value based on type */
  function buildQrValue() {
    var raw = text.trim();
    if (qrType === "geo") {
      if (!geoLat && !geoLng) return "";
      var geoBase = "geo:" + geoLat + "," + geoLng;
      if (geoLabel.trim()) geoBase += "?q=" + encodeURIComponent(geoLabel.trim());
      return geoBase;
    }
    if (!raw) return "";
    if (qrType === "phone") {
      return "tel:" + phoneCountry + raw.replace(/\s/g, "");
    }
    if (qrType === "sms") {
      return "smsto:" + phoneCountry + raw.replace(/\s/g, "") + ":" + smsMessage;
    }
    if (qrType === "wifi") {
      return "WIFI:S:" + raw + ";T:" + wifiSecurity + ";P:" + wifiPassword + ";;";
    }
    if (qrType === "vcard") {
      return "BEGIN:VCARD\nVERSION:3.0\nFN:" + raw +
        (vcardEmail ? "\nEMAIL:" + vcardEmail : "") +
        (vcardPhone ? "\nTEL:" + vcardPhone : "") +
        (vcardOrg ? "\nORG:" + vcardOrg : "") +
        (vcardTitle ? "\nTITLE:" + vcardTitle : "") +
        "\nEND:VCARD";
    }
    if (qrType === "event") {
      return "BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:" + raw +
        (eventStart ? "\nDTSTART:" + eventStart.replace(/-/g, "") + "T000000" : "") +
        (eventEnd ? "\nDTEND:" + eventEnd.replace(/-/g, "") + "T235959" : "") +
        (eventLocation ? "\nLOCATION:" + eventLocation : "") +
        "\nEND:VEVENT\nEND:VCALENDAR";
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
      validationError = lk === "fr" ? "Adresse email invalide." : "Invalid email address.";
    }
    if (qrType === "url" && !/^[a-zA-Z0-9][\w.-]*\.[a-zA-Z]{2,}/.test(raw.replace(/^https?:\/\//, ""))) {
      validationError = lk === "fr" ? "Adresse web invalide." : "Invalid web address.";
    }
    if (qrType === "phone" && !/^\d[\d\s]{5,}$/.test(raw)) {
      validationError = lk === "fr" ? "Numéro de téléphone invalide." : "Invalid phone number.";
    }
    if (qrType === "sms" && !/^\d[\d\s]{5,}$/.test(raw)) {
      validationError = lk === "fr" ? "Numéro de téléphone invalide." : "Invalid phone number.";
    }
  }
  if (qrType === "geo") {
    var latNum = parseFloat(geoLat);
    var lngNum = parseFloat(geoLng);
    if (geoLat && (isNaN(latNum) || latNum < -90 || latNum > 90)) {
      validationError = lk === "fr" ? "Latitude invalide (−90 à 90)." : "Invalid latitude (−90 to 90).";
    } else if (geoLng && (isNaN(lngNum) || lngNum < -180 || lngNum > 180)) {
      validationError = lk === "fr" ? "Longitude invalide (−180 à 180)." : "Invalid longitude (−180 to 180).";
    }
  }

  var qrValue = buildQrValue();
  var displayText = qrValue || "https://forecrest.app";
  var canDownload = (qrType === "geo" ? (geoLat || geoLng) : text.trim().length > 0) && !validationError;

  /* Character limit indicator */
  var qrMaxChars = { L: 2953, M: 2331, Q: 1663, H: 1273 };
  var currentLength = qrValue.length;
  var maxLength = qrMaxChars[ecLevel] || 2331;
  var pctUsed = maxLength > 0 ? currentLength / maxLength : 0;
  var limitColor = pctUsed > 1 ? "var(--color-error)" : pctUsed > 0.8 ? "var(--color-warning)" : "var(--text-faint)";

  /* imageSettings for logo overlay */
  var imgSettings = logo ? { src: logo, height: 40, width: 40, excavate: true } : undefined;

  /* Type change handler — reset text and extra fields */
  function handleTypeChange(val) {
    setQrType(val);
    setText("");
    setWifiPassword("");
    setWifiSecurity("WPA");
    setVcardEmail("");
    setVcardPhone("");
    setVcardOrg("");
    setVcardTitle("");
    setSmsMessage("");
    setGeoLat("");
    setGeoLng("");
    setGeoLabel("");
    setEventStart("");
    setEventEnd("");
    setEventLocation("");
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

  /* Download handler */
  function doDownload(fmt) {
    if (!canDownload) return;

    if (fmt === "svg") {
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

    var wrapper = canvasRef.current;
    if (!wrapper) return;
    var canvas = wrapper.querySelector("canvas");
    if (!canvas) return;
    var mime = fmt === "jpeg" ? "image/jpeg" : "image/png";
    var quality = fmt === "jpeg" ? 0.92 : undefined;
    var ext = fmt === "jpeg" ? "jpg" : "png";
    var dataUrl = quality !== undefined ? canvas.toDataURL(mime, quality) : canvas.toDataURL(mime);
    var a = document.createElement("a");
    a.download = "qrcode." + ext;
    a.href = dataUrl;
    a.click();
    addToHistory(fmt);
  }

  /* #7 — Copy to clipboard */
  function handleCopy() {
    if (!canDownload) return;

    if (format === "svg") {
      var svgEl = svgRef.current;
      if (!svgEl) return;
      var svgNode = svgEl.querySelector ? svgEl.querySelector("svg") : svgEl;
      if (!svgNode) return;
      var serializer = new XMLSerializer();
      var svgData = serializer.serializeToString(svgNode);
      navigator.clipboard.writeText(svgData).then(function () {
        setCopyFeedback(true);
        setTimeout(function () { setCopyFeedback(false); }, 1500);
      });
      return;
    }

    var wrapper = canvasRef.current;
    if (!wrapper) return;
    var canvas = wrapper.querySelector("canvas");
    if (!canvas) return;
    canvas.toBlob(function (blob) {
      if (!blob) return;
      try {
        navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]).then(function () {
          setCopyFeedback(true);
          setTimeout(function () { setCopyFeedback(false); }, 1500);
        });
      } catch (e) {
        /* fallback: do nothing */
      }
    }, "image/png");
  }

  /* #12 — Logo file handler */
  function handleLogoFile(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      setLogo(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  var COUNTRIES = [
    { code: "+32", flag: "\ud83c\udde7\ud83c\uddea", label: "BE +32" },
    { code: "+33", flag: "\ud83c\uddeb\ud83c\uddf7", label: "FR +33" },
    { code: "+31", flag: "\ud83c\uddf3\ud83c\uddf1", label: "NL +31" },
    { code: "+49", flag: "\ud83c\udde9\ud83c\uddea", label: "DE +49" },
    { code: "+44", flag: "\ud83c\uddec\ud83c\udde7", label: "GB +44" },
    { code: "+352", flag: "\ud83c\uddf1\ud83c\uddfa", label: "LU +352" },
    { code: "+1", flag: "\ud83c\uddfa\ud83c\uddf8", label: "US +1" },
    { code: "+41", flag: "\ud83c\udde8\ud83c\udded", label: "CH +41" },
  ];

  return (
    <>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "var(--sp-4)", alignItems: "stretch" }}>
      {/* ── Left: Configuration ── */}
      <div style={CARD}>
        <h3 style={SECTION_LABEL}>{lk === "fr" ? "Configuration" : "Configuration"}</h3>

        {/* #11 — QR Type as tabs */}
        <div>
          <div style={FIELD_LABEL}>{lk === "fr" ? "Type" : "Type"}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {QR_TYPES.map(function (qt) {
              var isActive = qrType === qt.value;
              var TabIcon = qt.icon;
              return (
                <button key={qt.value} type="button" onClick={function () { handleTypeChange(qt.value); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    padding: "0 10px", height: 32,
                    border: "1px solid " + (isActive ? "var(--brand)" : "var(--border)"),
                    background: isActive ? "var(--brand-bg)" : "transparent",
                    color: isActive ? "var(--brand)" : "var(--text-muted)",
                    fontSize: 11, fontWeight: isActive ? 600 : 400,
                    cursor: "pointer", fontFamily: "inherit",
                    borderRadius: "var(--r-md)",
                    zIndex: isActive ? 1 : 0,
                    transition: "background 0.12s, color 0.12s",
                  }}>
                  <TabIcon size={14} weight={isActive ? "bold" : "regular"} />
                  {qt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content input — phone/sms have country picker, geo has lat/lng, others use FormField */}
        {qrType === "phone" || qrType === "sms" ? (
          <div>
            <div style={FIELD_LABEL}>{lk === "fr" ? (qrType === "sms" ? "Numéro" : "Contenu") : (qrType === "sms" ? "Number" : "Content")}</div>
            <div style={{ display: "flex" }}>
              {(function () {
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
        ) : qrType === "geo" ? (
          <div>
            <div style={FIELD_LABEL}>{lk === "fr" ? "Coordonnées" : "Coordinates"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-2)" }}>
              <FormField label="Latitude" icon={MapPin}>
                {function (props) { return <input type="number" step="0.0001" value={geoLat} onChange={function (e) { setGeoLat(e.target.value); }} placeholder="50.8503" style={props.style} />; }}
              </FormField>
              <FormField label="Longitude" icon={MapPin}>
                {function (props) { return <input type="number" step="0.0001" value={geoLng} onChange={function (e) { setGeoLng(e.target.value); }} placeholder="4.3517" style={props.style} />; }}
              </FormField>
            </div>
            <div style={{ marginTop: "var(--sp-2)" }}>
              <FormField label={lk === "fr" ? "Nom du lieu (optionnel)" : "Place name (optional)"}>
                {function (props) { return <input type="text" value={geoLabel} onChange={function (e) { setGeoLabel(e.target.value); }} placeholder={lk === "fr" ? "ex. Bureau Forecrest" : "e.g. Forecrest Office"} style={props.style} />; }}
              </FormField>
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: validationError ? "var(--color-error)" : "var(--text-faint)", lineHeight: 1.4 }}>
              {validationError || activeType.hint}
            </div>
          </div>
        ) : (
          <FormField
            label={lk === "fr" ? "Contenu" : "Content"}
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

        {/* #4 — vCard enriched fields (2x2 grid) */}
        {qrType === "vcard" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
            <div>
              <div style={FIELD_LABEL}>Email</div>
              <input type="email" value={vcardEmail} onChange={function (e) { setVcardEmail(e.target.value); }}
                placeholder="olivia@exemple.be"
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <div style={FIELD_LABEL}>{lk === "fr" ? "T\u00e9l\u00e9phone" : "Phone"}</div>
              <input type="tel" value={vcardPhone} onChange={function (e) { setVcardPhone(e.target.value); }}
                placeholder="+32 470 12 34 56"
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <div style={FIELD_LABEL}>{lk === "fr" ? "Organisation" : "Organization"}</div>
              <input type="text" value={vcardOrg} onChange={function (e) { setVcardOrg(e.target.value); }}
                placeholder={lk === "fr" ? "Nom de l\u2019entreprise" : "Company name"}
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <div style={FIELD_LABEL}>{lk === "fr" ? "Fonction" : "Title"}</div>
              <input type="text" value={vcardTitle} onChange={function (e) { setVcardTitle(e.target.value); }}
                placeholder={lk === "fr" ? "Poste occup\u00e9" : "Job title"}
                style={INPUT_STYLE}
              />
            </div>
          </div>
        ) : null}

        {/* SMS message textarea */}
        {qrType === "sms" ? (
          <div>
            <div style={FIELD_LABEL}>{lk === "fr" ? "Message" : "Message"}</div>
            <textarea value={smsMessage} onChange={function (e) { setSmsMessage(e.target.value); }}
              placeholder={lk === "fr" ? "Votre message..." : "Your message..."}
              rows={3}
              style={Object.assign({}, INPUT_STYLE, { height: "auto", padding: "var(--sp-2) var(--sp-3)", resize: "vertical" })}
            />
          </div>
        ) : null}

        {/* Calendar event extra fields */}
        {qrType === "event" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-2)" }}>
            <FormField label={lk === "fr" ? "Date de début" : "Start date"}>
              {function (props) { return <input type="date" value={eventStart} onChange={function (e) { setEventStart(e.target.value); }} style={props.style} />; }}
            </FormField>
            <FormField label={lk === "fr" ? "Date de fin" : "End date"}>
              {function (props) { return <input type="date" value={eventEnd} onChange={function (e) { setEventEnd(e.target.value); }} style={props.style} />; }}
            </FormField>
            <div style={{ gridColumn: "span 2" }}>
              <FormField label={lk === "fr" ? "Lieu" : "Location"}>
                {function (props) { return <input type="text" value={eventLocation} onChange={function (e) { setEventLocation(e.target.value); }} placeholder={lk === "fr" ? "ex. Bruxelles" : "e.g. Brussels"} style={props.style} />; }}
              </FormField>
            </div>
          </div>
        ) : null}

        {/* Character limit warning — only when approaching limit */}
        {pctUsed > 0.8 ? (
          <div style={{ fontSize: 11, color: limitColor, marginTop: "var(--sp-1)" }}>
            {pctUsed > 1
              ? (lk === "fr" ? "Contenu trop long — le QR code pourrait ne pas fonctionner." : "Content too long — QR code may not work.")
              : (lk === "fr" ? "Attention : " + currentLength + " / " + maxLength + " caractères utilisés." : "Warning: " + currentLength + " / " + maxLength + " characters used.")}
          </div>
        ) : null}

        {/* #5 — WiFi security selector */}
        {qrType === "wifi" ? (
          <div>
            <div style={FIELD_LABEL}>{lk === "fr" ? "S\u00e9curit\u00e9" : "Security"}</div>
            <div style={{ display: "flex", gap: 0 }}>
              {WIFI_SEC_OPTIONS.map(function (opt, i) {
                var isActive = wifiSecurity === opt.value;
                return (
                  <button key={opt.value} type="button" onClick={function () { setWifiSecurity(opt.value); }}
                    style={{
                      flex: 1, height: 32,
                      border: "1px solid " + (isActive ? "var(--brand)" : "var(--border)"),
                      background: isActive ? "var(--brand-bg)" : "transparent",
                      color: isActive ? "var(--brand)" : "var(--text-muted)",
                      fontSize: 11, fontWeight: isActive ? 600 : 400,
                      cursor: "pointer", fontFamily: "inherit",
                      borderRadius: i === 0 ? "var(--r-md) 0 0 var(--r-md)" : i === WIFI_SEC_OPTIONS.length - 1 ? "0 var(--r-md) var(--r-md) 0" : 0,
                      marginLeft: i > 0 ? -1 : 0,
                      zIndex: isActive ? 1 : 0,
                    }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* WiFi password field — hidden when Open security */}
        {qrType === "wifi" && wifiSecurity !== "nopass" ? (
          <div>
            <div style={FIELD_LABEL}>{lk === "fr" ? "Mot de passe WiFi" : "WiFi password"}</div>
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
              {lk === "fr" ? "Laissez vide si le r\u00e9seau est ouvert." : "Leave empty if the network is open."}
            </div>
          </div>
        ) : null}

        {/* QR color — theme presets + custom popover */}
        <div>
          <div style={FIELD_LABEL}>{lk === "fr" ? "Thème de couleurs" : "Color theme"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {[
              { id: "brand", label: "Forecrest", fg: "#E8431A", bg: dark ? "#0E0E0D" : "#FFFFFF" },
              { id: "classic", label: lk === "fr" ? "Classique" : "Classic", fg: "#0E0E0D", bg: "#FFFFFF" },
              { id: "ocean", label: lk === "fr" ? "Océan" : "Ocean", fg: "#1E40AF", bg: "#EFF6FF" },
              { id: "nature", label: "Nature", fg: "#166534", bg: "#F0FDF4" },
              { id: "sunset", label: lk === "fr" ? "Crépuscule" : "Sunset", fg: "#D97706", bg: "#FFFBEB" },
              { id: "night", label: lk === "fr" ? "Nuit" : "Night", fg: "#E8431A", bg: "#0E0E0D" },
            ].map(function (theme) {
              var isActive = colorTheme === theme.id;
              return (
                <button key={theme.id} type="button" onClick={function () { setFgColor(theme.fg); setBgColor(theme.bg); setBgMode("custom"); setColorTheme(theme.id); setCustomColorOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                    border: "2px solid " + (isActive ? "var(--brand)" : "var(--border-light)"),
                    borderRadius: "var(--r-md)", background: isActive ? "var(--brand-bg)" : "var(--bg-accordion)",
                    cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.12s",
                  }}
                >
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: theme.bg, border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: theme.fg }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: isActive ? 600 : 400, color: isActive ? "var(--brand)" : "var(--text-secondary)" }}>{theme.label}</span>
                </button>
              );
            })}
            {/* Custom color button */}
            <div ref={customColorRef} style={{ gridColumn: "span 2" }}>
              <button type="button" onClick={function () { setColorTheme("custom"); setCustomColorOpen(function (v) { return !v; }); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", width: "100%",
                  border: "2px solid " + (colorTheme === "custom" ? "var(--brand)" : "var(--border-light)"),
                  borderRadius: "var(--r-md)", background: colorTheme === "custom" ? "var(--brand-bg)" : "var(--bg-accordion)",
                  cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.12s",
                }}
              >
                <div style={{ width: 20, height: 20, borderRadius: 4, background: bgColor, border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: fgColor }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: colorTheme === "custom" ? 600 : 400, color: colorTheme === "custom" ? "var(--brand)" : "var(--text-secondary)" }}>{lk === "fr" ? "Personnaliser" : "Customize"}</span>
              </button>
            </div>
          </div>
          {/* Custom color popover — dual fg + bg pickers */}
          {customColorOpen ? (
            <div data-custom-color-popover style={{
              marginTop: "var(--sp-2)", padding: "var(--sp-3)",
              border: "1px solid var(--border)", borderRadius: "var(--r-lg)",
              background: "var(--bg-card)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>{lk === "fr" ? "QR code" : "QR code"}</div>
                  <HexColorPicker color={fgColor} onChange={function (c) { setFgColor(c); setColorTheme("custom"); }} style={{ width: "100%", height: 120 }} />
                  <input type="text" value={fgColor} onChange={function (e) { setFgColor(e.target.value); setColorTheme("custom"); }} maxLength={7}
                    style={Object.assign({}, INPUT_STYLE, { height: 28, fontSize: 11, fontFamily: "ui-monospace, monospace", marginTop: 6 })} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>{lk === "fr" ? "Fond" : "Background"}</div>
                  <HexColorPicker color={bgColor} onChange={function (c) { setBgColor(c); setBgMode("custom"); setColorTheme("custom"); }} style={{ width: "100%", height: 120 }} />
                  <input type="text" value={bgColor} onChange={function (e) { setBgColor(e.target.value); setBgMode("custom"); setColorTheme("custom"); }} maxLength={7}
                    style={Object.assign({}, INPUT_STYLE, { height: 28, fontSize: 11, fontFamily: "ui-monospace, monospace", marginTop: 6 })} />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* #6 — EC level selector */}
        <div>
          <div style={Object.assign({}, FIELD_LABEL, { display: "flex", alignItems: "center", gap: 4 })}>
            {lk === "fr" ? "Correction d\u2019erreur" : "Error correction"}
            <InfoTip tip={lk === "fr" ? "Plus le niveau est élevé, plus le QR code résiste aux dégradations (rayures, taches). Un niveau élevé est recommandé si vous ajoutez un logo au centre." : "Higher levels make the QR code more resistant to damage (scratches, stains). A high level is recommended when adding a center logo."} />
          </div>
          <div style={{ display: "flex", gap: 0 }}>
            {EC_OPTIONS.map(function (opt, i) {
              var isActive = ecLevel === opt.value;
              return (
                <button key={opt.value} type="button" onClick={function () { setEcLevel(opt.value); }}
                  style={{
                    flex: 1, height: 32,
                    border: "1px solid " + (isActive ? "var(--brand)" : "var(--border)"),
                    background: isActive ? "var(--brand-bg)" : "transparent",
                    color: isActive ? "var(--brand)" : "var(--text-muted)",
                    fontSize: 11, fontWeight: isActive ? 600 : 400,
                    cursor: "pointer", fontFamily: "inherit",
                    borderRadius: i === 0 ? "var(--r-md) 0 0 var(--r-md)" : i === EC_OPTIONS.length - 1 ? "0 var(--r-md) var(--r-md) 0" : 0,
                    marginLeft: i > 0 ? -1 : 0,
                    zIndex: isActive ? 1 : 0,
                  }}>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* #12 — Logo upload */}
        <div>
          <div style={FIELD_LABEL}>{lk === "fr" ? "Logo au centre" : "Center logo"}</div>
          <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoFile}
            style={{ display: "none" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
            <div style={{
              width: 40, height: 40, borderRadius: "var(--r-md)",
              border: "1px solid var(--border)", overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "var(--bg-accordion)",
            }}>
              {logo ? <img src={logo} alt="" style={{ width: 36, height: 36, objectFit: "contain" }} /> : null}
            </div>
            <button type="button" onClick={function () { logoInputRef.current && logoInputRef.current.click(); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                height: 36, padding: "0 12px",
                border: "1px dashed var(--border)", borderRadius: "var(--r-md)",
                background: "transparent", color: "var(--text-muted)",
                fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
              }}>
              <Image size={14} weight="regular" />
              {lk === "fr" ? "Changer le logo" : "Change logo"}
            </button>
            {logo && logo !== FORECREST_LOGO ? (
              <button type="button" onClick={function () { setLogo(FORECREST_LOGO); }}
                style={{
                  border: "none", background: "none", cursor: "pointer",
                  fontSize: 12, color: "var(--text-faint)", fontWeight: 500,
                  fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4,
                }}>
                <X size={12} weight="bold" />
                {lk === "fr" ? "Par défaut" : "Default"}
              </button>
            ) : null}
          </div>
        </div>

      </div>

      {/* ── Right: Preview + Download ── */}
      <div style={CARD}>
        <h3 style={SECTION_LABEL}>{lk === "fr" ? "Aper\u00e7u" : "Preview"}</h3>

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
                  imageSettings={imgSettings}
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
                  imageSettings={imgSettings}
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
                color: "var(--text-muted)",
                fontWeight: 500,
              }}>
                {lk === "fr" ? "Entrez un contenu pour g\u00e9n\u00e9rer le QR code" : "Enter content to generate the QR code"}
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

        {/* #10 — Format selector pills */}
        <div>
          <div style={FIELD_LABEL}>{lk === "fr" ? "Format" : "Format"}</div>
          <div style={{ display: "flex", gap: 0 }}>
            {FORMAT_OPTIONS.map(function (opt, i) {
              var isActive = format === opt.value;
              return (
                <button key={opt.value} type="button" onClick={function () { setFormat(opt.value); }}
                  style={{
                    flex: 1, height: 32,
                    border: "1px solid " + (isActive ? "var(--brand)" : "var(--border)"),
                    background: isActive ? "var(--brand-bg)" : "transparent",
                    color: isActive ? "var(--brand)" : "var(--text-muted)",
                    fontSize: 11, fontWeight: isActive ? 600 : 400,
                    cursor: "pointer", fontFamily: "inherit",
                    borderRadius: i === 0 ? "var(--r-md) 0 0 var(--r-md)" : i === FORMAT_OPTIONS.length - 1 ? "0 var(--r-md) var(--r-md) 0" : 0,
                    marginLeft: i > 0 ? -1 : 0,
                    zIndex: isActive ? 1 : 0,
                  }}>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Download + Copy buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-2)" }}>
          <Button
            color="primary"
            size="lg"
            onClick={function () { doDownload(format); }}
            isDisabled={!canDownload}
            iconLeading={<DownloadSimple size={16} weight="bold" />}
            sx={{ width: "100%" }}
            data-qr-download
          >
            {(lk === "fr" ? "T\u00e9l\u00e9charger " : "Download ") + format.toUpperCase()}
          </Button>
          <Button
            color="tertiary"
            size="lg"
            onClick={handleCopy}
            isDisabled={!canDownload}
            iconLeading={<Copy size={16} weight={copyFeedback ? "fill" : "bold"} />}
            sx={{ width: "100%" }}
          >
            {copyFeedback ? (lk === "fr" ? "Copi\u00e9 !" : "Copied!") : (lk === "fr" ? "Copier" : "Copy")}
          </Button>
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
            id: "preview", header: "QR", enableSorting: false,
            meta: { align: "center", compactPadding: true },
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
            header: lk === "fr" ? "Contenu" : "Content",
            enableSorting: true, meta: { align: "left", grow: true, minWidth: 160 },
            cell: function (info) { return info.getValue() || "\u2014"; },
          },
          {
            id: "type", accessorKey: "type",
            header: lk === "fr" ? "Cat\u00e9gorie" : "Category",
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
            header: "Format",
            enableSorting: true, meta: { align: "center" },
            cell: function (info) { return <Badge color="brand" size="sm">{info.getValue()}</Badge>; },
          },
          {
            id: "timestamp", accessorKey: "timestamp",
            header: lk === "fr" ? "Heure" : "Time",
            enableSorting: false, meta: { align: "right" },
          },
          {
            id: "actions", header: "", enableSorting: false,
            meta: { align: "center", compactPadding: true, width: 1 },
            cell: function (info) {
              var e = info.row.original;
              return (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
                  <ActionBtn icon={<DownloadSimple size={14} />} title={lk === "fr" ? "Retélécharger" : "Re-download"} onClick={function () {
                    setText(e.fullText.replace(/^mailto:|^tel:|^https:\/\//, ""));
                    setFgColor(e.fgColor);
                    setBgColor(e.bgColor);
                    setSize(String(e.size || 256));
                    setTimeout(function () {
                      var btn = document.querySelector("[data-qr-download]");
                      if (btn) btn.click();
                    }, 100);
                  }} />
                  <ActionBtn icon={<Trash size={14} />} title={lk === "fr" ? "Supprimer" : "Delete"} variant="danger" onClick={function () {
                    setHistory(function (prev) { return prev.filter(function (h) { return h.id !== e.id; }); });
                  }} />
                </div>
              );
            },
          },
        ]}
        toolbar={
          <>
            <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
              <SearchInput value={historySearch} onChange={setHistorySearch} placeholder={lk === "fr" ? "Rechercher..." : "Search..."} />
              <FilterDropdown value={historyFilter} onChange={setHistoryFilter} options={[
                { value: "all", label: lk === "fr" ? "Toutes les cat\u00e9gories" : "All categories" },
              ].concat(QR_TYPES.map(function (qt) { return { value: qt.value, label: qt.label }; }))} />
            </div>
            <div />
          </>
        }
        emptyState={
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-3)", padding: "var(--sp-6)" }}>
            <QrCode size={24} weight="duotone" color="var(--text-muted)" />
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{lk === "fr" ? "Aucun QR code g\u00e9n\u00e9r\u00e9" : "No QR codes generated"}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{lk === "fr" ? "T\u00e9l\u00e9chargez un QR code pour le voir ici." : "Download a QR code to see it here."}</div>
          </div>
        }
        getRowId={function (row) { return String(row.id); }}
        emptyMinHeight={160}
        selectable
        onDeleteSelected={function (ids) {
          var idSet = {};
          ids.forEach(function (id) { idSet[id] = true; });
          var next = history.filter(function (e) { return !idSet[String(e.id)]; });
          setHistory(next);
        }}
        deleteSelectedLabel={lk === "fr" ? "Supprimer" : "Delete"}
        selectionExtraActions={function (ids) {
          return (
            <button type="button" onClick={function () {
              var idSet = {};
              Object.keys(ids).forEach(function (k) { if (ids[k]) idSet[k] = true; });
              var selected = history.filter(function (e) { return idSet[String(e.id)]; });
              /* Download each selected QR one by one with a delay */
              var idx = 0;
              function downloadNext() {
                if (idx >= selected.length) return;
                var e = selected[idx];
                idx++;
                /* Temporarily set params, render, download, then restore */
                var prevText = text;
                var prevFg = fgColor;
                var prevBg = bgColor;
                var prevSize = size;
                setText(e.fullText.replace(/^mailto:|^tel:|^https:\/\//, ""));
                setFgColor(e.fgColor);
                setBgColor(e.bgColor);
                setSize(String(e.size || 256));
                setTimeout(function () {
                  var canvas = canvasRef.current && canvasRef.current.querySelector("canvas");
                  if (canvas) {
                    var a = document.createElement("a");
                    a.download = "qrcode-" + idx + "." + (e.format || "png").toLowerCase();
                    a.href = canvas.toDataURL("image/png");
                    a.click();
                  }
                  if (idx >= selected.length) {
                    /* Restore original params */
                    setText(prevText);
                    setFgColor(prevFg);
                    setBgColor(prevBg);
                    setSize(prevSize);
                  }
                  setTimeout(downloadNext, 200);
                }, 150);
              }
              downloadNext();
            }}
              style={{
                height: 40, padding: "0 20px",
                display: "inline-flex", alignItems: "center", gap: 6,
                border: "none", borderRadius: "var(--r-md)",
                background: "rgba(0,0,0,0.3)", color: "white",
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                transition: "background 0.12s",
              }}
              onMouseEnter={function (e) { e.currentTarget.style.background = "rgba(0,0,0,0.45)"; }}
              onMouseLeave={function (e) { e.currentTarget.style.background = "rgba(0,0,0,0.3)"; }}
            >
              <DownloadSimple size={14} weight="bold" />
              {lk === "fr" ? "Tout télécharger" : "Download all"}
            </button>
          );
        }}
      />
    </div>
    </>
  );
}

/* ── Domain Checker — StatusBadge ── */

function StatusBadge({ status, lk }) {
  if (status === "checking") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 11, fontWeight: 600, color: "var(--color-info)",
      }}>
        <CircleNotch size={12} weight="bold" style={{ animation: "spin 0.8s linear infinite" }} />
        {lk === "fr" ? "V\u00e9rification..." : "Checking..."}
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
        {lk === "fr" ? "D\u00e9j\u00e0 pris" : "Already taken"}
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
        {lk === "fr" ? "Potentiellement disponible" : "Potentially available"}
      </span>
    );
  }
  if (status === "error") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 11, fontWeight: 600, color: "var(--color-warning)",
      }}>
        {lk === "fr" ? "Erreur de v\u00e9rification" : "Verification error"}
      </span>
    );
  }
  return null;
}

/* ── TLD Category Pills ── */

function TldCategoryPills({ activeCategories, onToggle, onSelectAll, lk, results, name }) {
  var hasSearched = name && Object.keys(results || {}).length > 0;
  var allIds = TLD_CATEGORIES.map(function (c) { return c.id; });
  var isAll = activeCategories.length === allIds.length;

  var pillStyle = function (active) {
    return {
      display: "inline-flex", alignItems: "center", gap: 6,
      height: 32, padding: "0 12px",
      fontSize: 12, fontWeight: 600, fontFamily: "inherit",
      border: "1px solid " + (active ? "var(--brand)" : "var(--border)"),
      borderRadius: "var(--r-full)",
      background: active ? "var(--brand-bg)" : "var(--bg-card)",
      color: active ? "var(--brand)" : "var(--text-muted)",
      cursor: "pointer", transition: "all 0.12s",
    };
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      <button key="_all" type="button" onClick={onSelectAll} style={pillStyle(isAll)}>
        {lk === "fr" ? "Tous" : "All"}
      </button>
      {TLD_CATEGORIES.map(function (cat) {
        var isActive = activeCategories.indexOf(cat.id) !== -1 && !isAll;
        var catCount = 0;
        if (hasSearched) {
          cat.tlds.forEach(function (tld) {
            if (results[name + tld]) catCount++;
          });
        }
        return (
          <button key={cat.id} type="button"
            onClick={function () { onToggle(cat.id); }}
            style={pillStyle(isActive)}
          >
            {cat.label[lk] || cat.label.en}
            {hasSearched && catCount > 0 ? (
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                minWidth: 16, height: 16, padding: "0 4px",
                borderRadius: "var(--r-full)",
                background: isActive ? "var(--brand)" : "var(--bg-accordion)",
                color: isActive ? "white" : "var(--text-faint)",
                fontSize: 9, fontWeight: 700, lineHeight: 1,
              }}>
                {catCount}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ── Shared domain result card ── */

var SAVE_BTN_BASE = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
  fontSize: 11, fontWeight: 600, fontFamily: "inherit",
  transition: "all 0.2s",
};

function DomainResultCard({ name, tld, status, lk, savedFeedback, onSave, onBuy }) {
  var full = name + tld;
  var borderColor = status === "available" ? "var(--color-success)"
    : status === "taken" ? "var(--color-error)"
    : "var(--border)";
  var catId = findCategory(tld);
  var catLabel = "";
  TLD_CATEGORIES.forEach(function (c) {
    if (c.id === catId) catLabel = c.label[lk] || c.label.en;
  });

  return (
    <div
      style={{
        border: "1.5px solid " + borderColor,
        borderRadius: "var(--r-lg)",
        background: "var(--bg-card)",
        padding: "var(--sp-3)",
        display: "flex", flexDirection: "column", gap: "var(--sp-2)",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      <span style={{
        fontSize: 14, fontWeight: 600,
        color: "var(--text-primary)",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        wordBreak: "break-all",
      }}>
        {full}
      </span>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <StatusBadge status={status} lk={lk} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {TLD_PRICES[tld] ? (
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
              {"~" + TLD_PRICES[tld] + " \u20ac/" + (lk === "fr" ? "an" : "yr")}
            </span>
          ) : null}
          <span style={{
            fontSize: 10, fontWeight: 500,
            color: "var(--text-faint)",
            background: "var(--bg-accordion)",
            padding: "2px 6px",
            borderRadius: "var(--r-sm)",
          }}>
            {catLabel}
          </span>
        </div>
      </div>
      {status === "available" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          {onSave ? (
            <button type="button" onClick={function () { onSave(name, tld, status); }}
              disabled={!!savedFeedback[full]}
              style={Object.assign({}, SAVE_BTN_BASE, {
                height: 36, border: savedFeedback[full] ? "1px solid var(--color-success)" : "1px solid var(--border)", borderRadius: "var(--r-md)",
                background: savedFeedback[full] ? "var(--color-success-bg, var(--bg-accordion))" : "var(--bg-accordion)",
                color: savedFeedback[full] ? "var(--color-success)" : "var(--text-secondary)",
                cursor: savedFeedback[full] ? "default" : "pointer",
              })}>
              {savedFeedback[full]
                ? <CheckCircle size={11} weight="fill" />
                : <BookmarkSimple size={11} weight="regular" />}
              {savedFeedback[full]
                ? (lk === "fr" ? "Sauvegard\u00e9 !" : "Saved!")
                : (lk === "fr" ? "Sauvegarder" : "Save")}
            </button>
          ) : null}
          {onBuy(name, tld, full, onSave)}
        </div>
      ) : onSave && status && status !== "checking" ? (
        <button type="button" onClick={function () { onSave(name, tld, status); }}
          disabled={!!savedFeedback[full]}
          style={Object.assign({}, SAVE_BTN_BASE, {
            width: "100%", height: 36,
            border: savedFeedback[full] ? "1px solid var(--color-success)" : "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            background: savedFeedback[full] ? "var(--color-success-bg, var(--bg-accordion))" : "var(--bg-accordion)",
            color: savedFeedback[full] ? "var(--color-success)" : "var(--text-secondary)",
            cursor: savedFeedback[full] ? "default" : "pointer",
          })}
          onMouseEnter={function (e) { if (!savedFeedback[full]) { e.currentTarget.style.background = "var(--brand-bg)"; e.currentTarget.style.color = "var(--brand)"; } }}
          onMouseLeave={function (e) { if (!savedFeedback[full]) { e.currentTarget.style.background = "var(--bg-accordion)"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
        >
          {savedFeedback[full]
            ? <CheckCircle size={12} weight="fill" />
            : <BookmarkSimple size={12} weight="bold" />}
          {savedFeedback[full]
            ? (lk === "fr" ? "Sauvegard\u00e9 !" : "Saved!")
            : (lk === "fr" ? "Sauvegarder" : "Save")}
        </button>
      ) : null}
    </div>
  );
}

/* ── Domain Checker (reusable component) ── */

export function DomainChecker({ onSave, compact, lk }) {
  var [domain, setDomain] = useState("");
  var [results, setResults] = useState({});
  var [loading, setLoading] = useState(false);
  var [activeCategories, setActiveCategories] = useState(function () {
    return TLD_CATEGORIES.map(function (c) { return c.id; });
  });
  var [savedFeedback, setSavedFeedback] = useState({});

  /* Typewriter animated placeholder */
  var [phIdx, setPhIdx] = useState(0);
  var [phChar, setPhChar] = useState(0);
  var [phDeleting, setPhDeleting] = useState(false);
  useEffect(function () {
    if (domain) return;
    var current = PH_DOMAINS[phIdx % PH_DOMAINS.length];
    var delay = phDeleting ? 40 : 80;
    if (!phDeleting && phChar === current.length) delay = 1800;
    if (phDeleting && phChar === 0) delay = 400;
    var timer = setTimeout(function () {
      if (!phDeleting && phChar < current.length) {
        setPhChar(phChar + 1);
      } else if (!phDeleting && phChar === current.length) {
        setPhDeleting(true);
      } else if (phDeleting && phChar > 0) {
        setPhChar(phChar - 1);
      } else {
        setPhDeleting(false);
        setPhIdx(function (prev) { return (prev + 1) % PH_DOMAINS.length; });
      }
    }, delay);
    return function () { clearTimeout(timer); };
  }, [domain, phIdx, phChar, phDeleting]);
  var phText = domain ? "" : PH_DOMAINS[phIdx % PH_DOMAINS.length].substring(0, phChar);

  function toggleCategory(catId) {
    setActiveCategories(function (prev) {
      var allIds = TLD_CATEGORIES.map(function (c) { return c.id; });
      if (prev.length === allIds.length) return [catId];
      var idx = prev.indexOf(catId);
      if (idx !== -1 && prev.length === 1) return allIds;
      if (idx !== -1) return prev.filter(function (id) { return id !== catId; });
      return [catId];
    });
  }

  function handleCheck() {
    var base = parseDomainBase(domain);
    if (!base) return;
    setLoading(true);
    var tlds = getActiveTldsFor(domain, activeCategories);
    tlds.forEach(function (tld) { checkDomainDNS(base + tld, setResults); });
    setTimeout(function () { setLoading(false); }, 300);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleCheck();
  }

  function handleSaveAvailable() {
    if (!onSave) return;
    var base = parseDomainBase(domain);
    var tlds = getActiveTldsFor(domain, activeCategories);
    var saved = [];
    tlds.forEach(function (tld) {
      var full = base + tld;
      if (results[full] === "available") {
        saved.push({ domain: base, tld: tld, status: "available", lastCheck: Date.now() });
      }
    });
    if (saved.length > 0) onSave(saved);
  }

  function handleSaveSingle(base, tld, status) {
    if (!onSave) return;
    onSave([{ domain: base, tld: tld, status: status || "unchecked", lastCheck: Date.now() }]);
    setSavedFeedback(function (prev) {
      var next = Object.assign({}, prev);
      next[base + tld] = true;
      return next;
    });
    setTimeout(function () {
      setSavedFeedback(function (prev) {
        var next = Object.assign({}, prev);
        delete next[base + tld];
        return next;
      });
    }, 1500);
  }

  var name = parseDomainBase(domain);
  var domainWarning = validateDomainName(name, lk);
  var tlds = getActiveTldsFor(domain, activeCategories);
  var hasResults = name && Object.keys(results).length > 0;
  var availCount = 0;
  var takenCount = 0;
  var checkedCount = 0;

  if (name) {
    tlds.forEach(function (tld) {
      var full = name + tld;
      var s = results[full];
      if (s === "available") { availCount++; checkedCount++; }
      else if (s === "taken") { takenCount++; checkedCount++; }
      else if (s === "error") { checkedCount++; }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>

      {!compact ? (
        <h3 style={Object.assign({}, SECTION_LABEL, { margin: 0 })}>
          {lk === "fr" ? "V\u00e9rificateur de domaine" : "Domain checker"}
        </h3>
      ) : null}

      {/* Input area */}
      <div>
        <div style={FIELD_LABEL}>{lk === "fr" ? "Nom de domaine" : "Domain name"}</div>
        <div style={{ display: "flex", gap: "var(--sp-2)" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              value={domain}
              onChange={function (e) { setDomain(e.target.value); }}
              onKeyDown={handleKeyDown}
              placeholder={phText || "..."}
              style={Object.assign({}, INPUT_STYLE, { width: "100%", paddingRight: domain ? 36 : "var(--sp-3)" })}
            />
            {domain ? (
              <button type="button" onClick={function () { setDomain(""); setResults({}); }}
                style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  width: 22, height: 22, borderRadius: "50%", border: "none",
                  background: "var(--bg-accordion)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.12s",
                }}
                onMouseEnter={function (e) { e.currentTarget.style.background = "var(--border)"; }}
                onMouseLeave={function (e) { e.currentTarget.style.background = "var(--bg-accordion)"; }}
              >
                <X size={12} weight="bold" color="var(--text-muted)" />
              </button>
            ) : null}
          </div>
          <Button
            color="primary"
            size="lg"
            onClick={handleCheck}
            isDisabled={!domain.trim() || !!domainWarning}
            isLoading={loading}
            iconLeading={<MagnifyingGlass size={16} weight="bold" />}
          >
            {lk === "fr" ? "V\u00e9rifier" : "Check"}
          </Button>
        </div>
        {domainWarning ? (
          <div style={{ marginTop: 4, fontSize: 12, color: "var(--color-warning)", lineHeight: 1.4 }}>
            {domainWarning}
          </div>
        ) : null}
      </div>

      {/* TLD Category pills */}
      <TldCategoryPills activeCategories={activeCategories} onToggle={toggleCategory} onSelectAll={function () { setActiveCategories(TLD_CATEGORIES.map(function (c) { return c.id; })); }} lk={lk} results={results} name={name} />

      {/* Results grid */}
      {name ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: compact ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
          gap: "var(--sp-3)",
        }}>
          {tlds.map(function (tld) {
            return (
              <DomainResultCard
                key={tld}
                name={name}
                tld={tld}
                status={results[name + tld]}
                lk={lk}
                savedFeedback={savedFeedback}
                onSave={onSave ? handleSaveSingle : null}
                onBuy={function (n, t, full, hasSave) {
                  return (
                    <a href={(TLD_REGISTRAR[t] || DEFAULT_REGISTRAR) + "?domain=" + encodeURIComponent(full)}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                        height: 36, border: "none", borderRadius: "var(--r-md)",
                        background: "var(--brand)", color: "white",
                        fontSize: 11, fontWeight: 600, fontFamily: "inherit", textDecoration: "none",
                        gridColumn: hasSave ? undefined : "span 2",
                      }}>
                      {lk === "fr" ? "Acheter" : "Buy"}
                    </a>
                  );
                }}
              />
            );
          })}
        </div>
      ) : null}

      {/* Action buttons below results */}
      {hasResults && checkedCount > 0 ? (
        <div style={{ display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" }}>
          {onSave && availCount > 0 ? (
            <Button
              color="secondary"
              size="sm"
              onClick={handleSaveAvailable}
              iconLeading={<BookmarkSimple size={14} weight="bold" />}
            >
              {lk === "fr"
                ? "Sauvegarder les disponibles (" + availCount + ")"
                : "Save available (" + availCount + ")"}
            </Button>
          ) : null}
          <Button
            color="ghost"
            size="sm"
            onClick={handleCheck}
            iconLeading={<ArrowsClockwise size={14} weight="bold" />}
          >
            {lk === "fr" ? "V\u00e9rifier \u00e0 nouveau" : "Check again"}
          </Button>
        </div>
      ) : null}

      {/* Hint */}
      {!compact ? (
        <p style={{ fontSize: 11, color: "var(--text-faint)", margin: 0, lineHeight: 1.5 }}>
          {lk === "fr"
            ? "V\u00e9rification DNS uniquement. Un domaine sans enregistrement DNS peut tout de m\u00eame \u00eatre r\u00e9serv\u00e9. Confirmez sur un registrar."
            : "DNS check only. A domain without DNS records may still be registered. Confirm with a registrar."}
        </p>
      ) : null}
    </div>
  );
}

/* ── Availability Summary Bar ── */

function AvailabilitySummary({ available, taken, total, lk }) {
  if (total === 0) return null;
  var availPct = total > 0 ? Math.round((available / total) * 100) : 0;
  var takenPct = total > 0 ? Math.round((taken / total) * 100) : 0;
  var otherPct = 100 - availPct - takenPct;

  return (
    <div style={{
      border: "1px solid var(--border)",
      borderRadius: "var(--r-lg)",
      background: "var(--bg-card)",
      padding: "var(--sp-4)",
    }}>
      <div style={Object.assign({}, SECTION_LABEL, { marginBottom: "var(--sp-3)" })}>
        {lk === "fr" ? "R\u00e9sum\u00e9 de disponibilit\u00e9" : "Availability summary"}
      </div>

      {/* Stacked bar */}
      <div style={{
        display: "flex", height: 24, borderRadius: "var(--r-md)", overflow: "hidden",
        background: "var(--bg-accordion)", border: "1px solid var(--border-light)",
      }}>
        {availPct > 0 ? (
          <div style={{
            width: availPct + "%", height: "100%",
            background: "var(--color-success)",
            transition: "width 0.4s ease",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {availPct >= 15 ? (
              <span style={{ fontSize: 10, fontWeight: 700, color: "white" }}>{availPct}%</span>
            ) : null}
          </div>
        ) : null}
        {takenPct > 0 ? (
          <div style={{
            width: takenPct + "%", height: "100%",
            background: "var(--color-error)",
            transition: "width 0.4s ease",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {takenPct >= 15 ? (
              <span style={{ fontSize: 10, fontWeight: 700, color: "white" }}>{takenPct}%</span>
            ) : null}
          </div>
        ) : null}
        {otherPct > 0 ? (
          <div style={{
            width: otherPct + "%", height: "100%",
            background: "var(--bg-accordion)",
            transition: "width 0.4s ease",
          }} />
        ) : null}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "var(--sp-4)", marginTop: "var(--sp-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--color-success)" }} />
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {lk === "fr" ? "Disponibles" : "Available"} ({available})
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--color-error)" }} />
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {lk === "fr" ? "D\u00e9j\u00e0 pris" : "Taken"} ({taken})
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--bg-accordion)", border: "1px solid var(--border)" }} />
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {lk === "fr" ? "Non v\u00e9rifi\u00e9s" : "Unchecked"} ({total - available - taken})
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Feature 5: Search History Table ── */

function SearchHistoryTable({ searchHistory, setSearchHistory, lk }) {
  var columns = [
    {
      id: "name",
      accessorKey: "name",
      header: lk === "fr" ? "Nom recherch\u00e9" : "Searched name",
      cell: function (info) {
        return (
          <span style={{
            fontSize: 13, fontWeight: 600,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            color: "var(--text-primary)",
          }}>
            {info.getValue()}
          </span>
        );
      },
    },
    {
      id: "date",
      accessorKey: "timestamp",
      header: "Date",
      size: 140,
      cell: function (info) {
        var ts = info.getValue();
        if (!ts) return <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{"\u2014"}</span>;
        return (
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {timeAgo(ts, lk)}
          </span>
        );
      },
    },
    {
      id: "tldCount",
      accessorKey: "tldCount",
      header: "TLDs",
      size: 80,
      cell: function (info) {
        var v = info.getValue();
        return (
          <Badge color="neutral">{v + " ext."}</Badge>
        );
      },
    },
    {
      id: "actions",
      header: "",
      size: 60,
      cell: function (info) {
        var row = info.row.original;
        return (
          <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
            <ButtonUtility
              icon={<MagnifyingGlass size={14} weight="bold" />}
              size="sm"
              onClick={function () {
                /* Navigate back to search by setting the input — handled via page reload */
                var input = document.querySelector('input[type="text"]');
                if (input) {
                  var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                  nativeInputValueSetter.call(input, row.name);
                  input.dispatchEvent(new Event('input', { bubbles: true }));
                }
              }}
              title={lk === "fr" ? "Rechercher \u00e0 nouveau" : "Search again"}
              ariaLabel={lk === "fr" ? "Rechercher \u00e0 nouveau" : "Search again"}
            />
          </div>
        );
      },
    },
  ];

  function bulkDelete(ids) {
    var idSet = {};
    ids.forEach(function (id) { idSet[id] = true; });
    setSearchHistory(function (prev) {
      return prev.filter(function (h) { return !idSet[String(h.id)]; });
    });
  }

  var emptyNode = (
    <div style={{ textAlign: "center", padding: "var(--sp-6)", color: "var(--text-faint)" }}>
      <MagnifyingGlass size={32} weight="light" color="var(--text-faint)" style={{ marginBottom: "var(--sp-2)" }} />
      <div style={{ fontSize: 13, fontWeight: 500 }}>
        {lk === "fr"
          ? "Aucune recherche r\u00e9cente. V\u00e9rifiez un domaine ci-dessus pour commencer."
          : "No recent searches. Check a domain above to get started."}
      </div>
    </div>
  );

  return (
    <div>
      <DataTable
        data={searchHistory}
        columns={columns}
        emptyState={emptyNode}
        emptyMinHeight={160}
        pageSize={10}
        getRowId={function (row) { return String(row.id); }}
        selectable
        onDeleteSelected={function (ids) { bulkDelete(ids); }}
      />
    </div>
  );
}

/* ── Domain Watchlist ── */

function DomainWatchlist({ watchlist, setWatchlist, lk }) {
  var [search, setSearch] = useState("");
  var [statusFilter, setStatusFilter] = useState("all");

  function recheckSingle(item) {
    setWatchlist(function (prev) {
      return prev.map(function (w) {
        if (w.id === item.id) return Object.assign({}, w, { status: "checking" });
        return w;
      });
    });
    var full = item.domain + item.tld;
    fetch("https://dns.google/resolve?name=" + encodeURIComponent(full) + "&type=A")
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var status = data.Status === 3 ? "available" : "taken";
        setWatchlist(function (prev) {
          return prev.map(function (w) {
            if (w.id === item.id) return Object.assign({}, w, { status: status, lastCheck: Date.now() });
            return w;
          });
        });
      })
      .catch(function () {
        setWatchlist(function (prev) {
          return prev.map(function (w) {
            if (w.id === item.id) return Object.assign({}, w, { status: "error", lastCheck: Date.now() });
            return w;
          });
        });
      });
  }

  function recheckAll() {
    watchlist.forEach(function (item) { recheckSingle(item); });
  }

  function removeItem(id) {
    setWatchlist(function (prev) { return prev.filter(function (w) { return w.id !== id; }); });
  }

  function bulkDelete(ids) {
    var idSet = {};
    ids.forEach(function (id) { idSet[id] = true; });
    setWatchlist(function (prev) {
      return prev.filter(function (w) { return !idSet[String(w.id)]; });
    });
  }

  var filtered = watchlist;
  if (statusFilter !== "all") {
    filtered = filtered.filter(function (w) { return w.status === statusFilter; });
  }
  if (search.trim()) {
    var q = search.trim().toLowerCase();
    filtered = filtered.filter(function (w) {
      return (w.domain + w.tld).toLowerCase().indexOf(q) !== -1;
    });
  }

  var columns = [
    {
      id: "domain",
      accessorFn: function (row) { return row.domain + row.tld; },
      header: lk === "fr" ? "Domaine" : "Domain",
      cell: function (info) {
        return (
          <span style={{
            fontSize: 13, fontWeight: 600,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            color: "var(--text-primary)",
          }}>
            {info.getValue()}
          </span>
        );
      },
    },
    {
      id: "tld",
      accessorKey: "tld",
      header: "Extension",
      size: 100,
      cell: function (info) {
        return (
          <Badge color="neutral">{info.getValue()}</Badge>
        );
      },
    },
    {
      id: "status",
      accessorKey: "status",
      header: lk === "fr" ? "Statut" : "Status",
      size: 160,
      cell: function (info) {
        return <StatusBadge status={info.getValue()} lk={lk} />;
      },
    },
    {
      id: "lastCheck",
      accessorKey: "lastCheck",
      header: lk === "fr" ? "Derni\u00e8re v\u00e9rification" : "Last check",
      size: 140,
      cell: function (info) {
        var ts = info.getValue();
        if (!ts) return <span style={{ fontSize: 12, color: "var(--text-faint)" }}>—</span>;
        return (
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {timeAgo(ts, lk)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      size: 80,
      cell: function (info) {
        var row = info.row.original;
        return (
          <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
            <ButtonUtility
              icon={<ArrowsClockwise size={14} weight="bold" />}
              size="sm"
              onClick={function () { recheckSingle(row); }}
              title={lk === "fr" ? "Rev\u00e9rifier" : "Re-check"}
              ariaLabel={lk === "fr" ? "Rev\u00e9rifier" : "Re-check"}
            />
            <ButtonUtility
              icon={<Trash size={14} weight="bold" />}
              variant="danger"
              size="sm"
              onClick={function () { removeItem(row.id); }}
              title={lk === "fr" ? "Supprimer" : "Delete"}
              ariaLabel={lk === "fr" ? "Supprimer" : "Delete"}
            />
          </div>
        );
      },
    },
  ];

  var toolbarNode = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", flexWrap: "wrap" }}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={lk === "fr" ? "Rechercher un domaine..." : "Search a domain..."}
        />
        <FilterDropdown
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: lk === "fr" ? "Tous les statuts" : "All statuses" },
            { value: "available", label: lk === "fr" ? "Disponibles" : "Available" },
            { value: "taken", label: lk === "fr" ? "D\u00e9j\u00e0 pris" : "Taken" },
          ]}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
        <Button
          color="tertiary"
          size="lg"
          onClick={function () { exportWatchlistCSV(watchlist, lk); }}
          isDisabled={watchlist.length === 0}
          iconLeading={<DownloadSimple size={14} weight="bold" />}
        >
          {lk === "fr" ? "Exporter" : "Export"}
        </Button>
        <Button
          color="primary"
          size="lg"
          onClick={recheckAll}
          isDisabled={watchlist.length === 0}
          iconLeading={<ArrowsClockwise size={14} weight="bold" />}
        >
          {lk === "fr" ? "Tout v\u00e9rifier" : "Check all"}
        </Button>
      </div>
    </>
  );

  var emptyNode = (
    <div style={{ textAlign: "center", padding: "var(--sp-6)", color: "var(--text-faint)" }}>
      <BookmarkSimple size={32} weight="light" color="var(--text-faint)" style={{ marginBottom: "var(--sp-2)" }} />
      <div style={{ fontSize: 13, fontWeight: 500 }}>
        {lk === "fr"
          ? "Aucun domaine sauvegard\u00e9. V\u00e9rifiez un domaine ci-dessus et cliquez sur \u00abSauvegarder\u00bb."
          : "No saved domains. Check a domain above and click \"Save\"."}
      </div>
    </div>
  );

  return (
    <div>
      <DataTable
        data={filtered}
        columns={columns}
        toolbar={toolbarNode}
        emptyState={emptyNode}
        emptyMinHeight={160}
        pageSize={10}
        getRowId={function (row) { return String(row.id); }}
        selectable
        onDeleteSelected={function (ids) { bulkDelete(ids); }}
      />
    </div>
  );
}

/* ── Main Page ── */

export default function ToolsPage({ activeTab }) {
  var t = useT().tools || {};
  var { lang } = useLang();
  var lk = lang === "en" ? "en" : "fr";

  /* Watchlist state — persisted in localStorage */
  var [watchlist, setWatchlist] = useState(loadWatchlist);

  /* Checker state lifted for KPI counting */
  var [checkerResults, setCheckerResults] = useState({});

  /* Feature 5: Search history state — persisted in localStorage */
  var [searchHistory, setSearchHistory] = useState(loadSearchHistory);
  var [domainTab, setDomainTab] = useState("saved");

  useEffect(function () {
    try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist)); } catch (e) { /* ignore */ }
  }, [watchlist]);

  useEffect(function () {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(searchHistory)); } catch (e) { /* ignore */ }
  }, [searchHistory]);

  function handleSaveDomains(items) {
    setWatchlist(function (prev) {
      var next = prev.slice();
      items.forEach(function (item) {
        var exists = false;
        next.forEach(function (w) {
          if (w.domain === item.domain && w.tld === item.tld) {
            exists = true;
            w.status = item.status;
            w.lastCheck = item.lastCheck;
          }
        });
        if (!exists) {
          next.push(Object.assign({ id: generateId() }, item));
        }
      });
      return next;
    });
  }

  function handleSearchHistory(entry) {
    setSearchHistory(function (prev) {
      return [entry].concat(prev).slice(0, 20);
    });
  }

  if (activeTab === "tool_qr") {
    return (
      <PageLayout
        title={lk === "fr" ? "G\u00e9n\u00e9rateur de QR Code" : "QR Code Generator"}
        subtitle={lk === "fr" ? "Cr\u00e9ez un QR code personnalis\u00e9 en quelques secondes." : "Create a custom QR code in seconds."}
        icon={QrCode}
      >
        <QrCodeTool t={t} lk={lk} />
      </PageLayout>
    );
  }

  if (activeTab === "tool_domain") {
    /* Compute KPI values */
    var totalChecked = 0;
    var availableCount = 0;
    var takenCount = 0;
    Object.keys(checkerResults).forEach(function (k) {
      var s = checkerResults[k];
      if (s === "available") { availableCount++; totalChecked++; }
      else if (s === "taken") { takenCount++; totalChecked++; }
      else if (s === "error") { totalChecked++; }
    });

    return (
      <PageLayout
        title={lk === "fr" ? "V\u00e9rificateur de nom de domaine" : "Domain Name Checker"}
        subtitle={lk === "fr" ? "V\u00e9rifiez la disponibilit\u00e9 d\u2019un nom de domaine pour votre startup." : "Check domain name availability for your startup."}
        icon={Globe}
      >
        {/* 1. KPI cards row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "var(--sp-4)",
          marginBottom: "var(--sp-5)",
        }}>
          <KpiCard
            label={lk === "fr" ? "Domaines v\u00e9rifi\u00e9s" : "Domains checked"}
            value={String(totalChecked)}
          />
          <KpiCard
            label={lk === "fr" ? "Disponibles" : "Available"}
            value={String(availableCount)}
          />
          <KpiCard
            label={lk === "fr" ? "Sauvegard\u00e9s" : "Saved"}
            value={String(watchlist.length)}
          />
        </div>

        {/* 2. DomainChecker component */}
        <div style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          background: "var(--bg-card)",
          padding: "var(--sp-5)",
          marginBottom: "var(--sp-5)",
        }}>
          <DomainCheckerInner
            lk={lk}
            onSave={handleSaveDomains}
            onResultsChange={setCheckerResults}
            onSearchHistory={handleSearchHistory}
          />
        </div>

        {/* 3. Availability summary — only after an actual search */}
        {(availableCount + takenCount) > 0 ? (
          <div style={{ marginBottom: "var(--sp-5)" }}>
            <AvailabilitySummary
              available={availableCount}
              taken={takenCount}
              total={availableCount + takenCount}
              lk={lk}
            />
          </div>
        ) : null}

        {/* Feature 5: Tabs for Saved / History */}
        <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border-light)", marginBottom: "var(--sp-4)" }}>
          {["saved", "history"].map(function (key) {
            var isActive = domainTab === key;
            var labels = { saved: lk === "fr" ? "Sauvegard\u00e9s" : "Saved", history: lk === "fr" ? "Historique" : "History" };
            var counts = { saved: watchlist.length, history: searchHistory.length };
            return (
              <button key={key} type="button" onClick={function () { setDomainTab(key); }}
                style={{
                  padding: "var(--sp-2) var(--sp-4)", border: "none", background: "none",
                  fontSize: 13, fontWeight: isActive ? 600 : 400, cursor: "pointer", fontFamily: "inherit",
                  color: isActive ? "var(--brand)" : "var(--text-muted)",
                  borderBottom: isActive ? "2px solid var(--brand)" : "2px solid transparent",
                  marginBottom: -2, transition: "color 0.15s, border-color 0.15s",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                {labels[key]}
                {counts[key] > 0 ? (
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    minWidth: 18, height: 18, padding: "0 5px",
                    borderRadius: "var(--r-full)",
                    background: isActive ? "var(--brand-bg)" : "var(--bg-accordion)",
                    color: isActive ? "var(--brand)" : "var(--text-faint)",
                    fontSize: 10, fontWeight: 700, lineHeight: 1,
                  }}>
                    {counts[key]}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* 4. Tab content */}
        {domainTab === "saved" ? (
          <DomainWatchlist watchlist={watchlist} setWatchlist={setWatchlist} lk={lk} />
        ) : (
          <SearchHistoryTable searchHistory={searchHistory} setSearchHistory={setSearchHistory} lk={lk} />
        )}
      </PageLayout>
    );
  }

  return null;
}

/* ── DomainCheckerInner — Internal wrapper that reports results upward ── */

function DomainCheckerInner({ lk, onSave, onResultsChange, onSearchHistory }) {
  var [domain, setDomain] = useState("");
  var [results, setResults] = useState({});
  var [loading, setLoading] = useState(false);
  var [activeCategories, setActiveCategories] = useState(function () {
    return TLD_CATEGORIES.map(function (c) { return c.id; });
  });
  var [savedFeedback, setSavedFeedback] = useState({});
  var [registrarDrawer, setRegistrarDrawer] = useState(null);

  /* Typewriter animated placeholder */
  var [phIdx, setPhIdx] = useState(0);
  var [phChar, setPhChar] = useState(0);
  var [phDeleting, setPhDeleting] = useState(false);
  useEffect(function () {
    if (domain) return;
    var current = PH_DOMAINS[phIdx % PH_DOMAINS.length];
    var delay = phDeleting ? 40 : 80;
    if (!phDeleting && phChar === current.length) delay = 1800;
    if (phDeleting && phChar === 0) delay = 400;
    var timer = setTimeout(function () {
      if (!phDeleting && phChar < current.length) {
        setPhChar(phChar + 1);
      } else if (!phDeleting && phChar === current.length) {
        setPhDeleting(true);
      } else if (phDeleting && phChar > 0) {
        setPhChar(phChar - 1);
      } else {
        setPhDeleting(false);
        setPhIdx(function (prev) { return (prev + 1) % PH_DOMAINS.length; });
      }
    }, delay);
    return function () { clearTimeout(timer); };
  }, [domain, phIdx, phChar, phDeleting]);
  var phText = domain ? "" : PH_DOMAINS[phIdx % PH_DOMAINS.length].substring(0, phChar);

  /* Report results to parent for KPI */
  useEffect(function () {
    if (onResultsChange) onResultsChange(results);
  }, [results]);

  function toggleCategory(catId) {
    setActiveCategories(function (prev) {
      var allIds = TLD_CATEGORIES.map(function (c) { return c.id; });
      if (prev.length === allIds.length) return [catId];
      var idx = prev.indexOf(catId);
      if (idx !== -1 && prev.length === 1) return allIds;
      if (idx !== -1) return prev.filter(function (id) { return id !== catId; });
      return [catId];
    });
  }

  function handleCheck() {
    var base = parseDomainBase(domain);
    if (!base) return;
    setLoading(true);
    var tlds = getActiveTldsFor(domain, activeCategories);
    tlds.forEach(function (tld) { checkDomainDNS(base + tld, setResults); });
    setTimeout(function () { setLoading(false); }, 300);
    /* Track search history */
    if (onSearchHistory) {
      onSearchHistory({ id: Date.now(), name: base, timestamp: Date.now(), tldCount: tlds.length });
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleCheck();
  }

  function handleSaveAvailable() {
    if (!onSave) return;
    var base = parseDomainBase(domain);
    var tlds = getActiveTldsFor(domain, activeCategories);
    var saved = [];
    tlds.forEach(function (tld) {
      var full = base + tld;
      if (results[full] === "available") {
        saved.push({ domain: base, tld: tld, status: "available", lastCheck: Date.now() });
      }
    });
    if (saved.length > 0) onSave(saved);
  }

  function handleSaveSingle(base, tld, status) {
    if (!onSave) return;
    onSave([{ domain: base, tld: tld, status: status || "unchecked", lastCheck: Date.now() }]);
    setSavedFeedback(function (prev) {
      var next = Object.assign({}, prev);
      next[base + tld] = true;
      return next;
    });
    setTimeout(function () {
      setSavedFeedback(function (prev) {
        var next = Object.assign({}, prev);
        delete next[base + tld];
        return next;
      });
    }, 1500);
  }

  var name = parseDomainBase(domain);
  var domainWarning = validateDomainName(name, lk);
  var tlds = getActiveTldsFor(domain, activeCategories);
  var hasResults = name && Object.keys(results).length > 0;
  var availCount = 0;
  var checkedCount = 0;

  if (name) {
    tlds.forEach(function (tld) {
      var full = name + tld;
      var s = results[full];
      if (s === "available") { availCount++; checkedCount++; }
      else if (s === "taken" || s === "error") { checkedCount++; }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>

      <h3 style={Object.assign({}, SECTION_LABEL, { margin: 0 })}>
        {lk === "fr" ? "V\u00e9rificateur de domaine" : "Domain checker"}
      </h3>

      {/* Input area */}
      <div>
        <div style={FIELD_LABEL}>{lk === "fr" ? "Nom de domaine" : "Domain name"}</div>
        <div style={{ display: "flex", gap: "var(--sp-2)" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              value={domain}
              onChange={function (e) { setDomain(e.target.value); }}
              onKeyDown={handleKeyDown}
              placeholder={phText || "..."}
              style={Object.assign({}, INPUT_STYLE, { width: "100%", paddingRight: domain ? 36 : "var(--sp-3)" })}
            />
            {domain ? (
              <button type="button" onClick={function () { setDomain(""); setResults({}); }}
                style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  width: 22, height: 22, borderRadius: "50%", border: "none",
                  background: "var(--bg-accordion)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.12s",
                }}
                onMouseEnter={function (e) { e.currentTarget.style.background = "var(--border)"; }}
                onMouseLeave={function (e) { e.currentTarget.style.background = "var(--bg-accordion)"; }}
              >
                <X size={12} weight="bold" color="var(--text-muted)" />
              </button>
            ) : null}
          </div>
          <Button
            color="primary"
            size="lg"
            onClick={handleCheck}
            isDisabled={!domain.trim() || !!domainWarning}
            isLoading={loading}
            iconLeading={<MagnifyingGlass size={16} weight="bold" />}
          >
            {lk === "fr" ? "V\u00e9rifier" : "Check"}
          </Button>
        </div>
        {domainWarning ? (
          <div style={{ marginTop: 4, fontSize: 12, color: "var(--color-warning)", lineHeight: 1.4 }}>
            {domainWarning}
          </div>
        ) : null}
      </div>

      {/* Feature 1: Name suggestions */}
      {name && !hasResults ? (
        <div>
          <div style={FIELD_LABEL}>{lk === "fr" ? "Suggestions" : "Suggestions"}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {generateSuggestions(name).map(function (s) {
              return (
                <button key={s} type="button" onClick={function () { setDomain(s); }}
                  style={{
                    padding: "4px 12px", fontSize: 12, fontWeight: 500,
                    border: "1px solid var(--border)", borderRadius: "var(--r-full)",
                    background: "var(--bg-accordion)", color: "var(--text-secondary)",
                    cursor: "pointer", fontFamily: "inherit",
                    transition: "background 0.12s, color 0.12s, border-color 0.12s",
                  }}
                  onMouseEnter={function (e) { e.currentTarget.style.background = "var(--brand-bg)"; e.currentTarget.style.color = "var(--brand)"; e.currentTarget.style.borderColor = "var(--brand)"; }}
                  onMouseLeave={function (e) { e.currentTarget.style.background = "var(--bg-accordion)"; e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* TLD Category pills */}
      <TldCategoryPills activeCategories={activeCategories} onToggle={toggleCategory} onSelectAll={function () { setActiveCategories(TLD_CATEGORIES.map(function (c) { return c.id; })); }} lk={lk} results={results} name={name} />

      {/* Results grid */}
      {name ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "var(--sp-3)",
        }}>
          {tlds.map(function (tld) {
            return (
              <DomainResultCard
                key={tld}
                name={name}
                tld={tld}
                status={results[name + tld]}
                lk={lk}
                savedFeedback={savedFeedback}
                onSave={onSave ? handleSaveSingle : null}
                onBuy={function (n, t, full, hasSave) {
                  return (
                    <button type="button" onClick={function () { setRegistrarDrawer({ domain: n, tld: t }); }}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                        height: 36, border: "none", borderRadius: "var(--r-md)",
                        background: "var(--brand)", color: "white",
                        fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                        gridColumn: hasSave ? undefined : "span 2",
                        cursor: "pointer",
                      }}>
                      {lk === "fr" ? "Acheter" : "Buy"}
                    </button>
                  );
                }}
              />
            );
          })}
        </div>
      ) : null}

      {/* Action buttons */}
      {hasResults && checkedCount > 0 ? (
        <div style={{ display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" }}>
          {onSave && availCount > 0 ? (
            <Button
              color="secondary"
              size="sm"
              onClick={handleSaveAvailable}
              iconLeading={<BookmarkSimple size={14} weight="bold" />}
            >
              {lk === "fr"
                ? "Sauvegarder les disponibles (" + availCount + ")"
                : "Save available (" + availCount + ")"}
            </Button>
          ) : null}
          <Button
            color="ghost"
            size="sm"
            onClick={handleCheck}
            iconLeading={<ArrowsClockwise size={14} weight="bold" />}
          >
            {lk === "fr" ? "V\u00e9rifier \u00e0 nouveau" : "Check again"}
          </Button>
        </div>
      ) : null}

      {/* Feature 2: Domain name quality score */}
      {hasResults && checkedCount > 0 ? (function () {
        var scoreData = scoreDomain(name, results);
        return (
          <div style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            background: "var(--bg-card)",
            padding: "var(--sp-4)",
          }}>
            <div style={Object.assign({}, SECTION_LABEL, { marginBottom: "var(--sp-3)" })}>
              {lk === "fr" ? "Qualit\u00e9 du nom" : "Name quality"}
            </div>
            {/* Stars */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: "var(--sp-3)" }}>
              {[1, 2, 3, 4, 5].map(function (n) {
                return (
                  <Star key={n} size={20} weight={n <= scoreData.score ? "fill" : "regular"}
                    color={n <= scoreData.score ? "var(--color-warning)" : "var(--text-faint)"} />
                );
              })}
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginLeft: 8 }}>
                {scoreData.score}/{scoreData.max}
              </span>
            </div>
            {/* Tips */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {scoreData.tips.map(function (tip, idx) {
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    {tip.good
                      ? <CheckCircle size={14} weight="fill" color="var(--color-success)" style={{ flexShrink: 0, marginTop: 2 }} />
                      : <WarningCircle size={14} weight="fill" color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 2 }} />}
                    <span style={{ fontSize: 12, color: tip.good ? "var(--text-secondary)" : "var(--text-secondary)", lineHeight: 1.5 }}>
                      {tip.text[lk] || tip.text.en}
                    </span>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 11, color: "var(--text-faint)", margin: "var(--sp-3) 0 0 0", lineHeight: 1.5 }}>
              {lk === "fr"
                ? "Un bon nom de domaine renforce votre cr\u00e9dibilit\u00e9 et facilite le bouche-\u00e0-oreille."
                : "A good domain name strengthens your credibility and makes word-of-mouth easier."}
            </p>
          </div>
        );
      })() : null}

      {/* Feature 3: Hint (enhanced) */}
      <p style={{ fontSize: 11, color: "var(--text-faint)", margin: 0, lineHeight: 1.5 }}>
        {lk === "fr"
          ? "V\u00e9rification DNS uniquement. Un domaine sans enregistrement DNS peut tout de m\u00eame \u00eatre r\u00e9serv\u00e9. Confirmez sur un registrar avant d\u2019acheter."
          : "DNS check only. A domain without DNS records may still be registered. Confirm with a registrar before buying."}
      </p>

      {/* Feature 4: Registrar comparison drawer */}
      {registrarDrawer ? (
        <RegistrarDrawer
          domain={registrarDrawer.domain}
          tld={registrarDrawer.tld}
          onClose={function () { setRegistrarDrawer(null); }}
          lk={lk}
        />
      ) : null}
    </div>
  );
}
