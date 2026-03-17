import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import { CaretUp, CaretDown } from "@phosphor-icons/react";

var thBase = {
  fontSize: 11, fontWeight: 600, color: "var(--text-muted)",
  padding: "var(--sp-2) var(--sp-2)", borderBottom: "1px solid var(--border)",
  whiteSpace: "nowrap", cursor: "pointer", userSelect: "none",
  transition: "color 0.12s",
};

var tdBase = {
  fontSize: 12, fontVariantNumeric: "tabular-nums",
  padding: "var(--sp-2) var(--sp-2)", borderBottom: "1px solid var(--border-light)",
  color: "var(--text-primary)",
};

export default function DataTable({ data, columns, highlightRow, compact }) {
  var [sorting, setSorting] = useState([]);

  var table = useReactTable({
    data: data,
    columns: columns,
    state: { sorting: sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  var pad = compact ? "var(--sp-1) var(--sp-2)" : "var(--sp-2) var(--sp-2)";

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          {table.getHeaderGroups().map(function (hg) {
            return (
              <tr key={hg.id}>
                {hg.headers.map(function (header) {
                  var meta = header.column.columnDef.meta || {};
                  var align = meta.align || "right";
                  var sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{
                        ...thBase,
                        textAlign: align,
                        padding: pad,
                        color: sorted ? "var(--brand)" : "var(--text-muted)",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted === "asc" ? <CaretUp size={10} weight="bold" /> : null}
                        {sorted === "desc" ? <CaretDown size={10} weight="bold" /> : null}
                      </span>
                    </th>
                  );
                })}
              </tr>
            );
          })}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(function (row) {
            var highlight = highlightRow ? highlightRow(row.original) : false;
            return (
              <tr key={row.id} style={{ background: highlight ? "var(--brand-bg)" : undefined }}>
                {row.getVisibleCells().map(function (cell) {
                  var meta = cell.column.columnDef.meta || {};
                  var align = meta.align || "right";
                  return (
                    <td
                      key={cell.id}
                      style={{
                        ...tdBase,
                        textAlign: align,
                        padding: pad,
                        fontWeight: highlight ? 700 : (meta.bold ? 700 : 400),
                        color: meta.color ? meta.color(cell.row.original) : "var(--text-primary)",
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
