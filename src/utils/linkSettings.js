import { createElement } from "react";

export function linkSettings(text, onClick) {
  if (!text || typeof text !== "string") return text;
  var parts = text.split(/(Paramètres|Settings)/gi);
  if (parts.length === 1) return text;
  return parts.map(function (p, i) {
    if (/^(paramètres|settings)$/i.test(p)) {
      return createElement("span", {
        key: i,
        onClick: onClick,
        style: { color: "var(--brand)", cursor: "pointer", textDecoration: "underline" },
      }, p);
    }
    return p;
  });
}
