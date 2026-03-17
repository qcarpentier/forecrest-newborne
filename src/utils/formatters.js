var _currency = "EUR";
var _rate = 1;
var _locale = "fr-FR";

export function setCurrencyDisplay(currency, rates, locale) {
  _currency = currency || "EUR";
  _rate = currency === "EUR" ? 1 : (rates && rates[currency]) || 1;
  if (locale) _locale = locale;
}

export function eur(n) {
  if (n == null || !isFinite(n)) return "0.00 " + _currency;
  var converted = n * _rate;
  return converted.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " " + _currency;
}

export function eurShort(n) {
  if (n == null || !isFinite(n)) return "0 " + _currency;
  var converted = n * _rate;
  var abs = Math.abs(converted);
  var sign = converted < 0 ? "-" : "";
  if (abs >= 1000000) return sign + (abs / 1000000).toFixed(abs >= 10000000 ? 1 : 2) + "M " + _currency;
  if (abs >= 1000) return sign + (abs / 1000).toFixed(abs >= 100000 ? 0 : 1) + "k " + _currency;
  return sign + abs.toFixed(0) + " " + _currency;
}

export function pct(n) {
  if (n == null || !isFinite(n)) return "0.0%";
  return (n * 100).toFixed(1) + "%";
}

export function nm(n) {
  if (n == null || !isFinite(n)) return "0";
  return Math.round(n).toLocaleString(_locale);
}
