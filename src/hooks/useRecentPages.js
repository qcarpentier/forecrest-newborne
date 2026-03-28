import { useState, useEffect, useRef } from "react";

var STORAGE_KEY = "forecrest_recent";
var MAX_RECENT = 6;

function loadRecent() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveRecent(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
}

export default function useRecentPages(currentTab) {
  var [recent, setRecent] = useState(loadRecent);
  var prevTab = useRef(null);

  useEffect(function () {
    if (!currentTab || currentTab === prevTab.current) return;
    prevTab.current = currentTab;

    setRecent(function (prev) {
      var filtered = prev.filter(function (entry) { return entry.id !== currentTab; });
      var next = [{ id: currentTab, ts: Date.now() }].concat(filtered).slice(0, MAX_RECENT);
      saveRecent(next);
      return next;
    });
  }, [currentTab]);

  return recent;
}
