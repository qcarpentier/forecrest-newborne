import { useState } from "react";
import LangContext from "./langCtx";
import fr from "../i18n/fr";
import en from "../i18n/en";

var LANGS = { fr, en };

export function LangProvider({ children }) {
  var [lang, setLang] = useState(function () {
    try {
      return localStorage.getItem("lang") || "fr";
    } catch (e) {
      return "fr";
    }
  });

  function toggleLang() {
    var next = lang === "fr" ? "en" : "fr";
    try {
      localStorage.setItem("lang", next);
    } catch (e) {}
    setLang(next);
  }

  return (
    <LangContext.Provider value={{ lang, toggleLang, t: LANGS[lang] }}>
      {children}
    </LangContext.Provider>
  );
}
