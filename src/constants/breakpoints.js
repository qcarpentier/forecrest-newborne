export var BREAKPOINT_PX = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1440,
};

export var BREAKPOINT_QUERIES = {
  upXs: "(min-width: 480px)",
  upSm: "(min-width: 640px)",
  upMd: "(min-width: 768px)",
  upLg: "(min-width: 1024px)",
  upXl: "(min-width: 1280px)",
  up2xl: "(min-width: 1440px)",
  downXs: "(max-width: 479px)",
  downSm: "(max-width: 639px)",
  downMd: "(max-width: 767px)",
  downLg: "(max-width: 1023px)",
  downXl: "(max-width: 1279px)",
  down2xl: "(max-width: 1439px)",
};

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
