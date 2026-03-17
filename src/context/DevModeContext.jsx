import { useState, useEffect, useCallback } from "react";
import DevModeContext from "./devModeCtx";

var STORAGE_KEY = "forecrest_devMode";

export function DevModeProvider({ children }) {
  var [devMode, setDevMode] = useState(function () {
    try { return localStorage.getItem(STORAGE_KEY) === "true"; } catch (e) { return false; }
  });

  useEffect(function () {
    try { localStorage.setItem(STORAGE_KEY, devMode ? "true" : "false"); } catch (e) { /* noop */ }
  }, [devMode]);

  var toggle = useCallback(function () {
    setDevMode(function (v) { return !v; });
  }, []);

  return (
    <DevModeContext.Provider value={{ devMode: devMode, toggle: toggle }}>
      {children}
    </DevModeContext.Provider>
  );
}
