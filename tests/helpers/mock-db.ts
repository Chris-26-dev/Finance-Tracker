import { createTestDb } from "./test-db";

// Replaces "@/db/drizzle" in API tests: one in-memory database per test file.
export const db = await createTestDb();
