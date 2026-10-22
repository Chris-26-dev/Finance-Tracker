import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db/drizzle", () => import("../helpers/mock-db"));
vi.mock("@hono/clerk-auth", () => import("../helpers/mock-clerk"));

import { db } from "@/db/drizzle";
import { accounts, categories, transactions } from "@/db/schema";
import { request, USER_A, USER_B } from "../helpers/api";

const DATE = new Date("2025-03-01T00:00:00Z");

beforeEach(async () => {
    await db.delete(transactions);
    await db.delete(accounts);
    await db.delete(categories);

    await db.insert(accounts).values([
        { id: "acc_a", name: "A", userId: USER_A },
        { id: "acc_b", name: "B", userId: USER_B },
    ]);
    await db.insert(categories).values([
        { id: "cat_a", name: "A", userId: USER_A },
        { id: "cat_b", name: "B", userId: USER_B },
    ]);
    await db.insert(transactions).values([
        { id: "tx_a", accountId: "acc_a", categoryId: "cat_a", payee: "A", amount: -1_000, date: DATE },
        { id: "tx_b", accountId: "acc_b", categoryId: "cat_b", payee: "B", amount: -1_000, date: DATE },
    ]);
});

describe("DELETE /api/user-data", () => {
    it("requires authentication", async () => {
        const res = await request("DELETE", "/api/user-data", { body: { confirm: "DELETE" } });
        expect(res.status).toBe(401);
        expect(await db.select().from(accounts)).toHaveLength(2);
    });

    it("requires the explicit confirmation phrase", async () => {
        for (const body of [undefined, {}, { confirm: "delete" }, { confirm: true }]) {
            const res = await request("DELETE", "/api/user-data", { user: USER_A, body });
            expect(res.status).toBe(400);
        }
        expect(await db.select().from(transactions)).toHaveLength(2);
    });

    it("deletes only the caller's accounts, categories and transactions", async () => {
        const res = await request("DELETE", "/api/user-data", { user: USER_A, body: { confirm: "DELETE" } });
        expect(res.status).toBe(200);
        expect(res.json.data).toEqual({ accounts: 1, categories: 1 });

        expect(await db.select().from(accounts)).toEqual([{ id: "acc_b", name: "B", userId: USER_B, plaidId: null }]);
        expect((await db.select().from(categories)).map((c) => c.id)).toEqual(["cat_b"]);
        expect((await db.select().from(transactions)).map((t) => t.id)).toEqual(["tx_b"]);
    });
});
