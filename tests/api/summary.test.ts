import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db/drizzle", () => import("../helpers/mock-db"));
vi.mock("@hono/clerk-auth", () => import("../helpers/mock-clerk"));

import { db } from "@/db/drizzle";
import { accounts, categories, transactions } from "@/db/schema";
import { request, USER_A, USER_B } from "../helpers/api";

const at = (iso: string) => new Date(iso);

beforeEach(async () => {
    await db.delete(transactions);
    await db.delete(accounts);
    await db.delete(categories);

    await db.insert(accounts).values([
        { id: "acc_a", name: "Checking", userId: USER_A },
        { id: "acc_b", name: "Bob", userId: USER_B },
    ]);
    await db.insert(categories).values([
        { id: "cat_food", name: "Food", userId: USER_A },
        { id: "cat_b", name: "Bob category", userId: USER_B },
    ]);
    await db.insert(transactions).values([
        // Current period: 2025-03-01 .. 2025-03-03
        { id: "t1", accountId: "acc_a", categoryId: "cat_food", payee: "Grocer", amount: -20_000, date: at("2025-03-01T00:00:00Z") },
        { id: "t2", accountId: "acc_a", categoryId: null, payee: "Cash", amount: -5_000, date: at("2025-03-01T15:00:00Z") },
        { id: "t3", accountId: "acc_a", categoryId: "cat_food", payee: "Salary", amount: 100_000, date: at("2025-03-03T22:00:00Z") },
        // Previous period: 2025-02-26 .. 2025-02-28
        { id: "t4", accountId: "acc_a", categoryId: "cat_food", payee: "Grocer", amount: -10_000, date: at("2025-02-27T00:00:00Z") },
        // Another user's data in the same period must never be counted.
        { id: "t5", accountId: "acc_b", categoryId: "cat_b", payee: "Bob", amount: -999_000, date: at("2025-03-02T00:00:00Z") },
    ]);
});

describe("GET /api/summary", () => {
    it("requires authentication", async () => {
        expect((await request("GET", "/api/summary")).status).toBe(401);
    });

    it("aggregates only the caller's data over an inclusive range", async () => {
        const res = await request("GET", "/api/summary?from=2025-03-01&to=2025-03-03", { user: USER_A });
        expect(res.status).toBe(200);

        const data = res.json.data;
        expect(data.incomeAmount).toBe(100_000);
        expect(data.expensesAmount).toBe(-25_000);
        expect(data.remainingAmount).toBe(75_000);
    });

    it("includes uncategorized expenses in the category breakdown", async () => {
        const res = await request("GET", "/api/summary?from=2025-03-01&to=2025-03-03", { user: USER_A });
        expect(res.json.data.categories).toEqual([
            { name: "Food", value: 20_000 },
            { name: "Uncategorized", value: 5_000 },
        ]);
        expect(JSON.stringify(res.json)).not.toContain("Bob");
    });

    it("groups transactions by calendar day, not by timestamp", async () => {
        const res = await request("GET", "/api/summary?from=2025-03-01&to=2025-03-03", { user: USER_A });
        expect(res.json.data.days).toEqual([
            { date: "2025-03-01", income: 0, expenses: 25_000 },
            { date: "2025-03-02", income: 0, expenses: 0 },
            { date: "2025-03-03", income: 100_000, expenses: 0 },
        ]);
    });

    it("compares against the previous period of equal length", async () => {
        const res = await request("GET", "/api/summary?from=2025-03-01&to=2025-03-03", { user: USER_A });
        // Expenses went from -10,000 to -25,000: 150% more spending.
        expect(res.json.data.expensesChange).toBe(150);
        // Income went from 0 to 100,000.
        expect(res.json.data.incomeChange).toBe(100);
    });

    it("returns zeros, not nulls, for an empty period", async () => {
        const res = await request("GET", "/api/summary?from=2024-01-01&to=2024-01-05", { user: USER_A });
        expect(res.json.data).toMatchObject({
            incomeAmount: 0,
            expensesAmount: 0,
            remainingAmount: 0,
            categories: [],
            days: [],
        });
    });

    it("rejects malformed or inverted ranges", async () => {
        expect((await request("GET", "/api/summary?from=2025-13-01", { user: USER_A })).status).toBe(400);
        expect((await request("GET", "/api/summary?from=2025-03-05&to=2025-03-01", { user: USER_A })).status).toBe(400);
    });
});
