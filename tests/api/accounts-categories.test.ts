import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db/drizzle", () => import("../helpers/mock-db"));
vi.mock("@hono/clerk-auth", () => import("../helpers/mock-clerk"));

import { db } from "@/db/drizzle";
import { accounts, categories, transactions } from "@/db/schema";
import { request, USER_A, USER_B } from "../helpers/api";

beforeEach(async () => {
    await db.delete(transactions);
    await db.delete(accounts);
    await db.delete(categories);

    await db.insert(accounts).values([
        { id: "acc_a", name: "Checking", userId: USER_A },
        { id: "acc_b", name: "Bob account", userId: USER_B },
    ]);
    await db.insert(categories).values([
        { id: "cat_a", name: "Food", userId: USER_A },
        { id: "cat_b", name: "Bob category", userId: USER_B },
    ]);
});

describe.each([
    ["accounts", "acc_a", "acc_b", "Checking", "Bob account"],
    ["categories", "cat_a", "cat_b", "Food", "Bob category"],
] as const)("/api/%s", (resource, ownId, foreignId, ownName, foreignName) => {
    it("requires authentication", async () => {
        expect((await request("GET", `/api/${resource}`)).status).toBe(401);
        expect((await request("POST", `/api/${resource}`, { body: { name: "X" } })).status).toBe(401);
    });

    it("lists only the caller's records", async () => {
        const res = await request("GET", `/api/${resource}`, { user: USER_A });
        expect(res.json.data).toEqual([{ id: ownId, name: ownName }]);
    });

    it("trims names on create", async () => {
        const res = await request("POST", `/api/${resource}`, { user: USER_A, body: { name: "  Travel  " } });
        expect(res.status).toBe(200);
        expect(res.json.data.name).toBe("Travel");
        expect(res.json.data.userId).toBe(USER_A);
    });

    it.each([
        ["empty", ""],
        ["whitespace only", "   "],
        ["too long", "x".repeat(65)],
    ])("rejects %s names", async (_label, name) => {
        const res = await request("POST", `/api/${resource}`, { user: USER_A, body: { name } });
        expect(res.status).toBe(400);
    });

    it("rejects duplicates case-insensitively within the same user", async () => {
        const res = await request("POST", `/api/${resource}`, {
            user: USER_A,
            body: { name: ownName.toUpperCase() },
        });
        expect(res.status).toBe(409);
        expect(res.json.error).toMatch(/already exists/);
    });

    it("allows a name another user already uses", async () => {
        const res = await request("POST", `/api/${resource}`, { user: USER_A, body: { name: foreignName } });
        expect(res.status).toBe(200);
    });

    it("rejects renaming onto an existing name", async () => {
        await request("POST", `/api/${resource}`, { user: USER_A, body: { name: "Second" } });
        const res = await request("PATCH", `/api/${resource}/${ownId}`, { user: USER_A, body: { name: "second" } });
        expect(res.status).toBe(409);
    });

    it("allows changing only the letter case of its own name", async () => {
        const res = await request("PATCH", `/api/${resource}/${ownId}`, {
            user: USER_A,
            body: { name: ownName.toLowerCase() },
        });
        expect(res.status).toBe(200);
        expect(res.json.data.name).toBe(ownName.toLowerCase());
    });

    it("cannot read, rename or delete another user's record", async () => {
        expect((await request("GET", `/api/${resource}/${foreignId}`, { user: USER_A })).status).toBe(404);
        expect((await request("PATCH", `/api/${resource}/${foreignId}`, { user: USER_A, body: { name: "Hijacked" } })).status).toBe(404);
        expect((await request("DELETE", `/api/${resource}/${foreignId}`, { user: USER_A })).status).toBe(404);

        const bulk = await request("POST", `/api/${resource}/bulk-delete`, { user: USER_A, body: { ids: [foreignId] } });
        expect(bulk.json.data).toEqual([]);

        const stillThere = await request("GET", `/api/${resource}`, { user: USER_B });
        expect(stillThere.json.data).toEqual([{ id: foreignId, name: foreignName }]);
    });

    it("ignores attempts to set userId through the body", async () => {
        const res = await request("POST", `/api/${resource}`, {
            user: USER_A,
            body: { name: "Sneaky", userId: USER_B },
        });
        expect(res.status).toBe(200);
        expect(res.json.data.userId).toBe(USER_A);
    });
});
