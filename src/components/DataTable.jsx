import { useState, useMemo, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { CaretUp, CaretDown, CaretUpDown, CaretLeft, CaretRight, Check, Minus } from "@phosphor-icons/react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { useLang } from "../context";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

/* ── Inject simplebar theme override once ── */
var sbInjected = false;
function injectSbCSS() {
  if (sbInjected) return;
  sbInjected = true;
  var el = document.createElement("style");
  el.textContent = [
    ".fc-sb .simplebar-scrollbar::before { background: var(--border-strong); border-radius: 99px; opacity: 0.4; }",
    ".fc-sb .simplebar-scrollbar.simplebar-hover::before, .fc-sb .simplebar-scrollbar.simplebar-visible::before { background: var(--text-muted); opacity: 1; }",
    ".fc-sb .simplebar-track.simplebar-horizontal { height: 12px; background: transparent; transition: height 0.2s ease, background 0.2s ease; border-radius: 99px; left: 8px; right: 8px; width: auto; }",
    ".fc-sb .simplebar-track.simplebar-horizontal:hover { height: 20px; background: var(--bg-accordion); }",
    ".fc-sb .simplebar-track.simplebar-horizontal:hover .simplebar-scrollbar::before { background: var(--text-muted); opacity: 1; }",
    ".fc-sb .simplebar-track.simplebar-vertical { display: none; }",
  ].join("\n");
  document.head.appendChild(el);
}

/* ── Scroll wrapper: SimpleBar when scrollable, plain div otherwise ── */
function ScrollWrap({ scrollable, children }) {
  if (scrollable) {
    return (
      <SimpleBar className="fc-sb" style={{ overflowX: "auto", paddingBottom: 16 }} autoHide={true}>
        {children}
      </SimpleBar>
    );
  }
  return <div style={{ overflowX: "auto" }}>{children}</div>;
}

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

/* ── Checkbox ── */

function RowCheckbox({ checked, mixed, onChange }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={mixed ? "mixed" : checked}
      onClick={function (e) { e.stopPropagation(); onChange(); }}
      style={{
        width: 20, height: 20, borderRadius: 5, flexShrink: 0,
        border: checked || mixed ? "1.5px solid var(--brand)" : "1.5px solid var(--border-strong)",
        background: checked || mixed ? "var(--brand)" : "var(--bg-card)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.12s", padding: 0,
      }}
    >
      {checked && !mixed ? (
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path d="M1.5 5L4.5 8L10.5 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : mixed ? (
        <Minus size={12} weight="bold" color="white" />
      ) : null}
    </button>
  );
}

/* ── Selection action bar ── */

function SelectionBar({ count, onDeselectAll, onDelete, lang, deleteLabel, extraActions }) {
  var isFr = lang !== "en";
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      paddingLeft: 24, paddingRight: 24,
      height: 68,
      background: "var(--brand)",
      borderTop: "1px solid var(--brand)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "white" }}>
          {count} {isFr ? (count > 1 ? "sélectionnés" : "sélectionné") : "selected"}
        </span>
        <button
          type="button"
          onClick={onDeselectAll}
          style={{
            border: "none", background: "none",
            color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 500,
            cursor: "pointer", fontFamily: "inherit",
            padding: 0,
          }}
        >
          {isFr ? "Tout désélectionner" : "Deselect all"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            style={{
              height: 40, padding: "0 20px",
              display: "inline-flex", alignItems: "center",
              border: "2px solid rgba(255,255,255,0.6)",
              borderRadius: "var(--r-md)",
              background: "transparent",
              color: "white", fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
              transition: "background 0.12s, border-color 0.12s",
            }}
            onMouseEnter={function (e) { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.borderColor = "white"; }}
            onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)"; }}
          >
            {deleteLabel || (isFr ? "Supprimer" : "Delete")}
          </button>
        ) : null}
        {extraActions || null}
      </div>
    </div>
  );
}

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
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
        <span style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{rowsLabel}</span>
        <PageSizeDropdown value={pageSize} options={pageSizeOptions} onChange={onPageSizeChange} />
      </div>

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
          onChange={function (num) { onPageJump(num - 1); }}
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

/**
 * DataTable props (new):
 * - selectable: boolean — enable checkbox column + selection bar
 * - onDeleteSelected: function(selectedIds[]) — called when bulk delete is clicked
 * - isRowSelectable: function(row) — optional, returns false to disable checkbox for a row (e.g. _readOnly)
 */
