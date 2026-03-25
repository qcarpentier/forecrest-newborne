import { useState, useRef, useEffect } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { HexColorPicker } from "react-colorful";
import {
  DownloadSimple, MagnifyingGlass, Globe,
  CheckCircle, XCircle, CircleNotch, QrCode, CaretDown,
  EnvelopeSimple, Phone, WifiHigh, Lock, TextT, AddressBook, LinkSimple, WarningCircle, Eye, EyeSlash,
  Copy, Image, X, ChatText, MapPin, CalendarPlus,
  ArrowsClockwise, BookmarkSimple, Trash, ArrowSquareOut, Star, ShieldCheck, Check,
  FileText, Export, Warning, Tag, Info,
} from "@phosphor-icons/react";
import { createPortal } from "react-dom";
import { PageLayout, Button, DataTable, Badge, SearchInput, FilterDropdown, ActionBtn, InfoTip, KpiCard, ButtonUtility, FinanceLink, ExportButtons } from "../components";
import { useT, useLang, useTheme, useGlossary } from "../context";

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

/* ── Domain name quality score (0-10) ── */

var KNOWN_BRANDS = ["google", "apple", "amazon", "facebook", "microsoft", "netflix", "spotify", "uber", "airbnb", "stripe", "shopify", "slack", "zoom", "tesla", "twitter"];
var HARD_CONSONANT_CLUSTERS = /[bcdfghjklmnpqrstvwxyz]{4,}/i;
var CONFUSING_SPELLINGS = /ph|ght|ough|ck|qu|xx|zz/i;

function scoreDomain(name, results) {
  var score = 0;
  var categories = [];
  if (!name) return { score: 0, max: 10, categories: [] };
  var lower = name.toLowerCase();

  /* ── Mémorabilité / Memorability ── */
  var memTips = [];
  if (name.length <= 8) { score += 2; memTips.push({ good: true, text: { fr: "Nom court et facile à retenir", en: "Short and easy to remember" } }); }
  else if (name.length <= 12) { score += 1; memTips.push({ good: true, text: { fr: "Longueur correcte", en: "Good length" } }); }
  else { memTips.push({ good: false, text: { fr: "Nom long, difficile à retenir et à taper", en: "Long name, hard to remember and type" } }); }
  if (!HARD_CONSONANT_CLUSTERS.test(lower)) { score += 1; memTips.push({ good: true, text: { fr: "Facile à prononcer à voix haute", en: "Easy to say out loud" } }); }
  else { memTips.push({ good: false, text: { fr: "Difficile à prononcer, vos clients auront du mal à en parler", en: "Hard to pronounce, customers will struggle to talk about it" } }); }
  categories.push({ label: { fr: "Mémorabilité", en: "Memorability" }, tips: memTips });

  /* ── Simplicité / Simplicity ── */
  var simpTips = [];
  if (lower.indexOf("-") === -1) { score += 1; simpTips.push({ good: true, text: { fr: "Pas de tiret, plus simple à communiquer à l'oral", en: "No hyphens, easier to communicate verbally" } }); }
  else { simpTips.push({ good: false, text: { fr: "Les tirets compliquent le bouche-à-oreille", en: "Hyphens make word-of-mouth harder" } }); }
  if (!/\d/.test(lower)) { score += 1; simpTips.push({ good: true, text: { fr: "Pas de chiffre, image plus professionnelle", en: "No numbers, more professional image" } }); }
  else { simpTips.push({ good: false, text: { fr: "Les chiffres créent de la confusion (1 ou l ? 0 ou O ?)", en: "Numbers cause confusion (1 or l? 0 or O?)" } }); }
  if (!CONFUSING_SPELLINGS.test(lower)) { score += 1; simpTips.push({ good: true, text: { fr: "Orthographe intuitive, pas d'ambiguïté", en: "Intuitive spelling, no ambiguity" } }); }
  else { simpTips.push({ good: false, text: { fr: "L'orthographe peut prêter à confusion (ph/f, ck/k...)", en: "Spelling may be confusing (ph/f, ck/k...)" } }); }
  categories.push({ label: { fr: "Simplicité", en: "Simplicity" }, tips: simpTips });

  /* ── Marque / Branding ── */
  var brandTips = [];
  var tooClose = false;
  KNOWN_BRANDS.forEach(function (b) {
    if (lower.indexOf(b) !== -1 || b.indexOf(lower) !== -1) tooClose = true;
  });
  if (!tooClose) { score += 1; brandTips.push({ good: true, text: { fr: "Nom unique, pas de confusion avec une marque connue", en: "Unique name, no confusion with a known brand" } }); }
  else { brandTips.push({ good: false, text: { fr: "Trop proche d'une marque existante, risque juridique", en: "Too close to an existing brand, legal risk" } }); }
  categories.push({ label: { fr: "Marque", en: "Branding" }, tips: brandTips });

  /* ── Disponibilité / Availability ── */
  var availTips = [];
  if (results && results[name + ".com"] === "available") { score += 1; availTips.push({ good: true, text: { fr: ".com disponible, renforce la crédibilité à l'international", en: ".com available, strengthens international credibility" } }); }
  else if (results && results[name + ".com"] === "taken") { availTips.push({ good: false, text: { fr: ".com déjà pris, risque de confusion avec un concurrent", en: ".com already taken, risk of confusion with a competitor" } }); }
  if (results && results[name + ".be"] === "available") { score += 1; availTips.push({ good: true, text: { fr: ".be disponible, idéal pour le marché belge", en: ".be available, ideal for the Belgian market" } }); }
  else if (results && results[name + ".be"] === "taken") { availTips.push({ good: false, text: { fr: ".be déjà pris, important si vous ciblez la Belgique", en: ".be already taken, important if you target Belgium" } }); }
  categories.push({ label: { fr: "Disponibilité", en: "Availability" }, tips: availTips });

  return { score: Math.min(score, 10), max: 10, categories: categories };
}

/* ── Registrar data for comparison drawer ── */

