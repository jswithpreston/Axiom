"use client";

import { type ReactNode } from "react";
import clsx from "clsx";

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export default function Table<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  emptyMessage = "No data available",
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-axiom-bg">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                style={col.width ? { width: col.width } : undefined}
                className="px-4 py-3 text-left text-xs uppercase tracking-wider text-axiom-muted"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm text-axiom-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={clsx(
                  "border-b border-axiom-border transition-colors duration-150",
                  "hover:bg-axiom-bg/50",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className="px-4 py-3 text-sm text-axiom-text"
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