export default function DataTable({
  data, columns, highlightRow, dimRow, compact,
  toolbar, emptyState, footer, emptyMinHeight,
  getRowId, pageSize: defaultPageSize,
  selectable, onDeleteSelected, isRowSelectable, deleteSelectedLabel, selectionExtraActions,
  scrollable,
}) {
  var { lang } = useLang();
  useEffect(function () { if (scrollable) injectSbCSS(); }, [scrollable]);
  var [sorting, setSorting] = useState([]);
  var [hoveredRowId, setHoveredRowId] = useState(null);
  var [hoveredColId, setHoveredColId] = useState(null);
  var [selectedIds, setSelectedIds] = useState({});
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
  if (pageSizeOptions.indexOf(pagination.pageSize) === -1) {
    pageSizeOptions.push(pagination.pageSize);
    pageSizeOptions.sort(function (a, b) { return a - b; });
  }

  /* ── Selection logic ── */
  var selectableRowIds = useMemo(function () {
    if (!selectable) return [];
    return rows.filter(function (row) {
      if (isRowSelectable && !isRowSelectable(row.original)) return false;
      return true;
    }).map(function (row) { return row.id; });
  }, [rows, selectable, isRowSelectable]);

  var selectedCount = 0;
  selectableRowIds.forEach(function (id) { if (selectedIds[id]) selectedCount++; });
  var allSelected = selectableRowIds.length > 0 && selectedCount === selectableRowIds.length;
  var someSelected = selectedCount > 0 && !allSelected;
  var hasSelection = selectedCount > 0;

  function toggleRow(rowId) {
    setSelectedIds(function (prev) {
      var next = Object.assign({}, prev);
      if (next[rowId]) { delete next[rowId]; } else { next[rowId] = true; }
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds({});
    } else {
      var next = {};
      selectableRowIds.forEach(function (id) { next[id] = true; });
      setSelectedIds(next);
    }
  }

  function deselectAll() { setSelectedIds({}); }

  var [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  var [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);

  function requestDeleteSelected() {
    if (skipDeleteConfirm) {
      executeDeleteSelected();
    } else {
      setShowDeleteConfirm(true);
    }
  }

  function executeDeleteSelected() {
    if (!onDeleteSelected) return;
    var ids = [];
    Object.keys(selectedIds).forEach(function (id) { if (selectedIds[id]) ids.push(id); });
    onDeleteSelected(ids);
    setSelectedIds({});
    setShowDeleteConfirm(false);
  }

  /* ── Checkbox column width ── */
  var checkboxColW = 56;

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
      <ScrollWrap scrollable={scrollable}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            {table.getHeaderGroups().map(function (hg) {
              return (
                <tr key={hg.id}>
                  {selectable ? (
                    <th style={Object.assign({}, thBase, { height: thH, width: checkboxColW, minWidth: checkboxColW, maxWidth: checkboxColW, paddingLeft: 24, paddingRight: 0 })}>
                      <RowCheckbox
                        checked={allSelected}
                        mixed={someSelected}
                        onChange={toggleAll}
                      />
                    </th>
                  ) : null}
                  {hg.headers.map(function (header, hIdx) {
                    var meta = header.column.columnDef.meta || {};
                    var align = meta.align || "left";
                    var sorted = header.column.getIsSorted();
                    var canSort = header.column.getCanSort();
                    var isColHovered = hoveredColId === header.id;
                    var justify = align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start";
                    var headerColor = sorted ? "var(--brand)" : (canSort && isColHovered) ? "var(--text-primary)" : "var(--text-muted)";
                    var isFirstCol = selectable && hIdx === 0;
                    return (
                      <th
                        key={header.id}
                        scope="col"
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        onMouseEnter={canSort ? function () { setHoveredColId(header.id); } : undefined}
                        onMouseLeave={canSort ? function () { setHoveredColId(null); } : undefined}
                        style={Object.assign({}, thBase,
                          { height: thH, color: headerColor, cursor: canSort ? "pointer" : "default", whiteSpace: "nowrap", transition: "color 0.12s" },
                          isFirstCol ? { paddingLeft: 12 } : null,
                          meta.width ? { width: meta.width } : null,
                          meta.minWidth ? { minWidth: meta.minWidth } : null,
                          meta.compactPadding ? { paddingLeft: 16, paddingRight: 16 } : null,
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
                var isSelected = selectable && selectedIds[row.id];
                var canSelect = selectable && (!isRowSelectable || isRowSelectable(row.original));
                var rowBg = isSelected ? "var(--brand-bg)" : highlight ? "var(--brand-bg)" : isHovered ? "var(--bg-hover)" : undefined;
                return (
                  <tr
                    key={row.id}
                    onMouseEnter={function () { setHoveredRowId(row.id); }}
                    onMouseLeave={function () { setHoveredRowId(null); }}
                    style={{ background: rowBg, opacity: dim ? 0.45 : 1, transition: "background 0.12s, opacity 0.15s" }}
                  >
                    {selectable ? (
                      <td style={Object.assign({}, tdBase, { height: rowH, width: checkboxColW, minWidth: checkboxColW, maxWidth: checkboxColW, paddingLeft: 24, paddingRight: 0 })}>
                        {canSelect ? (
                          <RowCheckbox checked={!!isSelected} onChange={function () { toggleRow(row.id); }} />
                        ) : null}
                      </td>
                    ) : null}
                    {row.getVisibleCells().map(function (cell, cIdx) {
                      var meta = cell.column.columnDef.meta || {};
                      var align = meta.align || "left";
                      var isFirstCol = selectable && cIdx === 0;
                      return (
                        <td
                          key={cell.id}
                          style={Object.assign({}, tdBase,
                            { textAlign: align, height: rowH, fontWeight: highlight ? 700 : (meta.bold ? 700 : 400), color: meta.color ? meta.color(cell.row.original) : "var(--text-primary)", whiteSpace: meta.grow ? "normal" : "nowrap" },
                            isFirstCol ? { paddingLeft: 12 } : null,
                            meta.compactPadding ? { paddingLeft: 16, paddingRight: 16 } : null,
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

          {/* ── Column-aligned footer (hidden when selection active) ── */}
          {hasColumnFooters && !isEmpty && !hasSelection ? (
            <tfoot>
              {table.getFooterGroups().map(function (fg) {
                return (
                  <tr key={fg.id}>
                    {selectable ? <td style={Object.assign({}, tfBase, { width: checkboxColW, minWidth: checkboxColW, maxWidth: checkboxColW, paddingLeft: 24, paddingRight: 0 })} /> : null}
                    {fg.headers.map(function (header, fIdx) {
                      var meta = header.column.columnDef.meta || {};
                      var align = meta.align || "left";
                      var isFirstCol = selectable && fIdx === 0;
                      return (
                        <td key={header.id} style={Object.assign({}, tfBase,
                          { textAlign: align, whiteSpace: meta.grow ? "normal" : "nowrap" },
                          isFirstCol ? { paddingLeft: 12 } : null,
                          meta.compactPadding ? { paddingLeft: 16, paddingRight: 16 } : null,
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
          ) : !hasColumnFooters && footer && !isEmpty && !hasSelection ? (
            <tfoot>
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} style={{
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
      </ScrollWrap>

      {/* ── Selection bar (replaces total footer row, before pagination) ── */}
      {hasSelection ? (
        <SelectionBar
          count={selectedCount}
          onDeselectAll={deselectAll}
          onDelete={onDeleteSelected ? requestDeleteSelected : null}
          lang={lang}
          deleteLabel={deleteSelectedLabel}
          extraActions={typeof selectionExtraActions === "function" ? selectionExtraActions(selectedIds) : selectionExtraActions}
        />
      ) : null}

      {/* ── Bulk delete confirmation modal ── */}
      {showDeleteConfirm ? (
        <ConfirmDeleteModal
          onConfirm={executeDeleteSelected}
          onCancel={function () { setShowDeleteConfirm(false); }}
          skipNext={skipDeleteConfirm}
          setSkipNext={setSkipDeleteConfirm}
          t={{
            confirm_title: (deleteSelectedLabel || (lang !== "en" ? "Supprimer" : "Delete")) + " " + selectedCount + (lang !== "en" ? " élément" + (selectedCount > 1 ? "s" : "") + " ?" : " item" + (selectedCount > 1 ? "s" : "") + "?"),
            confirm_body: lang !== "en" ? "Cette action est irréversible." : "This action cannot be undone.",
            confirm_skip: lang !== "en" ? "Ne plus demander" : "Don't ask again",
            cancel: lang !== "en" ? "Annuler" : "Cancel",
            delete: deleteSelectedLabel || (lang !== "en" ? "Supprimer" : "Delete"),
          }}
        />
      ) : null}

      {/* ── Pagination (always visible) ── */}
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
