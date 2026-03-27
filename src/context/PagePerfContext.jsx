/**
 * PagePerfContext — Lightweight page performance telemetry (dev-only).
 *
 * Collects per-tab metrics via React.Profiler without causing re-renders.
 * Metrics are stored in a ref and read by PerformanceMonitorPage via polling.
 */
import { createContext, useContext, useRef, useCallback, useEffect, Profiler } from "react";

var NOOP = function () {};
var EMPTY_CTX = { getMetrics: function () { return {}; }, recordSwitch: NOOP, recordRender: NOOP, clearMetrics: NOOP };

var PagePerfContext = createContext(EMPTY_CTX);

export function usePagePerf() {
  return useContext(PagePerfContext);
}

export function PagePerfProvider({ children, devMode }) {
  var metricsRef = useRef({});
  var switchTsRef = useRef(null);

  var recordSwitch = useCallback(function (tabKey) {
    if (!devMode) return;
    switchTsRef.current = performance.now();
    var prev = metricsRef.current[tabKey] || {};
    metricsRef.current[tabKey] = Object.assign({}, prev, {
      tab: tabKey,
      status: "loading",
      lastVisit: Date.now(),
      renderCount: prev.renderCount || 0,
    });
  }, [devMode]);

  var recordRender = useCallback(function (tabKey, phase, actualDuration, baseDuration) {
    if (!devMode) return;
    var entry = metricsRef.current[tabKey] || { tab: tabKey, renderCount: 0 };
    var mountTime = entry.mountTime;

    if (phase === "mount" && switchTsRef.current) {
      mountTime = performance.now() - switchTsRef.current;
      switchTsRef.current = null;
    }

    metricsRef.current[tabKey] = Object.assign({}, entry, {
      status: "mounted",
      renderTime: actualDuration,
      baseDuration: baseDuration,
      mountTime: mountTime || entry.mountTime || 0,
      renderCount: (entry.renderCount || 0) + 1,
      lastVisit: entry.lastVisit || Date.now(),
    });
  }, [devMode]);

  var getMetrics = useCallback(function () {
    return Object.assign({}, metricsRef.current);
  }, []);

  var clearMetrics = useCallback(function () {
    metricsRef.current = {};
  }, []);

  var value = devMode
    ? { getMetrics: getMetrics, recordSwitch: recordSwitch, recordRender: recordRender, clearMetrics: clearMetrics }
    : EMPTY_CTX;

  return (
    <PagePerfContext.Provider value={value}>
      {children}
    </PagePerfContext.Provider>
  );
}

/**
 * Wrapper that uses React.Profiler to measure render performance.
 * Always renders Profiler to keep hook count stable.
 */
export function PagePerfProfiler({ tabKey, children }) {
  var ctx = useContext(PagePerfContext);
  var prevTabRef = useRef(tabKey);

  useEffect(function () {
    if (tabKey !== prevTabRef.current) {
      ctx.recordSwitch(tabKey);
      prevTabRef.current = tabKey;
    }
  }, [tabKey, ctx]);

  useEffect(function () {
    ctx.recordSwitch(tabKey);
  }, []);

  function onRender(id, phase, actualDuration, baseDuration) {
    ctx.recordRender(tabKey, phase, actualDuration, baseDuration);
  }

  return (
    <Profiler id={"page-" + tabKey} onRender={onRender}>
      {children}
    </Profiler>
  );
}
