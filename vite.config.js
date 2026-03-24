import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

function serveDocsPlugin() {
  return {
    name: "serve-docs",
    configureServer(server) {
      server.middlewares.use(function (req, res, next) {
        if (!req.url.startsWith("/docs")) return next();
        var rel = req.url.replace(/^\/docs/, "") || "/";
        var base = path.resolve("public/docs");
        var filePath = path.join(base, rel);
        // If directory, try index.html
        if (!path.extname(filePath)) filePath = path.join(filePath, "index.html");
        if (fs.existsSync(filePath)) {
          var ext = path.extname(filePath);
          var mime = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2" }[ext] || "application/octet-stream";
          res.setHeader("Content-Type", mime);
          fs.createReadStream(filePath).pipe(res);
        } else {
          next();
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(function (req, res, next) {
        if (!req.url.startsWith("/docs")) return next();
        var rel = req.url.replace(/^\/docs/, "") || "/";
        var base = path.resolve("public/docs");
        var filePath = path.join(base, rel);
        if (!path.extname(filePath)) filePath = path.join(filePath, "index.html");
        if (fs.existsSync(filePath)) {
          var ext = path.extname(filePath);
          var mime = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2" }[ext] || "application/octet-stream";
          res.setHeader("Content-Type", mime);
          fs.createReadStream(filePath).pipe(res);
        } else {
          next();
        }
      });
    },
  };
}

function getManualChunk(id) {
  var normalized = id.split("\\").join("/");

  if (normalized.indexOf("/node_modules/") >= 0) {
    if (
      normalized.indexOf("/node_modules/react/") >= 0
      || normalized.indexOf("/node_modules/react-dom/") >= 0
      || normalized.indexOf("/node_modules/scheduler/") >= 0
    ) return "vendor-react-core";
    if (
      normalized.indexOf("/recharts/") >= 0
      || normalized.indexOf("/d3-") >= 0
      || normalized.indexOf("/victory-vendor/") >= 0
    ) return "vendor-charts";
    if (
      normalized.indexOf("/framer-motion/") >= 0
      || normalized.indexOf("/gsap/") >= 0
    ) return "vendor-motion";
    if (
      normalized.indexOf("/@phosphor-icons/") >= 0
    ) return "vendor-icons";
    if (
      normalized.indexOf("/cmdk/") >= 0
      || normalized.indexOf("/react-hotkeys-hook/") >= 0
    ) return "vendor-ui";
    if (
      normalized.indexOf("/@tanstack/") >= 0
      || normalized.indexOf("/@dnd-kit/") >= 0
      || normalized.indexOf("/react-number-format/") >= 0
      || normalized.indexOf("/@uiw/react-md-editor/") >= 0
    ) return "vendor-data";
    return "vendor-misc";
  }

  if (normalized.indexOf("/src/utils/") >= 0) return "app-utils";
  if (normalized.indexOf("/src/constants/") >= 0) return "app-constants";
  if (
    normalized.indexOf("/src/i18n/fr.js") >= 0
    || normalized.indexOf("/src/i18n/fr/") >= 0
  ) return "i18n-fr";
  if (
    normalized.indexOf("/src/i18n/en.js") >= 0
    || normalized.indexOf("/src/i18n/en/") >= 0
  ) return "i18n-en";
  if (normalized.indexOf("/src/context/") >= 0 || normalized.indexOf("/src/hooks/") >= 0) return "app-state";
  if (
    normalized.indexOf("/src/components/Sidebar.jsx") >= 0
    || normalized.indexOf("/src/components/GlossaryDrawer.jsx") >= 0
    || normalized.indexOf("/src/components/NavigationToast.jsx") >= 0
    || normalized.indexOf("/src/components/PageTransition.jsx") >= 0
    || normalized.indexOf("/src/components/DevBanner.jsx") >= 0
    || normalized.indexOf("/src/components/AccountantBar.jsx") >= 0
  ) return "app-shell";
  if (
    normalized.indexOf("/src/components/OnboardingWizard.jsx") >= 0
    || normalized.indexOf("/src/components/ExportImportModal.jsx") >= 0
    || normalized.indexOf("/src/components/PresentationMode.jsx") >= 0
    || normalized.indexOf("/src/components/KeyboardShortcuts.jsx") >= 0
    || normalized.indexOf("/src/components/DevCommandPalette.jsx") >= 0
    || normalized.indexOf("/src/components/FloatingToolbar.jsx") >= 0
    || normalized.indexOf("/src/components/ChordPalette.jsx") >= 0
  ) return "app-overlays";
  if (
    normalized.indexOf("/src/components/DataTable.jsx") >= 0
    || normalized.indexOf("/src/components/ExportButtons.jsx") >= 0
    || normalized.indexOf("/src/components/DevOptionsButton.jsx") >= 0
  ) return "app-data-ui";
  if (normalized.indexOf("/src/components/") >= 0) return "app-components";

  if (
    normalized.indexOf("/src/pages/OperatingCostsPage.jsx") >= 0
    || normalized.indexOf("/src/pages/RevenueStreamsPage.jsx") >= 0
    || normalized.indexOf("/src/pages/SalaryPage.jsx") >= 0
    || normalized.indexOf("/src/pages/AmortissementPage.jsx") >= 0
    || normalized.indexOf("/src/pages/StocksPage.jsx") >= 0
  ) return "pages-business";
  if (
    normalized.indexOf("/src/pages/CashFlowPage.jsx") >= 0
    || normalized.indexOf("/src/pages/DebtPage.jsx") >= 0
    || normalized.indexOf("/src/pages/CrowdfundingPage.jsx") >= 0
    || normalized.indexOf("/src/pages/AffiliationPage.jsx") >= 0
    || normalized.indexOf("/src/pages/MarketingPage.jsx") >= 0
  ) return "pages-finance";
  if (
    normalized.indexOf("/src/pages/SettingsPage.jsx") >= 0
    || normalized.indexOf("/src/pages/ProfilePage.jsx") >= 0
    || normalized.indexOf("/src/pages/EquityPage.jsx") >= 0
    || normalized.indexOf("/src/pages/CapTablePage.jsx") >= 0
    || normalized.indexOf("/src/pages/PactPage.jsx") >= 0
  ) return "pages-company";
  if (
    normalized.indexOf("/src/pages/AccountingPage.jsx") >= 0
    || normalized.indexOf("/src/pages/IncomeStatementPage.jsx") >= 0
    || normalized.indexOf("/src/pages/BalanceSheetPage.jsx") >= 0
    || normalized.indexOf("/src/pages/RatiosPage.jsx") >= 0
    || normalized.indexOf("/src/pages/SensitivityPage.jsx") >= 0
  ) return "pages-analysis";
  if (
    normalized.indexOf("/src/pages/ChangelogPage.jsx") >= 0
    || normalized.indexOf("/src/pages/CreditsPage.jsx") >= 0
    || normalized.indexOf("/src/pages/TooltipRegistryPage.jsx") >= 0
    || normalized.indexOf("/src/pages/DebugCalculationsPage.jsx") >= 0
    || normalized.indexOf("/src/pages/DesignTokensPage.jsx") >= 0
    || normalized.indexOf("/src/pages/RoadmapPage.jsx") >= 0
    || normalized.indexOf("/src/pages/SitemapPage.jsx") >= 0
    || normalized.indexOf("/src/pages/SharedLinkPage.jsx") >= 0
  ) return "pages-meta";

  return null;
}

export default defineConfig({
  plugins: [react(), serveDocsPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: getManualChunk,
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
  test: {
    coverage: {
      provider: "v8",
      include: ["src/utils/**", "src/constants/**"],
      exclude: ["src/utils/printReport.js"],
      reporter: ["text", "text-summary"],
      thresholds: {
        lines: 60,
      },
    },
  },
});
