import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { CaretUp, CaretDown, CaretUpDown, CaretLeft, CaretRight } from "@phosphor-icons/react";

/* ── base styles ── */

var thBase = {
  fontSize: 12, fontWeight: 500, color: "var(--text-muted)",
  padding: "0 var(--sp-3)",
  height: 44,
  borderBottom: "1px solid var(--border)",
  whiteSpace: "nowrap", userSelect: "none",
  transition: "color 0.12s",
  textTransform: "none", letterSpacing: 0,
  background: "var(--bg-accordion)",
  verticalAlign: "middle",
};

var tdBase = {
  fontSize: 13, fontVariantNumeric: "tabular-nums",
  padding: "0 var(--sp-3)",
  height: 48,
  borderBottom: "1px solid var(--border-light)",
  color: "var(--text-primary)",
  verticalAlign: "middle",
};

var tfBase = {
  fontSize: 13, fontVariantNumeric: "tabular-nums",
  padding: "0 var(--sp-3)",
  height: 44,
  borderTop: "1px solid var(--border)",
  background: "var(--bg-accordion)",
  verticalAlign: "middle",
};

/* ── main component ── */

export default function DataTable({
  data, columns, highlightRow, dimRow, compact,
  toolbar, emptyState, footer, emptyMinHeight,
  getRowId, pageSize: defaultPageSize,
}) {
  var [sorting, setSorting] = useState([]);
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

  var rowH = compact ? 40 : 48;
  var thH = compact ? 36 : 44;
  var rows = table.getRowModel().rows;
  var isEmpty = data.length === 0;

  var hasColumnFooters = columns.some(function (c) { return !!c.footer; });

  var totalRows = table.getFilteredRowModel().rows.length;
  var pageCount = table.getPageCount();
  var showPagination = totalRows > pagination.pageSize;
  var from = totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  var to = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows);

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
          padding: "var(--sp-3) var(--sp-4)",
          borderBottom: "1px solid var(--border-light)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "var(--sp-3)", flexWrap: "wrap",
        }}>
          {toolbar}
        </div>
      ) : null}

      {/* ── Table ── */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            {table.getHeaderGroups().map(function (hg) {
              return (
                <tr key={hg.id}>
                  {hg.headers.map(function (header) {
                    var meta = header.column.columnDef.meta || {};
                    var align = meta.align || "left";
                    var sorted = header.column.getIsSorted();
                    var canSort = header.column.getCanSort();
                    var justify = align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start";
                    return (
                      <th
                        key={header.id}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        style={Object.assign({}, thBase, {
                          height: thH,
                          color: sorted ? "var(--brand)" : "var(--text-muted)",
                          cursor: canSort ? "pointer" : "default",
                          width: meta.width || undefined,
                          minWidth: meta.minWidth || undefined,
                        })}
                      >
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: justify,
                          gap: 4, height: "100%",
                        }}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort ? (
                            sorted === "asc" ? <CaretUp size={12} weight="bold" />
                            : sorted === "desc" ? <CaretDown size={12} weight="bold" />
                            : <CaretUpDown size={12} weight="bold" style={{ opacity: 0.35 }} />
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
                return (
                  <tr key={row.id} style={{ background: highlight ? "var(--brand-bg)" : undefined, opacity: dim ? 0.45 : 1, transition: "background 0.1s, opacity 0.15s" }}>
                    {row.getVisibleCells().map(function (cell) {
                      var meta = cell.column.columnDef.meta || {};
                      var align = meta.align || "left";
                      return (
                        <td
                          key={cell.id}
                          style={Object.assign({}, tdBase, {
                            textAlign: align,
                            height: rowH,
                            fontWeight: highlight ? 700 : (meta.bold ? 700 : 400),
                            color: meta.color ? meta.color(cell.row.original) : "var(--text-primary)",
                          })}
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
                        <td key={header.id} style={Object.assign({}, tfBase, {
                          textAlign: align,
                        })}>
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

      {/* ── Pagination ── */}
      {showPagination ? (
        <div style={{
          padding: "var(--sp-3) var(--sp-4)",
          borderTop: "1px solid var(--border-light)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 13, color: "var(--text-muted)",
        }}>
          <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
            {from}–{to} / {totalRows}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
            <button
              type="button"
              onClick={function () { table.previousPage(); }}
              disabled={!table.getCanPreviousPage()}
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 32, height: 32,
                padding: 0, border: "1px solid var(--border)",
                borderRadius: "var(--r-md)",
                background: "var(--bg-card)",
                color: table.getCanPreviousPage() ? "var(--text-secondary)" : "var(--text-ghost)",
                cursor: table.getCanPreviousPage() ? "pointer" : "default",
                opacity: table.getCanPreviousPage() ? 1 : 0.5,
                transition: "opacity 0.12s",
              }}
              aria-label="Previous page"
            >
              <CaretLeft size={14} weight="bold" />
            </button>
            <span style={{ fontSize: 12, color: "var(--text-secondary)", padding: "0 var(--sp-1)", fontVariantNumeric: "tabular-nums" }}>
              {pagination.pageIndex + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={function () { table.nextPage(); }}
              disabled={!table.getCanNextPage()}
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 32, height: 32,
                padding: 0, border: "1px solid var(--border)",
                borderRadius: "var(--r-md)",
                background: "var(--bg-card)",
                color: table.getCanNextPage() ? "var(--text-secondary)" : "var(--text-ghost)",
                cursor: table.getCanNextPage() ? "pointer" : "default",
                opacity: table.getCanNextPage() ? 1 : 0.5,
                transition: "opacity 0.12s",
              }}
              aria-label="Next page"
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      ) : null}

    </div>
  );
}
