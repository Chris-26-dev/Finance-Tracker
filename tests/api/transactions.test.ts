import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

vi.mock("@/db/drizzle", () => import("../helpers/mock-db"));
vi.mock("@hono/clerk-auth", () => import("../helpers/mock-clerk"));

import { db } from "@/db/drizzle";
import { accounts, categories, transactions } from "@/db/schema";
import { request, USER_A, USER_B } from "../helpers/api";

const DAY = "2025-03-10";
const DATE = new Date(`${DAY}T00:00:00.000Z`);

const validBody = (overrides: Record<string, unknown> = {}) => ({
    date: DAY,
    accountId: "acc_a",
    categoryId: "cat_a",
    payee: "Grocer",
    amount: -12_500,
    notes: null,
    ...overrides,
});

const countTransactions = async () => (await db.select().from(transactions)).length;
const getTransaction = async (id: string) =>
    (await db.select().from(transactions).where(eq(transactions.id, id)))[0];

beforeEach(async () => {
    await db.delete(transactions);
    await db.delete(accounts);
    await db.delete(categories);

    await db.insert(accounts).values([
        { id: "acc_a", name: "Alice checking", userId: USER_A },
        { id: "acc_b", name: "Bob checking", userId: USER_B },
    ]);
    await db.insert(categories).values([
        { id: "cat_a", name: "Food", userId: USER_A },
        { id: "cat_b", name: "Bob secret category", userId: USER_B },
    ]);
    await db.insert(transactions).values([
        { id: "tx_a", accountId: "acc_a", categoryId: "cat_a", payee: "Cafe", amount: -5_000, date: DATE },
        { id: "tx_b", accountId: "acc_b", categoryId: "cat_b", payee: "Bob payee", amount: 90_000, date: DATE },
    ]);
});

describe("POST /api/transactions", () => {
    it("rejects unauthenticated requests", async () => {
        const res = await request("POST", "/api/transactions", { body: validBody() });
        expect(res.status).toBe(401);
        expect(await countTransactions()).toBe(2);
    });

    it("creates a transaction on the caller's own account", async () => {
        const res = await request("POST", "/api/transactions", { user: USER_A, body: validBody() });
        expect(res.status).toBe(200);
        expect(res.json.data).toMatchObject({ accountId: "acc_a", amount: -12_500, payee: "Grocer" });
        expect(await countTransactions()).toBe(3);
    });

    it("refuses another user's account", async () => {
        const res = await request("POST", "/api/transactions", {
            user: USER_A,
            body: validBody({ accountId: "acc_b" }),
        });
        expect(res.status).toBe(403);
        expect(JSON.stringify(res.json)).not.toContain("Bob");
        expect(await countTransactions()).toBe(2);
    });

    it("refuses another user's category", async () => {
        const res = await request("POST", "/api/transactions", {
            user: USER_A,
            body: validBody({ categoryId: "cat_b" }),
        });
        expect(res.status).toBe(403);
        expect(await countTransactions()).toBe(2);
    });

    it("treats unknown ids like foreign ones", async () => {
        const res = await request("POST", "/api/transactions", {
            user: USER_A,
            body: validBody({ accountId: "does_not_exist" }),
        });
        expect(res.status).toBe(403);
    });

    it.each([
        ["zero amount", { amount: 0 }],
        ["non-integer amount", { amount: 1.5 }],
        ["missing amount (NaN serialises to null)", { amount: null }],
        ["blank payee", { payee: "   " }],
        ["missing account", { accountId: "" }],
        ["invalid date", { date: "not-a-date" }],
        ["amount beyond storage range", { amount: 3_000_000_000 }],
    ])("rejects %s", async (_label, overrides) => {
        const res = await request("POST", "/api/transactions", { user: USER_A, body: validBody(overrides) });
        expect(res.status).toBe(400);
        expect(await countTransactions()).toBe(2);
    });
});

describe("POST /api/transactions/bulk-create", () => {
    it("inserts every row when all references are owned", async () => {
        const res = await request("POST", "/api/transactions/bulk-create", {
            user: USER_A,
            body: [validBody(), validBody({ payee: "Second", categoryId: null })],
        });
        expect(res.status).toBe(200);
        expect(res.json.data).toHaveLength(2);
        expect(await countTransactions()).toBe(4);
    });

    it("is all-or-nothing when any row references another user's account", async () => {
        const res = await request("POST", "/api/transactions/bulk-create", {
            user: USER_A,
            body: [validBody(), validBody({ accountId: "acc_b" }), validBody()],
        });
        expect(res.status).toBe(403);
        expect(await countTransactions()).toBe(2);
    });

    it("is all-or-nothing when any row references another user's category", async () => {
        const res = await request("POST", "/api/transactions/bulk-create", {
            user: USER_A,
            body: [validBody(), validBody({ categoryId: "cat_b" })],
        });
        expect(res.status).toBe(403);
        expect(await countTransactions()).toBe(2);
    });

    it("rejects the whole batch when one row is invalid", async () => {
        const res = await request("POST", "/api/transactions/bulk-create", {
            user: USER_A,
            body: [validBody(), validBody({ amount: 0 })],
        });
        expect(res.status).toBe(400);
        expect(await countTransactions()).toBe(2);
    });

    it("rejects an empty batch", async () => {
        const res = await request("POST", "/api/transactions/bulk-create", { user: USER_A, body: [] });
        expect(res.status).toBe(400);
    });
});

