import { format, isValid, parse } from "date-fns";

import {
    MAX_AMOUNT_MILIUNITS,
    MAX_NOTES_LENGTH,
    MAX_PAYEE_LENGTH,
} from "@/db/schema";

export const IMPORT_FIELDS = ["date", "payee", "amount", "notes"] as const;
export const REQUIRED_IMPORT_FIELDS = ["date", "payee", "amount"] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];

/** Explicitly supported date formats. Anything else is rejected. */
export const DATE_FORMATS = [
    { value: "yyyy-MM-dd", example: "2025-01-31" },
    { value: "yyyy-MM-dd HH:mm:ss", example: "2025-01-31 14:05:00" },
    { value: "yyyy-MM-dd'T'HH:mm:ss", example: "2025-01-31T14:05:00" },
    { value: "yyyy/MM/dd", example: "2025/01/31" },
    { value: "MM/dd/yyyy", example: "01/31/2025 (month first)" },
    { value: "dd/MM/yyyy", example: "31/01/2025 (day first)" },
    { value: "MM-dd-yyyy", example: "01-31-2025 (month first)" },
    { value: "dd-MM-yyyy", example: "31-01-2025 (day first)" },
    { value: "dd.MM.yyyy", example: "31.01.2025" },
] as const;

export type DateFormat = (typeof DATE_FORMATS)[number]["value"];

/**
 * "dot": 1,234.56 (comma thousands, dot decimal)
 * "comma": 1.234,56 (dot or space thousands, comma decimal)
 */
export type NumberFormat = "dot" | "comma";

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;
const MAX_DECIMALS = 3; // amounts are stored in miliunits

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** Parse a date with one explicit format into a `yyyy-MM-dd` calendar day. */
export function parseImportDate(raw: string, dateFormat: DateFormat): Result<string> {
    const value = raw.trim();

    if (!value) {
        return { ok: false, error: "Date is empty" };
    }

    const date = parse(value, dateFormat, new Date(2000, 0, 1));

    if (!isValid(date)) {
        return { ok: false, error: `"${value}" doesn't match ${dateFormat}` };
    }

    const year = date.getFullYear();
    if (year < MIN_YEAR || year > MAX_YEAR) {
        return { ok: false, error: `Year ${year} is out of range` };
    }

    return { ok: true, value: format(date, "yyyy-MM-dd") };
}

/**
 * Formats that parse every non-empty value. When several formats parse all
 * values but disagree on the resulting dates (e.g. 03/04/2025), the column
 * is ambiguous and the user must choose explicitly.
 */
export function detectDateFormat(values: string[]): {
    candidates: DateFormat[];
    detected: DateFormat | null;
    ambiguous: boolean;
} {
    const sample = values.map((value) => value.trim()).filter(Boolean);

    if (sample.length === 0) {
        return { candidates: [], detected: null, ambiguous: false };
    }

    const parsed = DATE_FORMATS.map(({ value: fmt }) => {
        const days: string[] = [];
        for (const value of sample) {
            const result = parseImportDate(value, fmt);
            if (!result.ok) return null;
            days.push(result.value);
        }
        return { fmt, key: days.join("|") };
    }).filter((entry): entry is { fmt: DateFormat; key: string } => entry !== null);

    const candidates = parsed.map((entry) => entry.fmt);
    const distinctResults = new Set(parsed.map((entry) => entry.key));

    if (parsed.length === 0) {
        return { candidates, detected: null, ambiguous: false };
    }

    if (distinctResults.size === 1) {
        return { candidates, detected: parsed[0].fmt, ambiguous: false };
    }

    return { candidates, detected: null, ambiguous: true };
}

const NUMBER_PATTERNS: Record<NumberFormat, { pattern: RegExp; group: RegExp; decimal: string }> = {
    dot: {
        pattern: /^(\d{1,3}(,\d{3})+|\d+)(\.\d+)?$|^\.\d+$/,
        group: /,/g,
        decimal: ".",
    },
    comma: {
        pattern: /^(\d{1,3}([. ]\d{3})+|\d+)(,\d+)?$|^,\d+$/,
        group: /[. ]/g,
        decimal: ",",
    },
};

