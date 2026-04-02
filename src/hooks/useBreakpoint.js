import { useState, useEffect } from "react";
import { BREAKPOINT_PX, getBreakpointState } from "../constants/breakpoints";

/**
 * useBreakpoint — Untitled UI-inspired breakpoint ladder.
 *
 * Breakpoints:
 * - xs: 480
 * - sm: 640
 * - md: 768
 * - lg: 1024
 * - xl: 1280
 * - 2xl: 1440
 *
 * Returns booleans for both "up" checks (`md`, `lg`, `xl`) and "down" checks
 * (`downMd`, `downLg`, `downXl`), plus semantic aliases like `isMobile`,
 * `isTablet`, `isTabletDown`, `isDesktop`, and `isDesktopWide`.
 */
export default function useBreakpoint() {
  var [state, setState] = useState(function () {
    if (typeof window === "undefined") return getBreakpointState(BREAKPOINT_PX.lg);
    return getBreakpointState(window.innerWidth);
  });

  useEffect(function () {
    if (typeof window === "undefined") return undefined;

    function update() {
      setState(getBreakpointState(window.innerWidth));
    }

    update();
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("orientationchange", update);

    return function () {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return state;
}
