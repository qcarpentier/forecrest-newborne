import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { CaretUp, CaretDown, CaretUpDown, CaretLeft, CaretRight, Check } from "@phosphor-icons/react";
import { useLang } from "../context";

/* ── base styles ── */

var thBase = {
  fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
  paddingTop: 0, paddingBottom: 0, paddingLeft: 24, paddingRight: 24,
  height: 44,
  borderBottom: "1px solid var(--border)",
  whiteSpace: "nowrap", userSelect: "none",
  transition: "color 0.12s",
  textTransform: "none", letterSpacing: 0,
  background: "var(--bg-accordion)",
  verticalAlign: "middle",
};

var tdBase = {
  fontSize: 14, fontVariantNumeric: "tabular-nums",
  paddingTop: 0, paddingBottom: 0, paddingLeft: 24, paddingRight: 24,
  height: 72,
  borderBottom: "1px solid var(--border-light)",
  color: "var(--text-primary)",
  verticalAlign: "middle",
};

var tfBase = {
  fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums",
  paddingTop: 0, paddingBottom: 0, paddingLeft: 24, paddingRight: 24,
  height: 68,
  borderTop: "1px solid var(--border)",
  background: "var(--bg-accordion)",
  verticalAlign: "middle",
};

/* ── Page size dropdown ── */

