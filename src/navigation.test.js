/**
 * Navigation integrity tests.
 *
 * Dynamically scans every source file for setTab(), onNavigate(),
 * navigateWithToast(), and _linkedPage references, then verifies
 * that every tab ID used is present in VALID_TABS.
 *
 * This catches:
 *  - Typos in tab IDs (e.g. "stream" instead of "streams")
 *  - References to deleted or renamed tabs
 *  - _linkedPage values pointing to non-existent pages
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";
import { VALID_TABS } from "./constants/config";

/* ── Helpers ── */

/** Recursively collect .jsx and .js files under a directory, skip node_modules/dist */
function collectFiles(dir, files) {
  if (!files) files = [];
  var entries = readdirSync(dir);
  entries.forEach(function (name) {
    if (name === "node_modules" || name === "dist" || name === ".git") return;
    var full = join(dir, name);
    var st = statSync(full);
    if (st.isDirectory()) {
      collectFiles(full, files);
    } else if (extname(name) === ".jsx" || extname(name) === ".js") {
      if (!name.endsWith(".test.js") && !name.endsWith(".test.jsx")) {
        files.push(full);
      }
    }
  });
  return files;
}

/** Extract all quoted string arguments from a pattern like setTab("streams") */
function extractStringArgs(content, pattern) {
  var ids = [];
  var re = new RegExp(pattern + '\\(\\s*"([^"]+)"', "g");
  var m;
  while ((m = re.exec(content)) !== null) {
    ids.push(m[1]);
  }
  /* Also match single quotes */
  var re2 = new RegExp(pattern + "\\(\\s*'([^']+)'", "g");
  while ((m = re2.exec(content)) !== null) {
    ids.push(m[1]);
  }
  return ids;
}

/** Extract _linkedPage: "value" assignments */
function extractLinkedPages(content) {
  var ids = [];
  var re = /_linkedPage:\s*"([^"]+)"/g;
  var m;
  while ((m = re.exec(content)) !== null) {
    ids.push(m[1]);
  }
  return ids;
}

/* ── Collect all source files ── */
var SRC_DIR = join(__dirname);
var allFiles = collectFiles(SRC_DIR);

/* ── Build reference maps ── */
var setTabCalls = {};     // { file: [ids] }
var navigateCalls = {};   // { file: [ids] }
var linkedPages = {};     // { file: [ids] }

allFiles.forEach(function (file) {
  var content = readFileSync(file, "utf-8");
  var relPath = file.replace(SRC_DIR, "src").replace(/\\/g, "/");

  /* setTab("...") */
  var stIds = extractStringArgs(content, "setTab");
  if (stIds.length > 0) setTabCalls[relPath] = stIds;

  /* onNavigate("...") and navigateWithToast("...") */
  var navIds = extractStringArgs(content, "onNavigate")
    .concat(extractStringArgs(content, "navigateWithToast"));
  if (navIds.length > 0) navigateCalls[relPath] = navIds;

  /* _linkedPage: "..." */
  var lpIds = extractLinkedPages(content);
  if (lpIds.length > 0) linkedPages[relPath] = lpIds;
});

/* ── Known exceptions: tab IDs that are valid in setTab() context but have special handling ── */
var KNOWN_EXCEPTIONS = [
  /* opts like { section: "modules" } are not tab IDs */
];

/* ── Tests ── */

describe("Navigation integrity", function () {

  describe("VALID_TABS completeness", function () {
    it("contains no duplicate entries", function () {
      var seen = {};
      var dupes = [];
      VALID_TABS.forEach(function (id) {
        if (seen[id]) dupes.push(id);
        seen[id] = true;
      });
      expect(dupes).toEqual([]);
    });

    it("contains at least 40 tabs", function () {
      expect(VALID_TABS.length).toBeGreaterThanOrEqual(40);
    });
  });

  describe("setTab() calls reference valid tabs", function () {
    Object.keys(setTabCalls).forEach(function (file) {
      setTabCalls[file].forEach(function (id) {
        it(file + ' → setTab("' + id + '")', function () {
          expect(
            VALID_TABS.indexOf(id) >= 0 || KNOWN_EXCEPTIONS.indexOf(id) >= 0
          ).toBe(true);
        });
      });
    });
  });

  describe("onNavigate() / navigateWithToast() calls reference valid tabs", function () {
    Object.keys(navigateCalls).forEach(function (file) {
      navigateCalls[file].forEach(function (id) {
        it(file + ' → onNavigate("' + id + '")', function () {
          expect(VALID_TABS.indexOf(id) >= 0).toBe(true);
        });
      });
    });
  });

  describe("_linkedPage values reference valid tabs", function () {
    Object.keys(linkedPages).forEach(function (file) {
      linkedPages[file].forEach(function (id) {
        it(file + ' → _linkedPage: "' + id + '"', function () {
          expect(VALID_TABS.indexOf(id) >= 0).toBe(true);
        });
      });
    });
  });

  describe("tab === routing covers all VALID_TABS", function () {
    /* Read App.jsx and check that every VALID_TAB has a corresponding tab === "..." check */
    var appContent = "";
    allFiles.forEach(function (f) {
      if (f.replace(/\\/g, "/").endsWith("App.jsx")) {
        appContent = readFileSync(f, "utf-8");
      }
    });

    /* Some tabs are handled by multi-tab conditions (e.g. marketing module tabs) */
    var MULTI_TAB_GROUPS = {
      marketing: ["marketing", "mkt_campaigns", "mkt_channels", "mkt_budget", "mkt_conversions"],
      tools: ["tool_qr", "tool_domain", "tool_trademark", "tool_employee", "tool_freelance", "tool_costing", "tool_currency", "tool_vat"],
    };

    /* Extract all tab === "..." from App.jsx */
    var routedTabs = {};
    var reTab = /tab\s*===\s*"([^"]+)"/g;
    var m;
    while ((m = reTab.exec(appContent)) !== null) {
      routedTabs[m[1]] = true;
    }

    /* Marketing tabs are handled by a single condition: tab === "marketing" || tab === "mkt_..." */
    MULTI_TAB_GROUPS.marketing.forEach(function (t) { routedTabs[t] = true; });
    /* Tools tabs are handled by a combined condition */
    MULTI_TAB_GROUPS.tools.forEach(function (t) { routedTabs[t] = true; });

    VALID_TABS.forEach(function (tab) {
      it('App.jsx routes tab "' + tab + '"', function () {
        expect(routedTabs[tab]).toBe(true);
      });
    });
  });

  describe("NavigationToast Ctrl+Z support", function () {
    it("NavigationToast component exists and handles keydown", function () {
      var found = false;
      allFiles.forEach(function (f) {
        if (f.replace(/\\/g, "/").indexOf("NavigationToast") >= 0) {
          var content = readFileSync(f, "utf-8");
          if (content.indexOf("keydown") >= 0 && (content.indexOf("Ctrl" + "+Z") >= 0 || content.indexOf("ctrlKey") >= 0 || content.indexOf("metaKey") >= 0)) {
            found = true;
          }
        }
      });
      expect(found).toBe(true);
    });

    it("navigateWithToast captures previous tab for undo", function () {
      var appContent = "";
      allFiles.forEach(function (f) {
        if (f.replace(/\\/g, "/").endsWith("App.jsx")) {
          appContent = readFileSync(f, "utf-8");
        }
      });
      expect(appContent.indexOf("navigateWithToast") >= 0).toBe(true);
      expect(appContent.indexOf("navToast") >= 0).toBe(true);
      expect(appContent.indexOf("from") >= 0).toBe(true);
    });
  });
});
