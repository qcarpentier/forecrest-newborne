import { useState, useCallback } from "react";
import NotificationContext from "./notificationCtx";

export function NotificationProvider({ children }) {
  var [dots, setDots] = useState({});
  var [highlights, setHighlights] = useState({});

  var notify = useCallback(function (pageId, rowIds) {
    setDots(function (prev) {
      var next = Object.assign({}, prev);
      next[pageId] = (next[pageId] || 0) + 1;
      return next;
    });
    if (rowIds && rowIds.length > 0) {
      setHighlights(function (prev) {
        var next = Object.assign({}, prev);
        next[pageId] = (next[pageId] || []).concat(rowIds);
        return next;
      });
    }
  }, []);

  var clearDot = useCallback(function (pageId) {
    setDots(function (prev) {
      var next = Object.assign({}, prev);
      delete next[pageId];
      return next;
    });
  }, []);

  var consumeHighlights = useCallback(function (pageId) {
    var ids = highlights[pageId] || [];
    setHighlights(function (prev) {
      var next = Object.assign({}, prev);
      delete next[pageId];
      return next;
    });
    return ids;
  }, [highlights]);

  var hasDot = useCallback(function (pageId) {
    return (dots[pageId] || 0) > 0;
  }, [dots]);

  var dotCount = useCallback(function (pageId) {
    return dots[pageId] || 0;
  }, [dots]);

  return (
    <NotificationContext.Provider value={{ notify: notify, clearDot: clearDot, consumeHighlights: consumeHighlights, hasDot: hasDot, dotCount: dotCount }}>
      {children}
    </NotificationContext.Provider>
  );
}