describe("PATCH /api/transactions/:id", () => {
    it("updates the caller's own transaction", async () => {
        const res = await request("PATCH", "/api/transactions/tx_a", {
            user: USER_A,
            body: validBody({ payee: "Updated" }),
        });
        expect(res.status).toBe(200);
        expect((await getTransaction("tx_a")).payee).toBe("Updated");
    });

    it("cannot move a transaction into another user's account", async () => {
        const res = await request("PATCH", "/api/transactions/tx_a", {
            user: USER_A,
            body: validBody({ accountId: "acc_b" }),
        });
        expect(res.status).toBe(403);
        expect((await getTransaction("tx_a")).accountId).toBe("acc_a");
    });

    it("cannot attach another user's category", async () => {
        const res = await request("PATCH", "/api/transactions/tx_a", {
            user: USER_A,
            body: validBody({ categoryId: "cat_b" }),
        });
        expect(res.status).toBe(403);
        expect((await getTransaction("tx_a")).categoryId).toBe("cat_a");
    });

    it("cannot modify another user's transaction", async () => {
        const res = await request("PATCH", "/api/transactions/tx_b", {
            user: USER_A,
            body: validBody(),
        });
        expect(res.status).toBe(404);
        expect(await getTransaction("tx_b")).toMatchObject({ accountId: "acc_b", payee: "Bob payee", amount: 90_000 });
    });

    it("clears the category when null is sent", async () => {
        const res = await request("PATCH", "/api/transactions/tx_a", {
            user: USER_A,
            body: validBody({ categoryId: null }),
        });
        expect(res.status).toBe(200);
        expect((await getTransaction("tx_a")).categoryId).toBeNull();
    });
});

describe("reads and deletes are scoped to the caller", () => {
    it("GET /:id hides other users' transactions", async () => {
        const res = await request("GET", "/api/transactions/tx_b", { user: USER_A });
        expect(res.status).toBe(404);
    });

    it("DELETE /:id cannot delete other users' transactions", async () => {
        const res = await request("DELETE", "/api/transactions/tx_b", { user: USER_A });
        expect(res.status).toBe(404);
        expect(await getTransaction("tx_b")).toBeDefined();
    });

    it("bulk-delete ignores other users' ids", async () => {
        const res = await request("POST", "/api/transactions/bulk-delete", {
            user: USER_A,
            body: { ids: ["tx_a", "tx_b"] },
        });
        expect(res.status).toBe(200);
        expect(res.json.data).toEqual([{ id: "tx_a" }]);
        expect(await getTransaction("tx_b")).toBeDefined();
    });

    it("GET / lists only the caller's transactions", async () => {
        const res = await request("GET", `/api/transactions?from=${DAY}&to=${DAY}`, { user: USER_A });
        expect(res.status).toBe(200);
        expect(res.json.data.map((t: { id: string }) => t.id)).toEqual(["tx_a"]);
    });

    it("never reveals another user's category name, even for legacy rows", async () => {
        // Simulates a row written before ownership checks existed.
        await db.update(transactions).set({ categoryId: "cat_b" }).where(eq(transactions.id, "tx_a"));

        const res = await request("GET", `/api/transactions?from=${DAY}&to=${DAY}`, { user: USER_A });
        expect(res.json.data[0].category).toBeNull();
        expect(JSON.stringify(res.json)).not.toContain("Bob secret category");
    });

    it("includes transactions from the whole last day of the range", async () => {
        await db.insert(transactions).values({
            id: "tx_late", accountId: "acc_a", payee: "Late", amount: -1_000,
            date: new Date(`${DAY}T23:30:00.000Z`),
        });

        const res = await request("GET", `/api/transactions?from=${DAY}&to=${DAY}`, { user: USER_A });
        expect(res.json.data.map((t: { id: string }) => t.id)).toContain("tx_late");
    });

    it("rejects malformed date ranges", async () => {
        const res = await request("GET", "/api/transactions?from=31-12-2025", { user: USER_A });
        expect(res.status).toBe(400);
    });
});
