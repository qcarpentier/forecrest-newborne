import { useContext } from "react";
import DevModeContext from "./devModeCtx";

export function useDevMode() {
  return useContext(DevModeContext);
}
