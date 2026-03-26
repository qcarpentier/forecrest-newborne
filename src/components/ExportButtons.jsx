import { useState } from "react";
import { Printer, DownloadSimple, FileCsv, FileXls, CaretDown } from "@phosphor-icons/react";
import Button from "./Button";
import { useLang } from "../context";

/* ── Print: renders a hidden iframe with just the table ── */

function fmtVal(val, col) {
  if (val == null || val === "") return "";
  var s = String(val);
  var meta = col && col.meta;
  if (meta && meta.align === "right" && !meta.rawNumber && s !== "" && !isNaN(Number(s))) {
    var n = Number(s);
    var suffix = (meta && meta.suffix) ? meta.suffix : " €";
    return n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, " ") + suffix;
  }
  return s;
}

var PRINT_CSS = [
  '*{margin:0;padding:0;box-sizing:border-box}',
  'body{font-family:Inter,system-ui,-apple-system,sans-serif;color:#101828;padding:32px;font-size:12px}',
  '@page{size:A4 landscape;margin:14mm 16mm}',
  '@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}',
  '.header{border-bottom:3px solid #E25536;padding-bottom:14px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-end}',
  '.logo{display:flex;align-items:center;gap:10px}',
  '.logo-icon{width:28px;height:28px;border-radius:6px;background:#E25536;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px;font-family:system-ui}',
  '.logo-text{font-size:16px;font-weight:800;letter-spacing:-0.03em;color:#101828}',
  '.meta{text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px}',
  '.meta-title{font-size:14px;font-weight:700;color:#101828}',
  '.meta-date{font-size:11px;color:#667085}',
  '.meta-entity{font-size:10px;color:#667085;margin-top:2px;line-height:1.4}',
  '.meta-entity strong{color:#344054;font-weight:600}',
  '.meta-badge{font-size:9px;font-weight:600;color:#667085;background:#F2F4F7;border:1px solid #EAECF0;border-radius:3px;padding:1px 5px;vertical-align:middle;margin-left:4px}',
  '.meta-tag{font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#E25536;background:#FEF3F2;border:1px solid #FECDCA;border-radius:3px;padding:1px 6px;width:fit-content;margin-top:2px}',
  '.page-header{margin-bottom:20px}',
  '.page-title{font-size:22px;font-weight:800;letter-spacing:-0.03em;color:#101828;margin-bottom:4px}',
  '.page-subtitle{font-size:12px;color:#667085;line-height:1.5}',
  '.section-title{font-size:10px;font-weight:700;color:#E25536;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;padding-bottom:4px;border-bottom:1px solid #FECDCA}',
  'table{width:100%;border-collapse:collapse;font-size:12px;margin-top:4px}',
  'thead tr{border-bottom:2px solid #EAECF0}',
  'th{text-align:left;padding:8px 12px;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#667085;background:#F9FAFB}',
  'th.right{text-align:right}',
  'td{padding:9px 12px;border-bottom:1px solid #F2F4F7;color:#344054}',
  'tr:last-child td{border-bottom:none}',
  'tfoot td{padding:8px 12px;font-weight:700;font-size:12px;color:#101828;border-top:2px solid #EAECF0;background:#F9FAFB}',
  /* Compact mode for wide tables (>8 columns) */
  'table.compact{font-size:10px}',
  'table.compact th{padding:6px 6px;font-size:9px;letter-spacing:.03em}',
  'table.compact td{padding:6px 6px}',
  'table.compact tfoot td{padding:6px 6px;font-size:10px}',
  'tr:nth-child(even) td{background:#FAFAFA}',
  'td.right{text-align:right;font-variant-numeric:tabular-nums}',
  '.pcmn{font-family:ui-monospace,monospace;font-size:10px;color:#98A2B3;background:#F2F4F7;padding:2px 5px;border-radius:3px}',
  '.print-footer{margin-top:24px;padding-top:12px;border-top:1px solid #EAECF0;display:flex;justify-content:space-between;align-items:flex-start;gap:16px}',
  '.pf-left{font-size:10px;color:#98A2B3;line-height:1.6}',
  '.pf-brand{font-size:11px;font-weight:700;color:#344054;margin-bottom:2px}',
  '.pf-desc{font-size:10px;color:#667085;max-width:400px;line-height:1.5}',
  '.pf-url{font-size:10px;color:#E25536;text-decoration:none}',
  '.pf-right{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0}',
  '.pf-count{font-size:10px;color:#98A2B3;margin-bottom:4px}',
  '.pf-disclaimer{font-size:9px;color:#B0B7C3;max-width:260px;text-align:right;line-height:1.4;font-style:italic}',
  '.pf-qr{width:52px;height:52px;background:#F2F4F7;border-radius:4px;display:flex;align-items:center;justify-content:center;overflow:hidden}',
  '.pf-qr img{width:52px;height:52px}',
].join('');

