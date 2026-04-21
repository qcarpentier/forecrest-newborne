import { useContext } from "react";
import ViewerModeContext from "./viewerModeCtx";

export function useViewerMode() {
  return useContext(ViewerModeContext) || { isViewer: false, meta: null };
}
