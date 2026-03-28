import { useState, useEffect } from "react";

var BREAKPOINTS = {
  sm: "(max-width: 639px)",
  md: "(max-width: 767px)",
  lg: "(max-width: 1023px)",
};

/**
 * useBreakpoint — responsive hook using matchMedia (no polling).
 *
 * Returns { sm, md, lg, isMobile, isTablet, isDesktop }
 *  - sm:  true when viewport < 640px  (phone)
 *  - md:  true when viewport < 768px  (small tablet / large phone)
 *  - lg:  true when viewport < 1024px (tablet)
 *  - isMobile:  alias for md (< 768px)
 *  - isTablet:  true when 768-1023px
 *  - isDesktop: true when >= 1024px
 */
export default function useBreakpoint() {
  var [state, setState] = useState(function () {
    if (typeof window === "undefined") return { sm: false, md: false, lg: false };
    return {
      sm: window.matchMedia(BREAKPOINTS.sm).matches,
      md: window.matchMedia(BREAKPOINTS.md).matches,
      lg: window.matchMedia(BREAKPOINTS.lg).matches,
    };
  });

  useEffect(function () {
    var mqSm = window.matchMedia(BREAKPOINTS.sm);
    var mqMd = window.matchMedia(BREAKPOINTS.md);
    var mqLg = window.matchMedia(BREAKPOINTS.lg);

    function update() {
      setState({
        sm: mqSm.matches,
        md: mqMd.matches,
        lg: mqLg.matches,
      });
    }

    mqSm.addEventListener("change", update);
    mqMd.addEventListener("change", update);
    mqLg.addEventListener("change", update);

    return function () {
      mqSm.removeEventListener("change", update);
      mqMd.removeEventListener("change", update);
      mqLg.removeEventListener("change", update);
    };
  }, []);

  return {
    sm: state.sm,
    md: state.md,
    lg: state.lg,
    isMobile: state.md,
    isTablet: !state.md && state.lg,
    isDesktop: !state.lg,
  };
}
