import { describe, expect, it } from "vitest";

import { getSeedSafetyErrors } from "@/scripts/seed-guard";

const safe = {
    ALLOW_DESTRUCTIVE_SEED: "true",
    SEED_USER_ID: "user_2abcDEF123",
    DATABASE_URL: "postgres://localhost/dev",
    NODE_ENV: "development",
};

describe("getSeedSafetyErrors", () => {
    it("allows an explicit, scoped, non-production run", () => {
        expect(getSeedSafetyErrors(safe)).toEqual([]);
    });

    it("fails closed with no configuration", () => {
        expect(getSeedSafetyErrors({}).length).toBeGreaterThanOrEqual(3);
    });

    it("requires explicit opt-in", () => {
        expect(getSeedSafetyErrors({ ...safe, ALLOW_DESTRUCTIVE_SEED: "1" })).toHaveLength(1);
    });

    it.each(["", "alice", "user_", "user_abc; DROP TABLE accounts"])("rejects SEED_USER_ID %j", (id) => {
        expect(getSeedSafetyErrors({ ...safe, SEED_USER_ID: id })).toHaveLength(1);
    });

    it("refuses production", () => {
        expect(getSeedSafetyErrors({ ...safe, NODE_ENV: "production" })).toEqual(["Refusing to seed in production."]);
        expect(getSeedSafetyErrors({ ...safe, VERCEL_ENV: "production" })).toEqual(["Refusing to seed in production."]);
    });
});
