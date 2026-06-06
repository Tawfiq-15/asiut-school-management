/**
 * useExport — client-side CSV download from any data array.
 *
 * Usage:
 *   const { exportCSV, exporting } = useExport();
 *   exportCSV({ data: rows, columns: ["name","email"], filename: "students" });
 */

import { useCallback, useState } from "react";

interface ExportColumn {
  key: string;
  label: string;
  /** Optional value transformer applied before writing to the CSV cell. */
  format?: (value: unknown, row: Record<string, unknown>) => string;
}

interface ExportOptions {
  data: Record<string, unknown>[];
  columns: ExportColumn[];
  filename?: string;
}

export function useExport() {
  const [exporting, setExporting] = useState(false);

  const exportCSV = useCallback(({ data, columns, filename = "export" }: ExportOptions) => {
    if (!data.length) return;
    setExporting(true);

    try {
      const header = columns.map((c) => escapeCsvCell(c.label)).join(",");
      const rows = data.map((row) =>
        columns
          .map((c) => {
            const raw = getNestedValue(row, c.key);
            const cell = c.format ? c.format(raw, row) : String(raw ?? "");
            return escapeCsvCell(cell);
          })
          .join(",")
      );
      const csv = [header, ...rows].join("\r\n");
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, []);

  return { exportCSV, exporting };
}

/** Wraps a cell value in quotes and escapes internal quotes per RFC 4180. */
function escapeCsvCell(value: string): string {
  const str = String(value ?? "").replace(/"/g, '""');
  return `"${str}"`;
}

/** Supports dot-notation keys such as "user.first_name". */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}
