import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";

import { db } from "@/db/drizzle";
import { accounts, categories } from "@/db/schema";
import { DELETE_DATA_CONFIRMATION } from "@/lib/utils";

const app = new Hono()
    .delete(
        "/",
        clerkMiddleware(),
        zValidator(
            "json",
            z.object({
                confirm: z.literal(DELETE_DATA_CONFIRMATION),
            }),
        ),
        async (c) => {
            const auth = getAuth(c);

            if (!auth?.userId) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            // Every statement is scoped to the caller. Transactions are removed
            // by the accounts ON DELETE CASCADE; categories by user_id.
            // neon-http runs a batch as a single transaction.
            const [deletedAccounts, deletedCategories] = await db.batch([
                db
                    .delete(accounts)
                    .where(eq(accounts.userId, auth.userId))
                    .returning({ id: accounts.id }),
                db
                    .delete(categories)
                    .where(eq(categories.userId, auth.userId))
                    .returning({ id: categories.id }),
            ]);

            return c.json({
                data: {
                    accounts: deletedAccounts.length,
                    categories: deletedCategories.length,
                },
            });
        },
    );

export default app;
