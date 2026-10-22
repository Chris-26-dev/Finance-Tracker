import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import * as schema from "@/db/schema";

/**
 * In-memory Postgres (PGlite) with the project's real migrations applied.
 * Nothing touches the network or a real database.
 */
export async function createTestDb() {
    const client = new PGlite();
    const db = drizzle(client, { schema });

    await migrate(db, { migrationsFolder: path.resolve(__dirname, "../../drizzle") });

    // neon-http exposes db.batch (one HTTP transaction); PGlite's driver
    // doesn't, so run the statements in order. Tests assert scoping, not
    // atomicity of the batch.
    const batch = async (queries: PromiseLike<unknown>[]) => {
        const results: unknown[] = [];
        for (const query of queries) {
            results.push(await query);
        }
        return results;
    };

    return Object.assign(db, { batch });
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>;
