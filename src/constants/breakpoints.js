export var BREAKPOINT_PX = Object.freeze({
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1440,
});

export var BREAKPOINT_REM = Object.freeze({
  xs: "30rem",
  sm: "40rem",
  md: "48rem",
  lg: "64rem",
  xl: "80rem",
  xxl: "90rem",
});

function getMaxWidthQuery(px) {
  return "(max-width: " + (px - 0.02).toFixed(2) + "px)";
}

export var BREAKPOINT_QUERIES = Object.freeze({
  upXs: "(min-width: 480px)",
  upSm: "(min-width: 640px)",
  upMd: "(min-width: 768px)",
  upLg: "(min-width: 1024px)",
  upXl: "(min-width: 1280px)",
  up2xl: "(min-width: 1440px)",
  downXs: getMaxWidthQuery(BREAKPOINT_PX.xs),
  downSm: getMaxWidthQuery(BREAKPOINT_PX.sm),
  downMd: getMaxWidthQuery(BREAKPOINT_PX.md),
  downLg: getMaxWidthQuery(BREAKPOINT_PX.lg),
  downXl: getMaxWidthQuery(BREAKPOINT_PX.xl),
  down2xl: getMaxWidthQuery(BREAKPOINT_PX.xxl),
});

export function getBreakpointState(width) {
  var safeWidth = Number(width) || 0;

  return {
    width: safeWidth,
    xs: safeWidth >= BREAKPOINT_PX.xs,
    sm: safeWidth >= BREAKPOINT_PX.sm,
    md: safeWidth >= BREAKPOINT_PX.md,
    lg: safeWidth >= BREAKPOINT_PX.lg,
    xl: safeWidth >= BREAKPOINT_PX.xl,
    xxl: safeWidth >= BREAKPOINT_PX.xxl,
    downXs: safeWidth < BREAKPOINT_PX.xs,
    downSm: safeWidth < BREAKPOINT_PX.sm,
    downMd: safeWidth < BREAKPOINT_PX.md,
    downLg: safeWidth < BREAKPOINT_PX.lg,
    downXl: safeWidth < BREAKPOINT_PX.xl,
    down2xl: safeWidth < BREAKPOINT_PX.xxl,
    isMobile: safeWidth < BREAKPOINT_PX.md,
    isTablet: safeWidth >= BREAKPOINT_PX.md && safeWidth < BREAKPOINT_PX.lg,
    isTabletDown: safeWidth < BREAKPOINT_PX.lg,
    isDesktop: safeWidth >= BREAKPOINT_PX.lg,
    isDesktopWide: safeWidth >= BREAKPOINT_PX.xl,
    is2xl: safeWidth >= BREAKPOINT_PX.xxl,
  };
}