function printTable(data, columns, lang, title, subtitle, getPcmn, companyName, fullName, userRole, legalForm, tvaNumber) {
  var isFr = lang !== "en";
  var cols = (columns || []).filter(function (c) { return c.id !== "actions" && c.id !== "select"; });
  if (getPcmn) cols = [{ id: "pcmn", header: "PCMN", accessorFn: getPcmn, meta: { align: "left" } }].concat(cols);
  var headers = cols.map(function (c) { return typeof c.header === "string" ? c.header : (c.id || ""); });
  var rows = (data || []).map(function (row) {
    return cols.map(function (col) {
      var val = "";
      if (col.accessorKey) val = row[col.accessorKey];
      else if (col.accessorFn) val = col.accessorFn(row);
      else val = row[col.id] || "";
      return fmtVal(val, col);
    });
  });

  var now = new Date();
  var dateStr = now.toLocaleDateString(isFr ? "fr-BE" : "en-GB", { year: "numeric", month: "long", day: "numeric" });
  var timeStr = now.toLocaleTimeString(isFr ? "fr-BE" : "en-GB", { hour: "2-digit", minute: "2-digit" });

  var html = '<!DOCTYPE html><html lang="' + lang + '"><head><meta charset="UTF-8"><title>' + (title || "Forecrest") + '</title><style>' + PRINT_CSS + '</style></head><body>';

  var printedLabel = isFr ? "Version imprimée" : "Printed version";
  html += '<div class="header"><div class="logo"><div class="logo-icon">F</div><div class="logo-text">Forecrest</div></div>';
  html += '<div class="meta"><div class="meta-title">' + dateStr + ' · ' + timeStr + '</div>';
  if (companyName) {
    var entityLine = '<strong>' + companyName.replace(/</g, "&lt;") + '</strong>';
    if (legalForm) entityLine += ' <span class="meta-badge">' + legalForm.replace(/</g, "&lt;") + '</span>';
    html += '<div class="meta-entity">' + entityLine + '</div>';
  }
  if (tvaNumber) {
    html += '<div class="meta-entity">TVA&nbsp;' + tvaNumber.replace(/</g, "&lt;") + '</div>';
  }
  if (fullName) {
    var repLine = (isFr ? "Resp. légal&nbsp;: " : "Legal rep.&nbsp;: ") + '<strong>' + fullName.replace(/</g, "&lt;") + '</strong>';
    if (userRole) repLine += ' · ' + userRole.replace(/</g, "&lt;");
    html += '<div class="meta-entity">' + repLine + '</div>';
  }
  html += '<div class="meta-tag">' + printedLabel + '</div></div></div>';

  if (title) {
    html += '<div class="page-header"><div class="page-title">' + title + '</div>';
    if (subtitle) html += '<div class="page-subtitle">' + subtitle + '</div>';
    html += '</div>';
  }

  var isCompact = headers.length > 8;
  html += '<table' + (isCompact ? ' class="compact"' : '') + '><thead><tr>';
  headers.forEach(function (h, i) {
    var meta = cols[i] && cols[i].meta;
    var cls = meta && meta.align === "right" ? ' class="right"' : '';
    html += '<th' + cls + '>' + h + '</th>';
  });
  html += '</tr></thead><tbody>';
  rows.forEach(function (r) {
    html += '<tr>';
    r.forEach(function (v, i) {
      var meta = cols[i] && cols[i].meta;
      var cls = meta && meta.align === "right" ? ' class="right"' : '';
      var isPcmn = cols[i] && cols[i].id === "pcmn";
      var safe = String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
      var display = isPcmn && safe ? '<span class="pcmn">' + safe + '</span>' : safe;
      html += '<td' + cls + '>' + display + '</td>';
    });
    html += '</tr>';
  });
  html += '</tbody>';
  /* Column footers — render tfoot if any column has a footer string/value */
  var hasFooter = cols.some(function (c) { return typeof c.footer === "string" || typeof c.footerValue === "string"; });
  if (!hasFooter) {
    /* Try to build footer from accessorFn totals for numeric columns */
    var footerCells = cols.map(function (col) {
      if (col.id === "actions" || col.id === "select" || col.id === "pcmn") return "";
      if (typeof col.footer === "string") return col.footer;
      if (typeof col.footerValue === "string") return col.footerValue;
      /* Sum numeric columns */
      if (col.meta && col.meta.align === "right" && col.accessorKey) {
        var sum = 0;
        var hasNum = false;
        (data || []).forEach(function (row) {
          var v = Number(row[col.accessorKey]);
          if (!isNaN(v) && v !== 0) { sum += v; hasNum = true; }
        });
        if (hasNum) return fmtVal(String(sum.toFixed(2)), col);
      }
      return "";
    });
    hasFooter = footerCells.some(function (c) { return c !== ""; });
    if (hasFooter) {
      html += '<tfoot><tr>';
      footerCells.forEach(function (cell, i) {
        var meta = cols[i] && cols[i].meta;
        var cls = meta && meta.align === "right" ? ' class="right"' : '';
        html += '<td' + cls + '>' + cell + '</td>';
      });
      html += '</tr></tfoot>';
    }
  }
  html += '</table>';

  var rowCount = (data || []).length;
  var countLabel = rowCount + ' ' + (isFr ? (rowCount > 1 ? "lignes" : "ligne") : (rowCount > 1 ? "rows" : "row"));
  var desc = isFr
    ? "Forecrest est un outil de plan financier structuré pour les start-ups belges. Modélisez vos revenus, charges, trésorerie et comptabilité en toute simplicité."
    : "Forecrest is a structured financial planning tool for Belgian start-ups. Model your revenues, costs, cash flow and accounting with ease.";
  var disclaimer = isFr
    ? "Ce document a été généré automatiquement via Forecrest.app. Les données sont des projections prévisionnelles non auditées et ne constituent pas un avis comptable ou juridique. Conformément au droit belge (Code des sociétés et des associations, art. 5:4), tout plan financier doit être établi ou validé par un professionnel agréé."
    : "This document was automatically generated via Forecrest.app. The data are unaudited financial projections and do not constitute accounting or legal advice. Under Belgian law (Companies and Associations Code, art. 5:4), any financial plan must be prepared or validated by a licensed professional.";
  var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=52x52&data=https://github.com/Thomasvtrn/&color=E25536&bgcolor=F2F4F7";

  html += '<div class="print-footer">';
  html += '<div class="pf-left">';
  html += '<div class="pf-brand">Forecrest — ' + (isFr ? "Plan financier" : "Financial plan") + '</div>';
  html += '<div class="pf-desc">' + desc + '</div>';
  html += '<a class="pf-url" href="https://forecrest.app">forecrest.app</a>';
  html += '</div>';
  html += '<div class="pf-right">';
  html += '<div class="pf-qr"><img src="' + qrUrl + '" alt="QR forecrest.app" /></div>';
  html += '<div class="pf-disclaimer">' + disclaimer + '</div>';
  html += '</div>';
  html += '</div>';
  html += '</body></html>';

  var w = window.open("", "_blank", "width=1000,height=800");
  if (!w) {
    var iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;left:-9999px;width:0;height:0";
    document.body.appendChild(iframe);
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    setTimeout(function () { iframe.contentWindow.print(); setTimeout(function () { document.body.removeChild(iframe); }, 1000); }, 250);
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(function () { w.print(); }, 400);
}

/**
 * ExportButtons — Print + Export (CSV/Excel) buttons.
 *
 * Props:
 * - data: array — the filtered/visible data rows
 * - columns: array — column definitions
 * - filename: string — export file name (default "export")
 */
export default function ExportButtons({ data, columns, filename, title, subtitle, getPcmn, cfg, companyName, userName }) {
  var { lang } = useLang();
  var isFr = lang !== "en";
  var [open, setOpen] = useState(false);

  function getExportData() {
    var cols = (columns || []).filter(function (c) { return c.id !== "actions" && c.id !== "select"; });
    if (getPcmn) cols = [{ id: "pcmn", header: "PCMN", accessorFn: getPcmn }].concat(cols);
    var headers = cols.map(function (c) { return typeof c.header === "string" ? c.header : (c.id || ""); });
    var rows = (data || []).map(function (row) {
      return cols.map(function (col) {
        var val = "";
        if (col.accessorKey) val = row[col.accessorKey];
        else if (col.accessorFn) val = col.accessorFn(row);
        else val = row[col.id] || "";
        if (val == null) val = "";
        return String(val);
      });
    });
    return { headers: headers, rows: rows };
  }

  function exportCSV() {
    var d = getExportData();
    var sep = ";";
    var csv = "\uFEFF" + d.headers.map(function (h) { return '"' + h.replace(/"/g, '""') + '"'; }).join(sep) + "\n" +
      d.rows.map(function (r) { return r.map(function (v) { return '"' + v.replace(/"/g, '""') + '"'; }).join(sep); }).join("\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = (filename || "export") + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  function exportXLS() {
    var d = getExportData();
    var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n<Worksheet ss:Name="Export"><Table>\n';
    xml += "<Row>" + d.headers.map(function (h) { return '<Cell><Data ss:Type="String">' + h.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</Data></Cell>"; }).join("") + "</Row>\n";
    d.rows.forEach(function (r) {
      xml += "<Row>" + r.map(function (v) {
        var isNum = v !== "" && !isNaN(Number(v));
        return '<Cell><Data ss:Type="' + (isNum ? "Number" : "String") + '">' + v.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</Data></Cell>";
      }).join("") + "</Row>\n";
    });
    xml += "</Table></Worksheet></Workbook>";
    var blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = (filename || "export") + ".xls";
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  return (
    <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexShrink: 0 }}>
      {/* Print — tertiary icon only */}
      <Button color="tertiary" size="lg" onClick={function () {
        var c = cfg || {};
        var cn = companyName || c.companyName || "";
        var fn = [c.firstName, c.lastName].filter(Boolean).join(" ") || userName || c.userName || "";
        var role = c.userRole || "";
        var lf = c.legalForm || "";
        var tva = c.tvaNumber || "";
        printTable(data, columns, lang, title, subtitle, getPcmn, cn, fn, role, lf, tva);
      }} iconLeading={<Printer size={14} weight="bold" />} sx={{ width: 40, minWidth: 40, padding: 0, justifyContent: "center" }} />

      {/* Export with dropdown */}
      <div style={{ position: "relative" }}>
        <Button color="tertiary" size="lg" onClick={function () { setOpen(function (v) { return !v; }); }} iconLeading={<DownloadSimple size={14} weight="bold" />} iconTrailing={<CaretDown size={10} weight="bold" style={{ opacity: 0.5 }} />}>
          {isFr ? "Exporter" : "Export"}
        </Button>
        {open ? (
          <>
            <div onClick={function () { setOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 51,
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: "var(--r-md)", boxShadow: "var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08))",
              padding: "var(--sp-1)", minWidth: 150,
              animation: "tooltipIn 0.1s ease",
            }}>
              <button type="button" onClick={exportCSV}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px var(--sp-3)", border: "none", borderRadius: "var(--r-sm)", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", fontFamily: "inherit", transition: "background 0.1s" }}
                onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; }}
              ><FileCsv size={16} color="var(--text-muted)" weight="duotone" /> CSV (.csv)</button>
              <button type="button" onClick={exportXLS}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px var(--sp-3)", border: "none", borderRadius: "var(--r-sm)", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", fontFamily: "inherit", transition: "background 0.1s" }}
                onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; }}
              ><FileXls size={16} color="var(--text-muted)" weight="duotone" /> Excel (.xls)</button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
