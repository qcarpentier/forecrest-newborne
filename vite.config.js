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

export default defineConfig({
  plugins: [react(), serveDocsPlugin()],
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