function PageSizeDropdown({ value, options, onChange }) {
  var [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={function () { setOpen(function (v) { return !v; }); }}
        style={{
          height: 28,
          padding: "0 24px 0 var(--sp-2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-sm)",
          background: "var(--bg-card)",
          color: "var(--text-secondary)",
          fontSize: 14, fontWeight: 600, fontFamily: "inherit", fontVariantNumeric: "tabular-nums",
          cursor: "pointer", outline: "none",
          display: "inline-flex", alignItems: "center", gap: 4,
          position: "relative",
          transition: "border-color 0.12s",
        }}
      >
        {value}
        <CaretDown size={10} weight="bold" style={{ position: "absolute", right: 8, opacity: 0.5 }} />
      </button>

      {open ? (
        <>
          <div onClick={function () { setOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
          <div style={{
            position: "absolute", bottom: "calc(100% + 4px)", left: 0, zIndex: 51,
            minWidth: 64,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08))",
            padding: "var(--sp-1)",
            animation: "tooltipIn 0.1s ease",
          }}>
            {options.map(function (size) {
              var isActive = value === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={function () { onChange(size); setOpen(false); }}
                  onMouseEnter={function (e) { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={function (e) { if (!isActive) e.currentTarget.style.background = isActive ? "var(--brand-bg)" : "transparent"; }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "6px var(--sp-2)",
                    border: "none", borderRadius: "var(--r-sm)",
                    background: isActive ? "var(--brand-bg)" : "transparent",
                    color: isActive ? "var(--brand)" : "var(--text-secondary)",
                    fontSize: 12, fontWeight: isActive ? 600 : 400,
                    fontVariantNumeric: "tabular-nums",
                    cursor: "pointer", textAlign: "left",
                    transition: "background 0.1s",
                  }}
                >
                  <span>{size}</span>
                  {isActive ? <Check size={10} weight="bold" color="var(--brand)" /> : null}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ── Pagination bar ── */

/* Layout: [ Rows per page  [10 v] ]                  [ < Prev   [2 v]  of 77   Next > ] */

function PaginationBar({
  totalRows, pageIndex, pageCount, pageSize,
  pageSizeOptions, canPrev, canNext, onPrev, onNext, onPageSizeChange, onPageJump,
}) {
  var { lang } = useLang();
  var isFr = lang !== "en";

  var rowsLabel = isFr ? "Lignes par page" : "Rows per page";
  var prevLabel = isFr ? "Préc" : "Prev";
  var nextLabel = isFr ? "Suiv" : "Next";
  var ofLabel = isFr ? "sur" : "of";

  /* page number options for the page jump dropdown */
  var pageNumbers = [];
  for (var i = 0; i < pageCount; i++) { pageNumbers.push(i + 1); }

  return (
    <div style={{
      paddingTop: 8, paddingBottom: 8, paddingLeft: 24, paddingRight: 24,
      borderTop: "1px solid var(--border-light)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      fontSize: 14, color: "var(--text-muted)", fontWeight: 600,
      minHeight: 68,
      gap: "var(--sp-3)",
    }}>
      {/* Left: rows per page */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
        <span style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{rowsLabel}</span>
        <PageSizeDropdown value={pageSize} options={pageSizeOptions} onChange={onPageSizeChange} />
      </div>

      {/* Right: prev / page dropdown / of N / next */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
        <button
          type="button"
          onClick={onPrev}
          disabled={!canPrev}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            height: 32, padding: "0 var(--sp-2)",
            border: "none", borderRadius: "var(--r-md)",
            background: "transparent",
            color: canPrev ? "var(--text-secondary)" : "var(--text-ghost)",
            cursor: canPrev ? "pointer" : "default",
            opacity: canPrev ? 1 : 0.4,
            fontSize: 14, fontWeight: 600, fontFamily: "inherit",
            transition: "opacity 0.12s",
          }}
          aria-label={isFr ? "Page précédente" : "Previous page"}
        >
          <CaretLeft size={12} weight="bold" />
          {prevLabel}
        </button>

        <PageSizeDropdown
          value={pageIndex + 1}
          options={pageNumbers}
          onChange={function (num) {
            onPageJump(num - 1);
          }}
        />

        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          {ofLabel + " " + pageCount}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            height: 32, padding: "0 var(--sp-2)",
            border: "none", borderRadius: "var(--r-md)",
            background: "transparent",
            color: canNext ? "var(--text-secondary)" : "var(--text-ghost)",
            cursor: canNext ? "pointer" : "default",
            opacity: canNext ? 1 : 0.4,
            fontSize: 14, fontWeight: 600, fontFamily: "inherit",
            transition: "opacity 0.12s",
          }}
          aria-label={isFr ? "Page suivante" : "Next page"}
        >
          {nextLabel}
          <CaretRight size={12} weight="bold" />
        </button>
      </div>
    </div>
  );
}

/* ── main component ── */

export default function DataTable({
  data, columns, highlightRow, dimRow, compact,
  toolbar, emptyState, footer, emptyMinHeight,
  getRowId, pageSize: defaultPageSize,
}) {
  var [sorting, setSorting] = useState([]);
  var [hoveredRowId, setHoveredRowId] = useState(null);
  var [hoveredColId, setHoveredColId] = useState(null);
  var [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: defaultPageSize || 10,
  });

  var table = useReactTable({
    data: data,
    columns: columns,
    state: { sorting: sorting, pagination: pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: getRowId,
  });

  var rowH = compact ? 48 : 72;
  var thH = compact ? 36 : 44;
  var rows = table.getRowModel().rows;
  var isEmpty = data.length === 0;

  var hasColumnFooters = columns.some(function (c) { return !!c.footer; });

  var totalRows = table.getFilteredRowModel().rows.length;
  var pageCount = table.getPageCount();
  var showPagination = totalRows > 0;

  var pageSizeOptions = [5, 10, 25, 50];
  /* ensure current pageSize is in the list */
  if (pageSizeOptions.indexOf(pagination.pageSize) === -1) {
    pageSizeOptions.push(pagination.pageSize);
    pageSizeOptions.sort(function (a, b) { return a - b; });
  }

  return (
    <div style={{
      border: "1px solid var(--border)",
      borderRadius: "var(--r-lg)",
      overflow: "hidden",
      background: "var(--bg-card)",
    }}>
      {/* ── Toolbar ── */}
      {toolbar ? (
        <div style={{
          paddingTop: 12, paddingBottom: 12, paddingLeft: 24, paddingRight: 24,
          borderBottom: "1px solid var(--border-light)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "var(--sp-3)", flexWrap: "wrap",
        }}>
          {toolbar}
        </div>
      ) : null}

      {/* ── Table ── */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            {table.getHeaderGroups().map(function (hg) {
              return (
                <tr key={hg.id}>
                  {hg.headers.map(function (header) {
                    var meta = header.column.columnDef.meta || {};
                    var align = meta.align || "left";
                    var sorted = header.column.getIsSorted();
                    var canSort = header.column.getCanSort();
                    var isColHovered = hoveredColId === header.id;
                    var justify = align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start";
                    var headerColor = sorted ? "var(--brand)" : (canSort && isColHovered) ? "var(--text-primary)" : "var(--text-muted)";
                    return (
                      <th
                        key={header.id}
                        scope="col"
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        onMouseEnter={canSort ? function () { setHoveredColId(header.id); } : undefined}
                        onMouseLeave={canSort ? function () { setHoveredColId(null); } : undefined}
                        style={Object.assign({}, thBase,
                          { height: thH, color: headerColor, cursor: canSort ? "pointer" : "default", whiteSpace: "nowrap", transition: "color 0.12s" },
                          meta.width ? { width: meta.width } : null,
                          meta.minWidth ? { minWidth: meta.minWidth } : null,
                          meta.compactPadding ? { paddingLeft: 16, paddingRight: 16 } : null
                        )}
                      >
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: justify,
                          gap: 4, height: "100%",
                        }}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort ? (
                            sorted === "asc" ? <CaretUp size={12} weight="bold" />
                            : sorted === "desc" ? <CaretDown size={12} weight="bold" />
                            : <CaretUpDown size={12} weight="bold" style={{ opacity: isColHovered ? 0.7 : 0.35, transition: "opacity 0.12s" }} />
                          ) : null}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              );
            })}
          </thead>
          {!isEmpty ? (
            <tbody>
              {rows.map(function (row) {
                var highlight = highlightRow ? highlightRow(row.original) : false;
                var dim = dimRow ? dimRow(row.original) : false;
                var isHovered = hoveredRowId === row.id;
                var rowBg = highlight ? "var(--brand-bg)" : isHovered ? "var(--bg-hover)" : undefined;
                return (
                  <tr
                    key={row.id}
                    onMouseEnter={function () { setHoveredRowId(row.id); }}
                    onMouseLeave={function () { setHoveredRowId(null); }}
                    style={{ background: rowBg, opacity: dim ? 0.45 : 1, transition: "background 0.12s, opacity 0.15s" }}
                  >
                    {row.getVisibleCells().map(function (cell) {
                      var meta = cell.column.columnDef.meta || {};
                      var align = meta.align || "left";
                      return (
                        <td
                          key={cell.id}
                          style={Object.assign({}, tdBase,
                            { textAlign: align, height: rowH, fontWeight: highlight ? 700 : (meta.bold ? 700 : 400), color: meta.color ? meta.color(cell.row.original) : "var(--text-primary)", whiteSpace: meta.grow ? "normal" : "nowrap" },
                            meta.compactPadding ? { paddingLeft: 16, paddingRight: 16 } : null
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          ) : null}

          {/* ── Column-aligned footer ── */}
          {hasColumnFooters && !isEmpty ? (
            <tfoot>
              {table.getFooterGroups().map(function (fg) {
                return (
                  <tr key={fg.id}>
                    {fg.headers.map(function (header) {
                      var meta = header.column.columnDef.meta || {};
                      var align = meta.align || "left";
                      return (
                        <td key={header.id} style={Object.assign({}, tfBase,
                          { textAlign: align, whiteSpace: meta.grow ? "normal" : "nowrap" },
                          meta.compactPadding ? { paddingLeft: 16, paddingRight: 16 } : null
                        )}>
                          {header.column.columnDef.footer
                            ? flexRender(header.column.columnDef.footer, header.getContext())
                            : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tfoot>
          ) : !hasColumnFooters && footer && !isEmpty ? (
            <tfoot>
              <tr>
                <td colSpan={columns.length} style={{
                  padding: "var(--sp-3) var(--sp-3)",
                  borderTop: "1px solid var(--border)",
                  background: "var(--bg-accordion)",
                }}>
                  {footer}
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>

        {/* ── Empty state ── */}
        {isEmpty && emptyState ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "var(--sp-8) var(--sp-4)",
            minHeight: emptyMinHeight || 200,
            textAlign: "center",
          }}>
            {emptyState}
          </div>
        ) : null}
      </div>

      {/* ── Pagination / row info ── */}
      {showPagination ? (
        <PaginationBar
          totalRows={totalRows}
          pageIndex={pagination.pageIndex} pageCount={pageCount}
          pageSize={pagination.pageSize}
          pageSizeOptions={pageSizeOptions}
          canPrev={table.getCanPreviousPage()}
          canNext={table.getCanNextPage()}
          onPrev={function () { table.previousPage(); }}
          onNext={function () { table.nextPage(); }}
          onPageSizeChange={function (size) {
            setPagination(function () { return { pageIndex: 0, pageSize: size }; });
          }}
          onPageJump={function (idx) {
            setPagination(function (prev) { return { pageIndex: idx, pageSize: prev.pageSize }; });
          }}
        />
      ) : null}

    </div>
  );
}