/** Parse a (possibly currency-formatted) amount into integer miliunits. */
export function parseImportAmount(raw: string, numberFormat: NumberFormat): Result<number> {
    let value = raw.trim().replace(/ /g, " ");

    if (!value) {
        return { ok: false, error: "Amount is empty" };
    }

    let negative = false;

    if (/^\(.*\)$/.test(value)) {
        negative = true;
        value = value.slice(1, -1).trim();
    }

    // Leading/trailing sign, including the Unicode minus sign.
    const sign = /^([+\-−])\s*|\s*([+\-−])$/;
    const signMatch = value.match(sign);
    if (signMatch) {
        const symbol = signMatch[1] ?? signMatch[2];
        if (symbol !== "+") negative = !negative;
        value = value.replace(sign, "");
    }

    // A single currency symbol or ISO code before or after the number.
    value = value
        .replace(/^(\p{Sc}|[A-Z]{3})\s*/u, "")
        .replace(/\s*(\p{Sc}|[A-Z]{3})$/u, "")
        .trim();

    // Sign may also follow the currency symbol, e.g. "$-12.00".
    const innerSign = value.match(/^([\-−])\s*/);
    if (innerSign) {
        negative = !negative;
        value = value.replace(/^([\-−])\s*/, "");
    }

    const { pattern, group, decimal } = NUMBER_PATTERNS[numberFormat];

    if (!pattern.test(value)) {
        return { ok: false, error: `"${raw.trim()}" is not a valid amount` };
    }

    const [, decimals = ""] = value.replace(group, "").split(decimal);
    if (decimals.length > MAX_DECIMALS) {
        return { ok: false, error: `"${raw.trim()}" has too many decimal places` };
    }

    const normalized = value.replace(group, "").replace(decimal, ".");
    const miliunits = Math.round(Number(normalized) * 1000) * (negative ? -1 : 1);

    if (!Number.isFinite(miliunits)) {
        return { ok: false, error: `"${raw.trim()}" is not a valid amount` };
    }
    if (miliunits === 0) {
        return { ok: false, error: "Amount cannot be zero" };
    }
    if (Math.abs(miliunits) > MAX_AMOUNT_MILIUNITS) {
        return { ok: false, error: `"${raw.trim()}" is too large` };
    }

    // Normalise -0 and keep an integer.
    return { ok: true, value: miliunits };
}

export type ColumnMapping = Partial<Record<ImportField, number>>;

export type ImportRow = {
    rowNumber: number;
    date: string;
    amount: number;
    payee: string;
    notes: string | null;
};

export type ImportReport = {
    rows: ImportRow[];
    errors: { rowNumber: number; messages: string[] }[];
    duplicateRowNumbers: number[];
    skippedEmpty: number;
};

/**
 * Validate every body row against the column mapping and formats. Row
 * numbers are 1-based CSV line numbers (the header is row 1). Rows with any
 * error are never included in `rows`.
 */
export function buildImportReport({
    headers,
    body,
    mapping,
    dateFormat,
    numberFormat,
}: {
    headers: string[];
    body: string[][];
    mapping: ColumnMapping;
    dateFormat: DateFormat | null;
    numberFormat: NumberFormat;
}): ImportReport {
    const report: ImportReport = {
        rows: [],
        errors: [],
        duplicateRowNumbers: [],
        skippedEmpty: 0,
    };
    const seen = new Set<string>();

    body.forEach((cells, index) => {
        const rowNumber = index + 2;

        if (cells.every((cell) => !cell || !cell.trim())) {
            report.skippedEmpty += 1;
            return;
        }

        const messages: string[] = [];

        if (cells.length !== headers.length) {
            messages.push(`Expected ${headers.length} columns but found ${cells.length}`);
        }

        const cell = (field: ImportField) => {
            const columnIndex = mapping[field];
            return columnIndex === undefined ? "" : (cells[columnIndex] ?? "");
        };

        let date: string | undefined;
        if (!dateFormat) {
            messages.push("Choose a date format");
        } else {
            const parsedDate = parseImportDate(cell("date"), dateFormat);
            if (parsedDate.ok) date = parsedDate.value;
            else messages.push(parsedDate.error);
        }

        const parsedAmount = parseImportAmount(cell("amount"), numberFormat);
        if (!parsedAmount.ok) messages.push(parsedAmount.error);

        const payee = cell("payee").trim();
        if (!payee) messages.push("Payee is empty");
        else if (payee.length > MAX_PAYEE_LENGTH) messages.push(`Payee is longer than ${MAX_PAYEE_LENGTH} characters`);

        const notes = mapping.notes === undefined ? "" : cell("notes").trim();
        if (notes.length > MAX_NOTES_LENGTH) messages.push(`Notes are longer than ${MAX_NOTES_LENGTH} characters`);

        if (messages.length > 0 || !date || !parsedAmount.ok) {
            report.errors.push({ rowNumber, messages });
            return;
        }

        const key = `${date}|${parsedAmount.value}|${payee.toLowerCase()}`;
        if (seen.has(key)) {
            report.duplicateRowNumbers.push(rowNumber);
        }
        seen.add(key);

        report.rows.push({
            rowNumber,
            date,
            amount: parsedAmount.value,
            payee,
            notes: notes || null,
        });
    });

    return report;
}
