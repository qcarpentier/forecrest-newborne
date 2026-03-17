import { useContext } from "react";
import LangContext from "./langCtx";

export function useT() {
  return useContext(LangContext).t;
}

export function useLang() {
  var ctx = useContext(LangContext);
  return { lang: ctx.lang, toggleLang: ctx.toggleLang };
}
