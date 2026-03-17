import { useContext } from "react";
import ThemeContext from "./themeCtx";

export function useTheme() {
  return useContext(ThemeContext);
}
