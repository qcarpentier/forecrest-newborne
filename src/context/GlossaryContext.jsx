import { createContext, useContext, useState, useCallback, useRef, useMemo } from "react";

var GlossaryCtx = createContext();

export function GlossaryProvider({ children }) {
  var [openTerm, setOpenTerm] = useState(null);
  var [drawerOpen, setDrawerOpen] = useState(false);
  var [expanded, setExpanded] = useState(false);
  var financialsRef = useRef({});

  var open = useCallback(function (termId) {
    setOpenTerm(termId);
    setDrawerOpen(true);
  }, []);

  var openExpanded = useCallback(function (termId) {
    setOpenTerm(termId || null);
    setDrawerOpen(true);
    setExpanded(true);
  }, []);

  var close = useCallback(function () {
    setDrawerOpen(false);
    setExpanded(false);
  }, []);

  var navigate = useCallback(function (termId) {
    setOpenTerm(termId);
    if (!drawerOpen) setDrawerOpen(true);
  }, [drawerOpen]);

  var toggleExpanded = useCallback(function () {
    setExpanded(function (v) { return !v; });
  }, []);

  var setFinancials = useCallback(function (data) {
    financialsRef.current = data || {};
  }, []);

  var setTabRef = useRef(null);
  var currentTabRef = useRef(null);
  var registerSetTab = useCallback(function (fn) {
    setTabRef.current = fn;
  }, []);

  var setCurrentTab = useCallback(function (tab) {
    currentTabRef.current = tab;
  }, []);

  var goToTab = useCallback(function (tabId) {
    if (setTabRef.current) setTabRef.current(tabId);
  }, []);

  var ctxValue = useMemo(function () {
    return {
      openTerm: openTerm, drawerOpen: drawerOpen, expanded: expanded,
      financials: financialsRef, currentTab: currentTabRef,
      open: open, openExpanded: openExpanded, close: close,
      navigate: navigate, toggleExpanded: toggleExpanded,
      setFinancials: setFinancials, registerSetTab: registerSetTab, setCurrentTab: setCurrentTab, goToTab: goToTab,
    };
  }, [openTerm, drawerOpen, expanded, open, openExpanded, close, navigate, toggleExpanded, setFinancials, registerSetTab, setCurrentTab, goToTab]);

  return (
    <GlossaryCtx.Provider value={ctxValue}>
      {children}
    </GlossaryCtx.Provider>
  );
}

export function useGlossary() {
  return useContext(GlossaryCtx);
}
