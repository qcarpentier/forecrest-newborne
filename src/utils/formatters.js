var _currency = "EUR";
var _rate = 1;
var _locale = "fr-FR";

var SYMBOL_MAP = { EUR: "€", USD: "$", GBP: "£", CHF: "CHF", CAD: "CA$", JPY: "¥" };

function sym() { return SYMBOL_MAP[_currency] || _currency; }

export function setCurrencyDisplay(currency, rates, locale) {
  _currency = currency || "EUR";
  _rate = currency === "EUR" ? 1 : (rates && rates[currency]) || 1;
  if (locale) _locale = locale;
}

export function eur(n) {
  if (n == null || !isFinite(n)) return "0,00 " + sym();
  var converted = n * _rate;
  return converted.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " " + sym();
}

export function eurShort(n) {
  if (n == null || !isFinite(n)) return "0 " + sym();
  var converted = n * _rate;
  var abs = Math.abs(converted);
  var sign = converted < 0 ? "-" : "";
  if (abs >= 1000000) return sign + (abs / 1000000).toFixed(abs >= 10000000 ? 1 : 2).replace(".", ",") + "M " + sym();
  if (abs >= 1000) return sign + (abs / 1000).toFixed(abs >= 100000 ? 0 : 1).replace(".", ",") + "k " + sym();
  return sign + abs.toFixed(0) + " " + sym();
}

export function pct(n) {
  if (n == null || !isFinite(n)) return "0.0%";
  return (n * 100).toFixed(1) + "%";
}

export function nm(n) {
  if (n == null || !isFinite(n)) return "0";
  return Math.round(n).toLocaleString(_locale);
}

export function makeId(prefix) {
  return (prefix || "id") + Math.random().toString(36).slice(2, 8);
}
