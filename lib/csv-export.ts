type Cell = string | number | null | undefined;

// Spreadsheet apps execute cells starting with these characters as formulas.
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

const escapeCell = (value: Cell) => {
    if (value === null || value === undefined) return "";

    let text = String(value);

    // Neutralise formula injection in text cells; numbers are left as-is.
    if (typeof value === "string" && FORMULA_PREFIX.test(text)) {
        text = `'${text}`;
    }

    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** RFC 4180 CSV with CRLF line endings. */
export function toCsv(headers: string[], rows: Cell[][]) {
    return [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
    // BOM so spreadsheet apps detect UTF-8.
    const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
