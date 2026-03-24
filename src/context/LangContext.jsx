import { useEffect, useState } from "react";
import LangContext from "./langCtx";

var LANG_LOADERS = {
  fr: function () { return import("../i18n/fr"); },
  en: function () { return import("../i18n/en"); },
};

function FullscreenLoader() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-page)",
      color: "var(--text-faint)",
      fontFamily: "'DM Sans',Inter,system-ui,sans-serif",
      fontSize: 14,
    }}>
      Forecrest
    </div>
  );
}

export function LangProvider({ children }) {
  var [lang, setLang] = useState(function () {
    try {
      return localStorage.getItem("lang") || "fr";
    } catch (e) {
      return "fr";
    }
  });
  var [t, setT] = useState(null);

  useEffect(function () {
    var cancelled = false;
    var loader = LANG_LOADERS[lang] || LANG_LOADERS.fr;

    loader().then(function (mod) {
      if (!cancelled) setT(mod.default);
    }).catch(function () {
      if (!cancelled && lang !== "fr") {
        LANG_LOADERS.fr().then(function (fallback) {
          if (!cancelled) setT(fallback.default);
        });
      }
    });

    return function () {
      cancelled = true;
    };
  }, [lang]);

  function toggleLang() {
    var next = lang === "fr" ? "en" : "fr";
    try {
      localStorage.setItem("lang", next);
    } catch (e) {}
    setLang(next);
  }

  if (!t) return <FullscreenLoader />;

  return (
    <LangContext.Provider value={{ lang, toggleLang, t: t }}>
      {children}
    </LangContext.Provider>
  );
}
