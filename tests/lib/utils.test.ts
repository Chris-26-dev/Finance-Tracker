import { describe, expect, it } from "vitest";

import {
    calculatePercentageChange,
    fillMissingDays,
    parseDayParam,
    resolveDateRange,
    toLocalCalendarDate,
    toUtcCalendarDate,
} from "@/lib/utils";

describe("calculatePercentageChange", () => {
    it("handles a zero baseline", () => {
        expect(calculatePercentageChange(0, 0)).toBe(0);
        expect(calculatePercentageChange(50, 0)).toBe(100);
    });

    it("keeps the direction of change when the previous value was negative", () => {
        // Balance improved from -100 to 50: a positive change.
        expect(calculatePercentageChange(50, -100)).toBe(150);
        // Balance worsened from -100 to -200: a negative change.
        expect(calculatePercentageChange(-200, -100)).toBe(-100);
    });

    it("computes ordinary changes", () => {
        expect(calculatePercentageChange(150, 100)).toBe(50);
        expect(calculatePercentageChange(50, 100)).toBe(-50);
    });
});

describe("parseDayParam", () => {
    it("parses yyyy-MM-dd as UTC midnight", () => {
        expect(parseDayParam("2025-03-01")?.toISOString()).toBe("2025-03-01T00:00:00.000Z");
    });

    it.each(["", "2025-3-1", "01-03-2025", "2025-02-30", "2025-13-01", "garbage"])(
        "rejects %j",
        (value) => expect(parseDayParam(value)).toBeUndefined(),
    );
});

describe("resolveDateRange", () => {
    const now = new Date("2025-03-31T18:00:00Z");

    it("defaults to the 30 days before today", () => {
        const range = resolveDateRange(undefined, undefined, now)!;
        expect(range.start.toISOString()).toBe("2025-03-01T00:00:00.000Z");
        expect(range.end.toISOString()).toBe("2025-03-31T23:59:59.999Z");
        expect(range.days).toBe(31);
    });

    it("makes the end date inclusive", () => {
        const range = resolveDateRange("2025-03-01", "2025-03-01", now)!;
        expect(range.end.toISOString()).toBe("2025-03-01T23:59:59.999Z");
        expect(range.days).toBe(1);
    });

    it("rejects malformed and inverted ranges", () => {
        expect(resolveDateRange("bad", undefined, now)).toBeNull();
        expect(resolveDateRange("2025-03-05", "2025-03-01", now)).toBeNull();
    });

    it("treats empty strings as missing", () => {
        expect(resolveDateRange("", "", now)).not.toBeNull();
    });
});

describe("fillMissingDays", () => {
    it("fills gaps between active days", () => {
        const start = new Date("2025-03-01T00:00:00Z");
        const end = new Date("2025-03-03T23:59:59.999Z");
        expect(fillMissingDays([{ date: "2025-03-02", income: 5, expenses: 1 }], start, end)).toEqual([
            { date: "2025-03-01", income: 0, expenses: 0 },
            { date: "2025-03-02", income: 5, expenses: 1 },
            { date: "2025-03-03", income: 0, expenses: 0 },
        ]);
    });

    it("returns nothing when there is no activity", () => {
        expect(fillMissingDays([], new Date(), new Date())).toEqual([]);
    });
});

describe("calendar date conversion", () => {
    it("round-trips a stored date without shifting the day", () => {
        const stored = "2025-03-01T00:00:00.000Z";
        const local = toLocalCalendarDate(stored);
        expect([local.getFullYear(), local.getMonth(), local.getDate()]).toEqual([2025, 2, 1]);
        expect(toUtcCalendarDate(local).toISOString()).toBe(stored);
    });
});
