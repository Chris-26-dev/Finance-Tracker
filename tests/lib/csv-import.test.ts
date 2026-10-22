import { describe, expect, it } from "vitest";

import {
    buildImportReport,
    detectDateFormat,
    parseImportAmount,
    parseImportDate,
} from "@/lib/csv-import";

describe("parseImportAmount", () => {
    it.each([
        ["12.5", 12_500],
        ["-200.00", -200_000],
        ["$1,234.56", 1_234_560],
        ["-$1,234.56", -1_234_560],
        ["$-12.00", -12_000],
        ["(45.10)", -45_100],
        ["−12.00", -12_000],
        ["12.00-", -12_000],
        ["EUR 99.99", 99_990],
        ["99.99 USD", 99_990],
        ["+7", 7_000],
        ["1.234", 1_234],
    ])("parses %j in dot format", (raw, expected) => {
        expect(parseImportAmount(raw, "dot")).toEqual({ ok: true, value: expected });
    });

    it.each([
        ["1.234,56", 1_234_560],
        ["1 234,56", 1_234_560],
        ["-12,50 €", -12_500],
        ["12,5", 12_500],
    ])("parses %j in comma format", (raw, expected) => {
        expect(parseImportAmount(raw, "comma")).toEqual({ ok: true, value: expected });
    });

    it.each([
        ["", "dot"],
        ["abc", "dot"],
        ["12,50", "dot"], // decimal comma in dot format is not silently reinterpreted
        ["1.234,56", "dot"],
        ["1,234.56", "comma"],
        ["12.3456", "dot"], // more precision than miliunits
        ["0.00", "dot"],
        ["3000000", "dot"], // beyond the storage limit
        ["12 apples", "dot"],
    ] as const)("rejects %j in %s format", (raw, format) => {
        expect(parseImportAmount(raw, format).ok).toBe(false);
    });
});

describe("parseImportDate", () => {
    it("normalises to a calendar day", () => {
        expect(parseImportDate("2025-05-06 20:18:58", "yyyy-MM-dd HH:mm:ss")).toEqual({ ok: true, value: "2025-05-06" });
        expect(parseImportDate("31/01/2025", "dd/MM/yyyy")).toEqual({ ok: true, value: "2025-01-31" });
    });

    it.each([
        ["", "yyyy-MM-dd"],
        ["2025-02-30", "yyyy-MM-dd"],
        ["31/01/2025", "MM/dd/yyyy"],
        ["2025-01-31 extra", "yyyy-MM-dd"],
        ["1850-01-01", "yyyy-MM-dd"],
    ] as const)("rejects %j as %s", (raw, format) => {
        expect(parseImportDate(raw, format).ok).toBe(false);
    });
});

describe("detectDateFormat", () => {
    it("detects an unambiguous format", () => {
        const result = detectDateFormat(["2025-05-06 20:18:58", "2025-05-07 08:00:00"]);
        expect(result).toMatchObject({ detected: "yyyy-MM-dd HH:mm:ss", ambiguous: false });
    });

    it("detects day-first when a day exceeds 12", () => {
        const result = detectDateFormat(["03/04/2025", "25/04/2025"]);
        expect(result.detected).toBe("dd/MM/yyyy");
    });

    it("flags day/month ambiguity instead of guessing", () => {
        const result = detectDateFormat(["03/04/2025", "05/06/2025"]);
        expect(result.detected).toBeNull();
        expect(result.ambiguous).toBe(true);
        expect(result.candidates).toEqual(expect.arrayContaining(["MM/dd/yyyy", "dd/MM/yyyy"]));
    });

    it("reports no candidates for unsupported dates", () => {
        expect(detectDateFormat(["May 6th"]).candidates).toEqual([]);
    });
});

describe("buildImportReport", () => {
    const headers = ["Date", "Description", "Amount", "Memo"];
    const mapping = { date: 0, payee: 1, amount: 2, notes: 3 };

    it("returns valid rows and row-level errors with CSV line numbers", () => {
        const report = buildImportReport({
            headers,
            mapping,
            dateFormat: "yyyy-MM-dd",
            numberFormat: "dot",
            body: [
                ["2025-01-02", "Shop", "-12.00", "snacks"],
                ["2025-01-02", "", "abc", ""],
                ["not a date", "Shop", "5", ""],
                ["2025-01-03", "Short row"],
                ["", "", "", ""],
            ],
        });

        expect(report.rows).toEqual([
            { rowNumber: 2, date: "2025-01-02", amount: -12_000, payee: "Shop", notes: "snacks" },
        ]);
        expect(report.errors.map((error) => error.rowNumber)).toEqual([3, 4, 5]);
        expect(report.errors[0].messages).toEqual(['"abc" is not a valid amount', "Payee is empty"]);
        expect(report.errors[2].messages[0]).toMatch(/Expected 4 columns/);
        expect(report.skippedEmpty).toBe(1);
    });

    it("never includes rows when no date format is chosen", () => {
        const report = buildImportReport({
            headers,
            mapping,
            dateFormat: null,
            numberFormat: "dot",
            body: [["03/04/2025", "Shop", "1", ""]],
        });
        expect(report.rows).toEqual([]);
        expect(report.errors[0].messages).toContain("Choose a date format");
    });

    it("flags later identical rows as possible duplicates", () => {
        const report = buildImportReport({
            headers,
            mapping,
            dateFormat: "yyyy-MM-dd",
            numberFormat: "dot",
            body: [
                ["2025-01-02", "Cafe", "-3.50", ""],
                ["2025-01-02", "cafe", "-3.50", "again"],
                ["2025-01-02", "Cafe", "-4.00", ""],
            ],
        });
        expect(report.rows).toHaveLength(3);
        expect(report.duplicateRowNumbers).toEqual([3]);
    });
});
