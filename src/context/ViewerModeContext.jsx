import { useEffect } from "react";
import ViewerModeContext from "./viewerModeCtx";

export function ViewerModeProvider({ value, children }) {
  var isViewer = !!(value && value.isViewer);

  useEffect(function () {
    if (isViewer) {
      document.documentElement.dataset.viewer = "true";
    } else {
      delete document.documentElement.dataset.viewer;
    }
    return function () { delete document.documentElement.dataset.viewer; };
  }, [isViewer]);

  return (
    <ViewerModeContext.Provider value={value || { isViewer: false, meta: null }}>
      {children}
    </ViewerModeContext.Provider>
  );
}