var REGISTRARS = [
  { name: "OVH", price: { ".be": 7, ".com": 10, ".eu": 7, ".net": 12, ".org": 11, ".io": 35, ".app": 14, ".dev": 12, ".tech": 5, ".co": 25, ".biz": 15, ".pro": 12, ".company": 10, ".store": 18, ".shop": 12 }, url: "https://www.ovh.com/fr/domaines/", color: "#000E9C" },
  { name: "Porkbun", price: { ".be": 6, ".com": 8, ".eu": 6, ".net": 10, ".org": 9, ".io": 28, ".app": 11, ".dev": 10, ".tech": 3, ".co": 20, ".biz": 10, ".pro": 8, ".store": 10, ".shop": 8 }, url: "https://porkbun.com/", color: "#F27099" },
  { name: "Namecheap", price: { ".be": 8, ".com": 9, ".eu": 8, ".net": 11, ".org": 10, ".io": 33, ".app": 13, ".dev": 11, ".tech": 4, ".co": 23, ".biz": 12, ".pro": 10, ".store": 14, ".shop": 10 }, url: "https://www.namecheap.com/domains/", color: "#DE5833" },
  { name: "GoDaddy", price: { ".be": 10, ".com": 12, ".eu": 10, ".net": 14, ".org": 13, ".io": 40, ".app": 18, ".dev": 15, ".tech": 7, ".co": 30, ".biz": 16, ".pro": 14, ".store": 20, ".shop": 14 }, url: "https://www.godaddy.com/fr-be/domaines", color: "#1BDBDB" },
  { name: "Gandi", price: { ".be": 9, ".com": 14, ".eu": 9, ".net": 15, ".org": 14, ".io": 39, ".app": 16, ".dev": 14, ".tech": 8, ".co": 28 }, url: "https://www.gandi.net/fr/domaines", color: "#87C540" },
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
              ? "Les prix sont approximatifs et peuvent varier. Consultez chaque site pour le tarif exact."
              : "Prices are approximate and may vary. Check each site for the exact rate."}
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
    return w.domain + ";" + w.tld + ";" + status + ";" + (price ? price + "€" : "") + ";" + date;
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
        {lk === "fr" ? "Disponible" : "Available"}
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
      header: lk === "fr" ? "Extensions" : "Extensions",
      size: 80,
      cell: function (info) {
        var v = info.getValue();
        return (
          <Badge color="gray" size="sm">{v + (lk === "fr" ? " extensions" : " extensions")}</Badge>
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
          <Badge color="gray">{info.getValue()}</Badge>
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

/* ── Trademark Tool ── */

var TM_WATCHLIST_KEY = "fc_trademark_watchlist";
var TM_CHECKLIST_KEY = "fc_trademark_checklist";
var TM_STATS_KEY = "fc_trademark_stats";
var TM_CLASSES_KEY = "fc_trademark_classes";

function loadTrademarkWatchlist() {
  try { return JSON.parse(localStorage.getItem(TM_WATCHLIST_KEY)) || []; }
  catch (e) { return []; }
}

function loadTrademarkChecklist() {
  try { return JSON.parse(localStorage.getItem(TM_CHECKLIST_KEY)) || {}; }
  catch (e) { return {}; }
}

function loadTrademarkStats() {
  try { return JSON.parse(localStorage.getItem(TM_STATS_KEY)) || { searched: 0, registriesClicked: 0 }; }
  catch (e) { return { searched: 0, registriesClicked: 0 }; }
}

function loadTrademarkClasses() {
  try { return JSON.parse(localStorage.getItem(TM_CLASSES_KEY)) || []; }
  catch (e) { return []; }
}

var TM_REGISTRIES = [
  {
    id: "boip",
    name: "BOIP",
    fullName: { fr: "Office Benelux de la Propri\u00e9t\u00e9 Intellectuelle", en: "Benelux Office for Intellectual Property" },
    region: { fr: "Benelux (BE, NL, LU)", en: "Benelux (BE, NL, LU)" },
    searchUrl: function (q) { return "https://www.boip.int/en/trademarks-register?q=" + encodeURIComponent(q); },
    registerUrl: "https://www.boip.int/en/entrepreneurs/trademarks/filing-a-trademark",
    cost: { fr: "~240 \u20ac (1 classe)", en: "~\u20ac240 (1 class)" },
    duration: { fr: "~4 mois", en: "~4 months" },
    validity: { fr: "10 ans, renouvelable", en: "10 years, renewable" },
    color: "#003DA5",
  },
  {
    id: "euipo",
    name: "EUIPO",
    fullName: { fr: "Office de l\u2019Union europ\u00e9enne pour la propri\u00e9t\u00e9 intellectuelle", en: "European Union Intellectual Property Office" },
    region: { fr: "Union europ\u00e9enne (27 pays)", en: "European Union (27 countries)" },
    searchUrl: function (q) { return "https://euipo.europa.eu/eSearch/#basic/" + encodeURIComponent(q); },
    registerUrl: "https://euipo.europa.eu/ohimportal/en/apply-now",
    cost: { fr: "~850 \u20ac (1 classe)", en: "~\u20ac850 (1 class)" },
    duration: { fr: "~5 mois", en: "~5 months" },
    validity: { fr: "10 ans, renouvelable", en: "10 years, renewable" },
    color: "#003399",
  },
  {
    id: "wipo",
    name: "OMPI / WIPO",
    fullName: { fr: "Organisation Mondiale de la Propri\u00e9t\u00e9 Intellectuelle", en: "World Intellectual Property Organization" },
    region: { fr: "International (130+ pays)", en: "International (130+ countries)" },
    searchUrl: function (q) { return "https://branddb.wipo.int/en?q=" + encodeURIComponent(q); },
    registerUrl: "https://www.wipo.int/madrid/en/",
    cost: { fr: "~900-2000 \u20ac", en: "~\u20ac900-2000" },
    duration: { fr: "~12-18 mois", en: "~12-18 months" },
    validity: { fr: "10 ans, renouvelable", en: "10 years, renewable" },
    color: "#0072BC",
  },
  {
    id: "inpi",
    name: "INPI",
    fullName: { fr: "Institut National de la Propri\u00e9t\u00e9 Industrielle (France)", en: "French National Industrial Property Institute" },
    region: { fr: "France uniquement", en: "France only" },
    searchUrl: function (q) { return "https://data.inpi.fr/recherche_avancee/marques?q=" + encodeURIComponent(q); },
    registerUrl: "https://www.inpi.fr/proteger-vos-creations/le-depot-de-marque",
    cost: { fr: "~190 \u20ac (1 classe)", en: "~\u20ac190 (1 class)" },
    duration: { fr: "~4 mois", en: "~4 months" },
    validity: { fr: "10 ans, renouvelable", en: "10 years, renewable" },
    color: "#E30613",
  },
];

var TM_CHECKLIST = [
  { id: "ck1", text: { fr: "V\u00e9rifiez que le nom n\u2019est pas d\u00e9j\u00e0 utilis\u00e9 par un concurrent dans votre secteur", en: "Check that the name is not already used by a competitor in your sector" } },
  { id: "ck2", text: { fr: "Choisissez les classes de Nice qui correspondent \u00e0 vos produits/services", en: "Choose the Nice classes that match your products/services" } },
  { id: "ck3", text: { fr: "Le nom doit \u00eatre distinctif (pas un mot courant ou descriptif)", en: "The name must be distinctive (not a common or descriptive word)" } },
  { id: "ck4", text: { fr: "V\u00e9rifiez qu\u2019il n\u2019y a pas de confusion possible avec des marques existantes", en: "Check there is no possible confusion with existing trademarks" } },
  { id: "ck5", text: { fr: "Pr\u00e9parez un logo ou design si vous souhaitez prot\u00e9ger l\u2019aspect visuel", en: "Prepare a logo or design if you want to protect the visual aspect" } },
  { id: "ck6", text: { fr: "Consultez un avocat sp\u00e9cialis\u00e9 en propri\u00e9t\u00e9 intellectuelle pour les cas complexes", en: "Consult an IP attorney for complex cases" } },
];

var PH_TRADEMARKS = ["maboite", "forecrest", "monproduit", "myapp", "startuplab", "novabrand"];

/* ── Nice Classification (12 most common) ── */
var NICE_CLASSES = [
  { id: 1, label: { fr: "Produits chimiques", en: "Chemical products" } },
  { id: 2, label: { fr: "Peintures, vernis, laques", en: "Paints, varnishes, lacquers" } },
  { id: 3, label: { fr: "Cosm\u00e9tiques, produits de nettoyage", en: "Cosmetics, cleaning products" } },
  { id: 4, label: { fr: "Huiles et graisses industrielles", en: "Industrial oils and greases" } },
  { id: 5, label: { fr: "Produits pharmaceutiques", en: "Pharmaceutical products" } },
  { id: 6, label: { fr: "M\u00e9taux communs et alliages", en: "Common metals and alloys" } },
  { id: 7, label: { fr: "Machines et machines-outils", en: "Machines and machine tools" } },
  { id: 8, label: { fr: "Outils et instruments \u00e0 main", en: "Hand tools and instruments" } },
  { id: 9, label: { fr: "Appareils scientifiques, logiciels", en: "Scientific apparatus, software" } },
  { id: 10, label: { fr: "Appareils m\u00e9dicaux et chirurgicaux", en: "Medical and surgical apparatus" } },
  { id: 11, label: { fr: "Appareils d'\u00e9clairage et chauffage", en: "Lighting and heating apparatus" } },
  { id: 12, label: { fr: "V\u00e9hicules", en: "Vehicles" } },
  { id: 13, label: { fr: "Armes \u00e0 feu, munitions", en: "Firearms, ammunition" } },
  { id: 14, label: { fr: "M\u00e9taux pr\u00e9cieux, joaillerie", en: "Precious metals, jewelry" } },
  { id: 15, label: { fr: "Instruments de musique", en: "Musical instruments" } },
  { id: 16, label: { fr: "Papier, imprim\u00e9s, articles de bureau", en: "Paper, printed matter, stationery" } },
  { id: 17, label: { fr: "Caoutchouc, mati\u00e8res plastiques", en: "Rubber, plastics" } },
  { id: 18, label: { fr: "Cuir, bagages, parapluies", en: "Leather, luggage, umbrellas" } },
  { id: 19, label: { fr: "Mat\u00e9riaux de construction", en: "Building materials" } },
  { id: 20, label: { fr: "Meubles, miroirs, cadres", en: "Furniture, mirrors, frames" } },
  { id: 21, label: { fr: "Ustensiles de m\u00e9nage", en: "Household utensils" } },
  { id: 22, label: { fr: "Cordes, filets, tentes", en: "Ropes, nets, tents" } },
  { id: 23, label: { fr: "Fils textiles", en: "Textile yarns" } },
  { id: 24, label: { fr: "Tissus et couvertures", en: "Textiles and covers" } },
  { id: 25, label: { fr: "V\u00eatements, chaussures, chapellerie", en: "Clothing, footwear, headgear" } },
  { id: 26, label: { fr: "Dentelles, broderies, rubans", en: "Lace, embroidery, ribbons" } },
  { id: 27, label: { fr: "Tapis, rev\u00eatements de sol", en: "Carpets, floor coverings" } },
  { id: 28, label: { fr: "Jeux, jouets, articles de sport", en: "Games, toys, sporting goods" } },
  { id: 29, label: { fr: "Viande, poisson, fruits conserv\u00e9s", en: "Meat, fish, preserved fruits" } },
  { id: 30, label: { fr: "Caf\u00e9, th\u00e9, p\u00e2tisserie, \u00e9pices", en: "Coffee, tea, pastry, spices" } },
  { id: 31, label: { fr: "Produits agricoles, fruits frais", en: "Agricultural products, fresh fruits" } },
  { id: 32, label: { fr: "Bi\u00e8res, boissons non alcoolis\u00e9es", en: "Beers, non-alcoholic beverages" } },
  { id: 33, label: { fr: "Boissons alcooliques (sauf bi\u00e8res)", en: "Alcoholic beverages (except beers)" } },
  { id: 34, label: { fr: "Tabac, articles pour fumeurs", en: "Tobacco, smokers' articles" } },
  { id: 35, label: { fr: "Publicit\u00e9, gestion des affaires", en: "Advertising, business management" } },
  { id: 36, label: { fr: "Assurances, affaires financi\u00e8res", en: "Insurance, financial affairs" } },
  { id: 37, label: { fr: "Construction, r\u00e9paration, installation", en: "Construction, repair, installation" } },
  { id: 38, label: { fr: "T\u00e9l\u00e9communications", en: "Telecommunications" } },
  { id: 39, label: { fr: "Transport, emballage, stockage", en: "Transport, packaging, storage" } },
  { id: 40, label: { fr: "Traitement de mat\u00e9riaux", en: "Material treatment" } },
  { id: 41, label: { fr: "\u00c9ducation, divertissement, sport", en: "Education, entertainment, sport" } },
  { id: 42, label: { fr: "Services scientifiques, SaaS", en: "Scientific services, SaaS" } },
  { id: 43, label: { fr: "Restauration, h\u00e9bergement", en: "Restaurant, accommodation" } },
  { id: 44, label: { fr: "Services m\u00e9dicaux, soins de beaut\u00e9", en: "Medical services, beauty care" } },
  { id: 45, label: { fr: "Services juridiques, s\u00e9curit\u00e9", en: "Legal services, security" } },
];

/* ── Budget Estimator base costs ── */
var TM_BUDGET = {
  boip: { baseCost: 240, extraClass: 40, label: "BOIP" },
  euipo: { baseCost: 850, extraClass: 150, label: "EUIPO" },
  wipo: { baseCost: 900, extraClass: 100, label: "OMPI / WIPO" },
  inpi: { baseCost: 190, extraClass: 40, label: "INPI" },
};

/* ── Deposit Timeline steps ── */
var TIMELINE_STEPS = [
  { label: { fr: "Recherche", en: "Search" }, duration: { fr: "1-2 sem.", en: "1-2 wk" }, icon: MagnifyingGlass },
  { label: { fr: "D\u00e9p\u00f4t", en: "Filing" }, duration: { fr: "1 jour", en: "1 day" }, icon: FileText },
  { label: { fr: "Examen", en: "Examination" }, duration: { fr: "1-3 mois", en: "1-3 mo" }, icon: Eye },
  { label: { fr: "Publication", en: "Publication" }, duration: { fr: "1 mois", en: "1 mo" }, icon: Globe },
  { label: { fr: "Opposition", en: "Opposition" }, duration: { fr: "2 mois", en: "2 mo" }, icon: ShieldCheck },
  { label: { fr: "Enregistrement", en: "Registration" }, duration: { fr: "\u2713", en: "\u2713" }, icon: CheckCircle },
];

/* ── Name Quality Alert helpers ── */
var GENERIC_WORDS = ["consulting", "services", "quality", "best", "pro", "expert", "solutions", "group", "agency", "digital", "global", "tech", "innovation", "premium", "elite", "conseil", "agence", "qualit\u00e9", "meilleur"];
var PROTECTED_TERMS = ["olympic", "olympique", "red cross", "croix-rouge", "croix rouge", "swiss", "suisse", "united nations", "nations unies", "interpol", "unesco"];

function getNameAlerts(trimmedName, lk) {
  var alerts = [];
  if (!trimmedName) return alerts;
  var lower = trimmedName.toLowerCase();
  if (trimmedName.length < 3) {
    alerts.push({ type: "error", text: lk === "fr" ? "Nom trop court (moins de 3 caract\u00e8res) \u2014 risque de refus" : "Name too short (less than 3 characters) \u2014 risk of rejection" });
  }
  GENERIC_WORDS.forEach(function (w) {
    if (lower === w || lower.indexOf(w) !== -1) {
      alerts.push({ type: "warning", text: lk === "fr" ? "Nom potentiellement trop g\u00e9n\u00e9rique (\u00ab\u00a0" + w + "\u00a0\u00bb) \u2014 manque de distinctivit\u00e9" : "Potentially too generic (\"" + w + "\") \u2014 lacks distinctiveness" });
    }
  });
  PROTECTED_TERMS.forEach(function (w) {
    if (lower.indexOf(w) !== -1) {
      alerts.push({ type: "error", text: lk === "fr" ? "Terme prot\u00e9g\u00e9 d\u00e9tect\u00e9 (\u00ab\u00a0" + w + "\u00a0\u00bb) \u2014 d\u00e9p\u00f4t probablement refus\u00e9" : "Protected term detected (\"" + w + "\") \u2014 filing likely rejected" });
    }
  });
  return alerts;
}

function TrademarkTool({ lk }) {
  var [name, setName] = useState("");
  var [searched, setSearched] = useState(false);
  var [watchlist, setWatchlist] = useState(loadTrademarkWatchlist);
  var [checkedItems, setCheckedItems] = useState(loadTrademarkChecklist);
  var [stats, setStats] = useState(loadTrademarkStats);
  var [activeTab, setActiveTab] = useState("saved");
  var [savedFeedback, setSavedFeedback] = useState({});
  var [selectedClasses, setSelectedClasses] = useState(loadTrademarkClasses);
  var [niceDropdownOpen, setNiceDropdownOpen] = useState(false);
  var [selectedRegistries, setSelectedRegistries] = useState({ boip: true });
  var inputRef = useRef(null);
  var glossary = useGlossary();

  /* Typewriter animated placeholder */
  var [phIdx, setPhIdx] = useState(0);
  var [phChar, setPhChar] = useState(0);
  var [phDeleting, setPhDeleting] = useState(false);
  useEffect(function () {
    if (name) return;
    var current = PH_TRADEMARKS[phIdx % PH_TRADEMARKS.length];
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
        setPhIdx(function (prev) { return (prev + 1) % PH_TRADEMARKS.length; });
      }
    }, delay);
    return function () { clearTimeout(timer); };
  }, [name, phIdx, phChar, phDeleting]);
  var phText = name ? "" : PH_TRADEMARKS[phIdx % PH_TRADEMARKS.length].substring(0, phChar);

  /* Persist watchlist */
  useEffect(function () {
    try { localStorage.setItem(TM_WATCHLIST_KEY, JSON.stringify(watchlist)); } catch (e) { /* ignore */ }
  }, [watchlist]);

  /* Persist checklist */
  useEffect(function () {
    try { localStorage.setItem(TM_CHECKLIST_KEY, JSON.stringify(checkedItems)); } catch (e) { /* ignore */ }
  }, [checkedItems]);

  /* Persist stats */
  useEffect(function () {
    try { localStorage.setItem(TM_STATS_KEY, JSON.stringify(stats)); } catch (e) { /* ignore */ }
  }, [stats]);

  /* Persist Nice classes */
  useEffect(function () {
    try { localStorage.setItem(TM_CLASSES_KEY, JSON.stringify(selectedClasses)); } catch (e) { /* ignore */ }
  }, [selectedClasses]);

  function handleSearch() {
    var trimmed = name.trim();
    if (!trimmed) return;
    setSearched(true);
    setStats(function (prev) { return Object.assign({}, prev, { searched: prev.searched + 1 }); });
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSearch();
  }

  function handleClear() {
    setName("");
    setSearched(false);
    if (inputRef.current) inputRef.current.focus();
  }

  function handleRegistrySearch(registry) {
    var url = registry.searchUrl(name.trim());
    window.open(url, "_blank", "noopener,noreferrer");
    setStats(function (prev) { return Object.assign({}, prev, { registriesClicked: prev.registriesClicked + 1 }); });
    setSelectedRegistries(function (prev) { var n = Object.assign({}, prev); n[registry.id] = true; return n; });
  }

  function handleSaveToWatchlist(registry) {
    var trimmed = name.trim();
    if (!trimmed) return;
    var key = trimmed + "_" + registry.id;
    var exists = false;
    watchlist.forEach(function (w) {
      if (w.name === trimmed && w.registryId === registry.id) exists = true;
    });
    if (exists) return;
    setWatchlist(function (prev) {
      return prev.concat([{
        id: generateId(),
        name: trimmed,
        registryId: registry.id,
        registryName: registry.name,
        date: Date.now(),
      }]);
    });
    setSavedFeedback(function (prev) {
      var next = Object.assign({}, prev);
      next[key] = true;
      return next;
    });
    setTimeout(function () {
      setSavedFeedback(function (prev) {
        var next = Object.assign({}, prev);
        delete next[key];
        return next;
      });
    }, 1500);
  }

  function toggleCheck(id) {
    setCheckedItems(function (prev) {
      var next = Object.assign({}, prev);
      next[id] = !prev[id];
      return next;
    });
  }

  function removeWatchlistItem(id) {
    setWatchlist(function (prev) { return prev.filter(function (w) { return w.id !== id; }); });
  }

  function bulkDeleteWatchlist(ids) {
    var idSet = {};
    ids.forEach(function (id) { idSet[id] = true; });
    setWatchlist(function (prev) {
      return prev.filter(function (w) { return !idSet[String(w.id)]; });
    });
  }

  var trimmedName = name.trim();
  var checklistDone = 0;
  TM_CHECKLIST.forEach(function (item) { if (checkedItems[item.id]) checklistDone++; });

  /* Name quality alerts (Feature 5) */
  var nameAlerts = getNameAlerts(trimmedName, lk);

  /* Nice class toggle */
  function toggleClass(classId) {
    setSelectedClasses(function (prev) {
      var idx = prev.indexOf(classId);
      if (idx !== -1) { var n = prev.slice(); n.splice(idx, 1); return n; }
      return prev.concat([classId]);
    });
  }


  /* Budget computation (Feature 2) */
  var budgetRows = [];
  var budgetTotal = 0;
  var extraCount = selectedClasses.length > 1 ? selectedClasses.length - 1 : 0;
  Object.keys(selectedRegistries).forEach(function (regId) {
    if (!selectedRegistries[regId]) return;
    var b = TM_BUDGET[regId];
    if (!b) return;
    var cost = b.baseCost + (extraCount * b.extraClass);
    budgetRows.push({ id: regId, label: b.label, baseCost: b.baseCost, extraClass: b.extraClass, extraCount: extraCount, total: cost });
    budgetTotal += cost;
  });

  /* Export PDF (Feature 4) */
  function handleExportPdf() {
    var html = "<!DOCTYPE html><html><head><meta charset='utf-8'/><title>" + (lk === "fr" ? "R\u00e9sum\u00e9 Marque" : "Trademark Summary") + "</title>";
    html += "<style>body{font-family:'DM Sans',system-ui,sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#0E0E0D}h1{font-family:'Bricolage Grotesque',sans-serif;font-size:22px;margin-bottom:8px}h2{font-size:16px;color:#555;margin-top:24px;border-bottom:1px solid #ddd;padding-bottom:6px}table{width:100%;border-collapse:collapse;margin-top:8px}td,th{text-align:left;padding:6px 10px;border-bottom:1px solid #eee;font-size:13px}th{font-weight:600;color:#555}.chip{display:inline-block;padding:2px 8px;border-radius:4px;background:#f0f0f0;font-size:12px;margin:2px}.alert-warn{color:#b45309;font-size:12px}.alert-err{color:#dc2626;font-size:12px}.check{color:#16a34a}.uncheck{color:#999}</style></head><body>";
    html += "<h1>" + (lk === "fr" ? "R\u00e9sum\u00e9 \u2014 V\u00e9rification de marque" : "Summary \u2014 Trademark Check") + "</h1>";
    html += "<p style='color:#888;font-size:12px'>" + new Date().toLocaleDateString(lk === "fr" ? "fr-BE" : "en-GB") + " \u2014 Forecrest</p>";
    if (trimmedName) {
      html += "<h2>" + (lk === "fr" ? "Nom recherch\u00e9" : "Name searched") + "</h2>";
      html += "<p style='font-size:18px;font-weight:700'>" + trimmedName + "</p>";
      if (nameAlerts.length > 0) {
        nameAlerts.forEach(function (a) {
          html += "<p class='" + (a.type === "error" ? "alert-err" : "alert-warn") + "'>\u26a0 " + a.text + "</p>";
        });
      }
    }
    if (selectedClasses.length > 0) {
      html += "<h2>" + (lk === "fr" ? "Classes de Nice s\u00e9lectionn\u00e9es" : "Selected Nice Classes") + "</h2>";
      selectedClasses.forEach(function (cid) {
        NICE_CLASSES.forEach(function (c) {
          if (c.id === cid) html += "<span class='chip'>" + c.id + " \u2014 " + c.label[lk] + "</span> ";
        });
      });
    }
    if (budgetRows.length > 0) {
      html += "<h2>" + (lk === "fr" ? "Estimation du budget" : "Budget Estimate") + "</h2>";
      html += "<table><tr><th>" + (lk === "fr" ? "Registre" : "Registry") + "</th><th>" + (lk === "fr" ? "Co\u00fbt de base" : "Base cost") + "</th><th>" + (lk === "fr" ? "Classes suppl." : "Extra classes") + "</th><th>Total</th></tr>";
      budgetRows.forEach(function (r) {
        html += "<tr><td>" + r.label + "</td><td>" + r.baseCost + " \u20ac</td><td>+" + (r.extraCount * r.extraClass) + " \u20ac</td><td><strong>" + r.total + " \u20ac</strong></td></tr>";
      });
      html += "<tr><td colspan='3' style='text-align:right;font-weight:700'>" + (lk === "fr" ? "Total g\u00e9n\u00e9ral" : "Grand total") + "</td><td style='font-weight:700'>" + budgetTotal + " \u20ac</td></tr></table>";
    }
    html += "<h2>" + (lk === "fr" ? "Checklist avant d\u00e9p\u00f4t" : "Pre-registration checklist") + " (" + checklistDone + "/" + TM_CHECKLIST.length + ")</h2>";
    TM_CHECKLIST.forEach(function (item) {
      var done = !!checkedItems[item.id];
      html += "<p>" + (done ? "<span class='check'>\u2713</span>" : "<span class='uncheck'>\u2717</span>") + " " + item.text[lk] + "</p>";
    });
    html += "</body></html>";
    var win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  }

  /* Watchlist DataTable columns */
  var wlColumns = [
    {
      id: "name",
      accessorKey: "name",
      header: lk === "fr" ? "Nom" : "Name",
      cell: function (info) {
        return (
          <span style={{
            fontSize: 13, fontWeight: 600,
            color: "var(--text-primary)",
          }}>
            {info.getValue()}
          </span>
        );
      },
    },
    {
      id: "registry",
      accessorKey: "registryName",
      header: lk === "fr" ? "Registre" : "Registry",
      size: 120,
      cell: function (info) {
        return <Badge color="gray">{info.getValue()}</Badge>;
      },
    },
    {
      id: "date",
      accessorKey: "date",
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
      id: "actions",
      header: "",
      size: 80,
      cell: function (info) {
        var row = info.row.original;
        var registry = null;
        TM_REGISTRIES.forEach(function (r) { if (r.id === row.registryId) registry = r; });
        return (
          <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
            {registry ? (
              <ButtonUtility
                icon={<ArrowSquareOut size={14} weight="bold" />}
                title={lk === "fr" ? "Rechercher" : "Search"}
                onClick={function () {
                  window.open(registry.searchUrl(row.name), "_blank", "noopener,noreferrer");
                }}
                size="sm"
              />
            ) : null}
            <ButtonUtility
              icon={<Trash size={14} weight="bold" />}
              title={lk === "fr" ? "Supprimer" : "Delete"}
              onClick={function () { removeWatchlistItem(row.id); }}
              size="sm"
              variant="danger"
            />
          </div>
        );
      },
    },
  ];

  /* Filtered watchlist for search + registry filter */
  var [wlSearch, setWlSearch] = useState("");
  var [wlRegistryFilter, setWlRegistryFilter] = useState("all");
  var filteredWatchlist = watchlist;
  if (wlRegistryFilter !== "all") {
    filteredWatchlist = filteredWatchlist.filter(function (w) { return w.registryId === wlRegistryFilter; });
  }
  if (wlSearch.trim()) {
    var wlQ = wlSearch.trim().toLowerCase();
    filteredWatchlist = filteredWatchlist.filter(function (w) {
      return w.name.toLowerCase().indexOf(wlQ) !== -1 || w.registryName.toLowerCase().indexOf(wlQ) !== -1;
    });
  }
  var wlRegistryOptions = [{ value: "all", label: lk === "fr" ? "Tous les registres" : "All registries" }];
  TM_REGISTRIES.forEach(function (r) { wlRegistryOptions.push({ value: r.id, label: r.name }); });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>

      {/* KPI cards — full width, 3 columns */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "var(--sp-4)",
      }}>
        <KpiCard
          label={lk === "fr" ? "Noms recherch\u00e9s" : "Names searched"}
          value={String(stats.searched)}
        />
        <KpiCard
          label={lk === "fr" ? "Sauvegard\u00e9s" : "Saved"}
          value={String(watchlist.length)}
        />
        <KpiCard
          label={lk === "fr" ? "Registres consult\u00e9s" : "Registries checked"}
          value={String(stats.registriesClicked)}
        />
      </div>

      {/* ── 2-column layout: left content + right sticky sidebar ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 360px",
        gap: "var(--sp-4)",
        marginBottom: "var(--gap-lg)",
        alignItems: "start",
      }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>

          {/* Search card */}
          <div style={CARD}>
            <h3 style={Object.assign({}, SECTION_LABEL, { margin: 0 })}>
              {lk === "fr" ? "Recherche de marque" : "Trademark search"}
            </h3>
            <div>
              <div style={FIELD_LABEL}>{lk === "fr" ? "Nom de la marque" : "Brand name"}</div>
              <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={function (e) { setName(e.target.value); }}
                    onKeyDown={handleKeyDown}
                    placeholder={phText || "..."}
                    style={Object.assign({}, INPUT_STYLE, { width: "100%", paddingRight: name ? 36 : "var(--sp-3)" })}
                  />
                  {name ? (
                    <button type="button" onClick={handleClear}
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
                  onClick={handleSearch}
                  isDisabled={!trimmedName}
                  iconLeading={<MagnifyingGlass size={16} weight="bold" />}
                >
                  {lk === "fr" ? "Rechercher" : "Search"}
                </Button>
              </div>

              {/* Name Quality Alerts */}
              {trimmedName && nameAlerts.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                  {nameAlerts.map(function (alert, i) {
                    var isErr = alert.type === "error";
                    return (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "6px 10px",
                        borderRadius: "var(--r-md)",
                        background: isErr ? "var(--color-error-bg, rgba(220,38,38,0.06))" : "var(--color-warning-bg, rgba(180,83,9,0.06))",
                        border: "1px solid " + (isErr ? "var(--color-error-border, rgba(220,38,38,0.15))" : "var(--color-warning-border, rgba(180,83,9,0.15))"),
                      }}>
                        <Warning size={14} weight="fill" color={isErr ? "var(--color-error)" : "var(--color-warning)"} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: isErr ? "var(--color-error)" : "var(--color-warning)", lineHeight: 1.4 }}>
                          {alert.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          {/* Registry cards — 2x2 grid (only when searched) */}
          {searched && trimmedName ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--sp-4)",
            }}>
              {TM_REGISTRIES.map(function (registry) {
                var feedbackKey = trimmedName + "_" + registry.id;
                var isSaved = savedFeedback[feedbackKey] || false;
                var alreadySaved = false;
                watchlist.forEach(function (w) {
                  if (w.name === trimmedName && w.registryId === registry.id) alreadySaved = true;
                });
                return (
                  <div key={registry.id} style={{
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-lg)",
                    background: "var(--bg-card)",
                    padding: "var(--sp-4)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--sp-3)",
                  }}>

                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--sp-2)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                        <input type="checkbox"
                          checked={!!selectedRegistries[registry.id]}
                          onChange={function () {
                            setSelectedRegistries(function (prev) {
                              var n = Object.assign({}, prev);
                              n[registry.id] = !n[registry.id];
                              return n;
                            });
                          }}
                          style={{ accentColor: "var(--brand)", width: 16, height: 16, cursor: "pointer" }}
                        />
                        <span style={{
                          fontSize: 16, fontWeight: 800,
                          fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
                          color: "var(--text-primary)",
                        }}>
                          {registry.name}
                        </span>
                        <Badge color="gray" size="sm">{registry.region[lk]}</Badge>
                      </div>
                    </div>

                    {/* Full name */}
                    <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
                      {registry.fullName[lk]}
                    </div>

                    {/* Info rows */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {[
                        { label: lk === "fr" ? "Co\u00fbt" : "Cost", value: registry.cost[lk] },
                        { label: lk === "fr" ? "D\u00e9lai" : "Duration", value: registry.duration[lk] },
                        { label: lk === "fr" ? "Validit\u00e9" : "Validity", value: registry.validity[lk] },
                      ].map(function (row) {
                        return (
                          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{row.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{row.value}</span>
                          </div>
                        );
                      })}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{lk === "fr" ? "Site" : "Website"}</span>
                        <a
                          href={registry.registerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 11, color: "var(--brand)", textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}
                          onMouseEnter={function (e) { e.currentTarget.style.textDecoration = "underline"; }}
                          onMouseLeave={function (e) { e.currentTarget.style.textDecoration = "none"; }}
                        >
                          <ArrowSquareOut size={10} weight="bold" />
                          {registry.name}
                        </a>
                      </div>
                    </div>

                    {/* Actions — grid 1fr 1fr */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-2)", marginTop: "auto" }}>
                      <Button
                        color="primary"
                        size="lg"
                        onClick={function () { handleRegistrySearch(registry); }}
                        iconLeading={<MagnifyingGlass size={14} weight="bold" />}
                        sx={{ height: 36 }}
                      >
                        {lk === "fr" ? "Rechercher" : "Search"}
                      </Button>
                      <button type="button" onClick={function () { handleSaveToWatchlist(registry); }}
                        disabled={alreadySaved}
                        style={{
                          height: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          border: "1px solid " + (isSaved || alreadySaved ? "var(--color-success-border, var(--color-success))" : "var(--border)"),
                          borderRadius: "var(--r-md)",
                          background: isSaved || alreadySaved ? "var(--color-success-bg, rgba(22,163,74,0.08))" : "var(--bg-accordion)",
                          color: isSaved || alreadySaved ? "var(--color-success)" : "var(--text-secondary)",
                          fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: alreadySaved ? "default" : "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {isSaved || alreadySaved
                          ? <><CheckCircle size={14} weight="fill" />{lk === "fr" ? "Sauvegard\u00e9 !" : "Saved!"}</>
                          : <><BookmarkSimple size={14} weight="bold" />{lk === "fr" ? "Sauvegarder" : "Save"}</>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Empty state when no search has been done */}
          {!searched ? (
            <div style={{
              textAlign: "center", padding: "var(--sp-6)",
              color: "var(--text-faint)",
              border: "1px dashed var(--border)",
              borderRadius: "var(--r-lg)",
              background: "var(--bg-card)",
            }}>
              <MagnifyingGlass size={24} weight="duotone" color="var(--text-faint)" style={{ marginBottom: "var(--sp-2)" }} />
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {lk === "fr"
                  ? "Entrez un nom de marque et lancez la recherche pour voir les registres disponibles."
                  : "Enter a brand name and search to see available registries."}
              </div>
            </div>
          ) : null}

          {/* ── Filing Process Timeline ── */}
          <div style={CARD}>
            <h3 style={Object.assign({}, SECTION_LABEL, { margin: "0 0 var(--sp-3)" })}>
              {lk === "fr" ? "Processus de d\u00e9p\u00f4t" : "Filing Process"}
            </h3>
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              {TIMELINE_STEPS.map(function (step, idx) {
                var StepIcon = step.icon;
                var isLast = idx === TIMELINE_STEPS.length - 1;
                var stepColor = isLast ? "var(--color-success)" : "var(--brand)";
                var stepBg = isLast ? "var(--color-success-bg)" : "var(--brand-bg)";
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "flex-start", flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto" }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: stepBg, border: "2px solid " + stepColor,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <StepIcon size={14} weight="bold" color={stepColor} />
                      </div>
                      <div style={{ textAlign: "center", marginTop: 6, maxWidth: 90 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.2 }}>{step.label[lk]}</div>
                        <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>{step.duration[lk]}</div>
                      </div>
                    </div>
                    {!isLast ? (
                      <div style={{ flex: 1, height: 2, background: "var(--border)", marginTop: 17, marginLeft: 6, marginRight: 6 }} />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN — sticky sidebar card ── */}
        <div style={{
          position: "sticky",
          top: 80,
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          background: "var(--bg-card)",
          padding: "var(--sp-5)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--sp-4)",
        }}>

          {/* Nice Classification — multi-select dropdown */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-2)" }}>
              <h3 style={Object.assign({}, SECTION_LABEL, { margin: 0 })}>
                {lk === "fr" ? "Classes de Nice" : "Nice Classes"}
              </h3>
              <button type="button" onClick={function () { glossary.open("nice_classes"); }}
                style={{
                  width: 16, height: 16, borderRadius: "50%", border: "1px solid var(--border)",
                  background: "var(--bg-accordion)", cursor: "pointer", padding: 0,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
                title={lk === "fr" ? "En savoir plus" : "Learn more"}
              >
                <Info size={9} weight="bold" color="var(--text-faint)" />
              </button>
            </div>
            {/* Trigger button */}
            <button type="button" onClick={function () { setNiceDropdownOpen(function (v) { return !v; }); }}
              style={{
                width: "100%", height: 40, padding: "0 var(--sp-3)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                border: "1px solid var(--border)", borderRadius: "var(--r-md)",
                background: "var(--input-bg)", color: "var(--text-primary)",
                fontSize: 13, fontFamily: "inherit", cursor: "pointer",
              }}
            >
              <span style={{ color: selectedClasses.length > 0 ? "var(--text-primary)" : "var(--text-faint)" }}>
                {selectedClasses.length > 0
                  ? selectedClasses.length + (lk === "fr" ? " classe" + (selectedClasses.length > 1 ? "s" : "") + " sélectionnée" + (selectedClasses.length > 1 ? "s" : "") : " class" + (selectedClasses.length > 1 ? "es" : "") + " selected")
                  : (lk === "fr" ? "Sélectionner les classes..." : "Select classes...")}
              </span>
              <CaretDown size={14} color="var(--text-muted)" style={{ transform: niceDropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
            </button>
            {/* Dropdown panel */}
            {niceDropdownOpen ? (
              <div style={{
                marginTop: 4, border: "1px solid var(--border)", borderRadius: "var(--r-md)",
                background: "var(--bg-card)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                maxHeight: 240, overflowY: "auto", padding: 4,
                scrollbarWidth: "thin", scrollbarColor: "var(--border-strong) transparent",
              }}>
                {NICE_CLASSES.map(function (cls) {
                  var isSelected = selectedClasses.indexOf(cls.id) !== -1;
                  return (
                    <button key={cls.id} type="button" onClick={function () { toggleClass(cls.id); }}
                      style={{
                        display: "flex", alignItems: "center", gap: "var(--sp-2)", width: "100%",
                        padding: "8px var(--sp-3)", borderRadius: "var(--r-sm)",
                        border: "none", background: isSelected ? "var(--brand-bg)" : "transparent",
                        cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={function (e) { if (!isSelected) e.currentTarget.style.background = "var(--bg-hover)"; }}
                      onMouseLeave={function (e) { e.currentTarget.style.background = isSelected ? "var(--brand-bg)" : "transparent"; }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                        border: isSelected ? "none" : "2px solid var(--border)",
                        background: isSelected ? "var(--brand)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {isSelected ? <Check size={11} weight="bold" color="white" /> : null}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-faint)", fontFamily: "ui-monospace, monospace", minWidth: 20 }}>{cls.id}</span>
                      <span style={{ fontSize: 12, color: isSelected ? "var(--brand)" : "var(--text-secondary)" }}>{cls.label[lk]}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
            {/* Selected chips */}
            {selectedClasses.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: "var(--sp-2)" }}>
                {selectedClasses.map(function (cid) {
                  var cls = null;
                  NICE_CLASSES.forEach(function (c) { if (c.id === cid) cls = c; });
                  if (!cls) return null;
                  return (
                    <span key={cid} style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "2px 8px", fontSize: 11, fontWeight: 500,
                      borderRadius: "var(--r-full)", background: "var(--brand-bg)",
                      color: "var(--brand)", border: "1px solid var(--brand-border)",
                    }}>
                      {cls.id}
                      <button type="button" onClick={function () { toggleClass(cid); }}
                        style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
                        <X size={10} weight="bold" color="var(--brand)" />
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* ── Divider: Budget Estimator ── */}
          <div style={{ borderTop: "1px solid var(--border-light, var(--border))", margin: "var(--sp-3) 0", padding: "var(--sp-3) 0 0" }}>
            <h3 style={Object.assign({}, SECTION_LABEL, { margin: "0 0 var(--sp-3)" })}>
              {lk === "fr" ? "Estimation du budget" : "Budget Estimate"}
            </h3>
            {budgetRows.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {budgetRows.map(function (row) {
                  return (
                    <div key={row.id} style={{
                      display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--border-light, var(--border))",
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{row.label}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                          {"Base : " + row.baseCost + " €"}
                          {row.extraCount > 0 ? " + " + row.extraCount + " × " + row.extraClass + " €" : ""}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 14, fontWeight: 700,
                        fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
                        color: "var(--text-primary)",
                      }}>
                        {row.total + " €"}
                      </span>
                    </div>
                  );
                })}
                {/* Total row */}
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center",
                  padding: "10px 0 0",
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                    {lk === "fr" ? "Total estim\u00e9" : "Estimated total"}
                  </span>
                  <span style={{
                    fontSize: 18, fontWeight: 800,
                    fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
                    color: "var(--brand)",
                  }}>
                    {budgetTotal + " €"}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "var(--text-faint)", padding: "var(--sp-2) 0" }}>
                {lk === "fr"
                  ? "Cochez un registre et s\u00e9lectionnez au moins une classe de Nice pour voir l'estimation."
                  : "Check a registry and select at least one Nice class to see the estimate."}
              </div>
            )}
          </div>

        </div>
      </div>



      {/* ── DataTable — full width ── */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border-light)", marginBottom: "var(--sp-4)" }}>
        {["saved", "history"].map(function (tabKey) {
          var isActive = activeTab === tabKey;
          var tabLabels = { saved: lk === "fr" ? "Sauvegard\u00e9s" : "Saved", history: lk === "fr" ? "Historique" : "History" };
          var tabCounts = { saved: watchlist.length, history: stats.searched || 0 };
          return (
            <button key={tabKey} type="button" onClick={function () { setActiveTab(tabKey); }}
              style={{
                padding: "var(--sp-2) var(--sp-4)", border: "none", background: "none",
                fontSize: 13, fontWeight: isActive ? 600 : 400, cursor: "pointer", fontFamily: "inherit",
                color: isActive ? "var(--brand)" : "var(--text-muted)",
                borderBottom: isActive ? "2px solid var(--brand)" : "2px solid transparent",
                marginBottom: -2, transition: "color 0.15s, border-color 0.15s",
                display: "flex", alignItems: "center", gap: 6,
              }}>
              {tabLabels[tabKey]}
              {tabCounts[tabKey] > 0 ? (
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  minWidth: 18, height: 18, padding: "0 5px",
                  borderRadius: "var(--r-full)",
                  background: isActive ? "var(--brand-bg)" : "var(--bg-accordion)",
                  color: isActive ? "var(--brand)" : "var(--text-faint)",
                  fontSize: 10, fontWeight: 700,
                }}>
                  {tabCounts[tabKey]}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {activeTab === "saved" ? (
      <DataTable
        data={filteredWatchlist}
        columns={wlColumns}
        toolbar={
          <>
            <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
              <SearchInput value={wlSearch} onChange={setWlSearch} placeholder={lk === "fr" ? "Rechercher..." : "Search..."} />
              <FilterDropdown value={wlRegistryFilter} onChange={setWlRegistryFilter} options={wlRegistryOptions} />
            </div>
            <ExportButtons data={filteredWatchlist} columns={wlColumns} filename={lk === "fr" ? "recherche-marque" : "trademark-search"} title={lk === "fr" ? "Recherche de marque" : "Trademark Search"} subtitle="" />
          </>
        }
        emptyState={
          <div style={{ textAlign: "center", padding: "var(--sp-6)", color: "var(--text-faint)" }}>
            <ShieldCheck size={24} weight="duotone" color="var(--text-faint)" style={{ marginBottom: "var(--sp-2)" }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{lk === "fr" ? "Aucun nom sauvegard\u00e9" : "No names saved"}</div>
            <div style={{ fontSize: 12, marginTop: 4, color: "var(--text-muted)" }}>{lk === "fr" ? "Recherchez un nom et cliquez sur le signet pour le sauvegarder." : "Search a name and click the bookmark to save it."}</div>
          </div>
        }
        emptyMinHeight={120}
        pageSize={10}
        getRowId={function (row) { return String(row.id); }}
        selectable
        onDeleteSelected={function (ids) { bulkDeleteWatchlist(ids); }}
      />
      ) : null}

      {activeTab === "history" ? (
        <div style={{
          textAlign: "center", padding: "var(--sp-6)", color: "var(--text-faint)",
        }}>
          {stats.searched > 0 ? (
            <div style={{ fontSize: 13 }}>
              {lk === "fr"
                ? stats.searched + " recherche" + (stats.searched > 1 ? "s" : "") + " effectu\u00e9e" + (stats.searched > 1 ? "s" : "")
                : stats.searched + " search" + (stats.searched > 1 ? "es" : "") + " performed"}
            </div>
          ) : (
            <div style={{ fontSize: 13 }}>
              {lk === "fr" ? "Aucune recherche effectu\u00e9e." : "No searches performed."}
            </div>
          )}
        </div>
      ) : null}
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
  var [checkerName, setCheckerName] = useState("");

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

        {/* 2. DomainChecker + Quality score side by side */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "var(--sp-4)",
          marginBottom: "var(--sp-5)",
          alignItems: "start",
        }}>
          <div style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            background: "var(--bg-card)",
            padding: "var(--sp-5)",
            minHeight: "100%",
          }}>
            <DomainCheckerInner
              lk={lk}
              onSave={handleSaveDomains}
              onResultsChange={function (r, n) { setCheckerResults(r); if (n) setCheckerName(n); }}
              onSearchHistory={handleSearchHistory}
            />
          </div>

          {/* Quality score card — always visible, skeleton when no results */}
          {(function () {
            var hasScore = (availableCount + takenCount) > 0 && checkerName;
            var scoreData = hasScore ? scoreDomain(checkerName, checkerResults) : { score: 0, max: 10, categories: [] };
            var pct = scoreData.max > 0 ? scoreData.score / scoreData.max : 0;
            var gaugeColor = hasScore ? (pct >= 0.7 ? "var(--color-success)" : pct >= 0.4 ? "var(--color-warning)" : "var(--color-error)") : "var(--border)";
            var gaugeLabel = hasScore ? (pct >= 0.7 ? (lk === "fr" ? "Excellent" : "Excellent") : pct >= 0.4 ? (lk === "fr" ? "Correct" : "Fair") : (lk === "fr" ? "À améliorer" : "Needs work")) : "";
            var radius = 52;
            var circumference = Math.PI * radius;
            var dashLen = pct * circumference;
            return (
              <div style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)",
                background: "var(--bg-card)",
                padding: "var(--sp-4)",
                position: "sticky", top: 80,
              }}>
                <div style={Object.assign({}, SECTION_LABEL, { marginBottom: "var(--sp-3)" })}>
                  {lk === "fr" ? "Qualité du nom" : "Name quality"}
                </div>
                {/* Gauge */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "var(--sp-3)" }}>
                  <svg width="140" height="80" viewBox="0 0 140 80">
                    <path d="M 10 75 A 52 52 0 0 1 130 75" fill="none" stroke="var(--border)" strokeWidth="10" strokeLinecap="round" />
                    {hasScore ? (
                      <path d="M 10 75 A 52 52 0 0 1 130 75" fill="none" stroke={gaugeColor} strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={circumference} strokeDashoffset={circumference - dashLen}
                        style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s" }} />
                    ) : null}
                  </svg>
                  {hasScore ? (
                    <div style={{ marginTop: -30, textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: gaugeColor, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                        {scoreData.score}/{scoreData.max}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: gaugeColor, marginTop: 2 }}>{gaugeLabel}</div>
                    </div>
                  ) : null}
                </div>
                {/* Criteria by category or skeleton */}
                {hasScore ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
                    {scoreData.categories.map(function (cat, ci) {
                      return (
                        <div key={ci}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                            {cat.label[lk] || cat.label.en}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                            {cat.tips.map(function (tip, idx) {
                              return (
                                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{
                                    width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                                    background: tip.good ? "var(--color-success-bg)" : "var(--color-warning-bg)",
                                    border: "1px solid " + (tip.good ? "var(--color-success-border)" : "var(--color-warning-border)"),
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                  }}>
                                    {tip.good
                                      ? <CheckCircle size={10} weight="fill" color="var(--color-success)" />
                                      : <WarningCircle size={10} weight="fill" color="var(--color-warning)" />}
                                  </div>
                                  <span style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                                    {tip.text[lk] || tip.text.en}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[0, 1, 2].map(function (i) {
                      return (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--bg-hover)", flexShrink: 0 }} />
                                  <div style={{ height: 10, borderRadius: 4, background: "var(--bg-hover)", width: (50 + i * 20) + "%" }} />
                                </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
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

  if (activeTab === "tool_trademark") {
    return (
      <PageLayout
        title={lk === "fr" ? "Recherche de marque" : "Trademark Search"}
        subtitle={lk === "fr" ? "V\u00e9rifiez si votre nom est d\u00e9j\u00e0 d\u00e9pos\u00e9 comme marque." : "Check if your name is already registered as a trademark."}
        icon={ShieldCheck}
      >
        <TrademarkTool lk={lk} />
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

  /* Report results + current name to parent for KPI */
  var currentName = parseDomainBase(domain);
  useEffect(function () {
    if (onResultsChange) onResultsChange(results, currentName);
  }, [results, currentName]);

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
      onSearchHistory({ id: Date.now(), name: domain.trim(), timestamp: Date.now(), tldCount: tlds.length });
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
