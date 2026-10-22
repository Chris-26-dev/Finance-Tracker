import { describe, expect, it } from "vitest";

import { toCsv } from "@/lib/csv-export";
import { buildImportReport } from "@/lib/csv-import";

describe("toCsv", () => {
    it("quotes commas, quotes and newlines", () => {
        expect(toCsv(["a", "b"], [["Smith, J", 'say "hi"'], ["line\nbreak", null]]))
            .toBe('a,b\r\n"Smith, J","say ""hi"""\r\n"line\nbreak",');
    });

    it("neutralises spreadsheet formulas in text cells", () => {
        expect(toCsv(["payee"], [["=HYPERLINK(\"x\")"], ["@SUM(A1)"], ["+1"], ["-cmd"]]))
            .toBe("payee\r\n\"'=HYPERLINK(\"\"x\"\")\"\r\n'@SUM(A1)\r\n'+1\r\n'-cmd");
    });

    it("leaves numeric amounts untouched", () => {
        expect(toCsv(["amount"], [[-12.5], [3]])).toBe("amount\r\n-12.5\r\n3");
    });

    it("produces files the importer can read back", () => {
        const csv = toCsv(["Date", "Payee", "Amount", "Notes"], [["2025-03-01", "Cafe, Downtown", -4.5, "latte"]]);
        const [headers, ...body] = csv.split("\r\n").map((line) => {
            // Minimal CSV split for this fixture (one quoted field).
            const cells: string[] = [];
            line.replace(/("([^"]|"")*"|[^,]*)(,|$)/g, (_m, cell: string) => {
                cells.push(cell.startsWith('"') ? cell.slice(1, -1).replace(/""/g, '"') : cell);
                return "";
            });
            return cells.slice(0, 4);
        });

        const report = buildImportReport({
            headers,
            body,
            mapping: { date: 0, payee: 1, amount: 2, notes: 3 },
            dateFormat: "yyyy-MM-dd",
            numberFormat: "dot",
        });
        expect(report.errors).toEqual([]);
        expect(report.rows[0]).toMatchObject({ date: "2025-03-01", payee: "Cafe, Downtown", amount: -4_500, notes: "latte" });
    });
});
