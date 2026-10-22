import { Hono } from "hono";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { createId } from "@paralleldrive/cuid2";
import {
    transactions,
    insertTransactionSchema,
    categories,
    accounts,
    MAX_BULK_TRANSACTIONS,
} from "@/db/schema";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { resolveDateRange } from "@/lib/utils";
import { FORBIDDEN_REFERENCE_ERROR, ownsReferences } from "./ownership";


const createTransactionSchema = insertTransactionSchema.omit({
    id: true,
});

const app = new Hono()
    .get(
        "/",
        zValidator("query", z.object({
            from: z.string().optional(),
            to: z.string().optional(),
            accountId: z.string().optional(),
        })),
        clerkMiddleware(),
        async (c) => {
            const auth = getAuth(c);
            const { from, to, accountId } = c.req.valid("query");

            if (!auth?.userId) {
                return c.json({ error: "unauthorized" }, 401)
            }

            const range = resolveDateRange(from, to);

            if (!range) {
                return c.json({ error: "Invalid date range" }, 400);
            }

            const data = await db
                .select({
                    id: transactions.id,
                    date: transactions.date,
                    category: categories.name,
                    categoryId: transactions.categoryId,
                    payee: transactions.payee,
                    amount: transactions.amount,
                    notes: transactions.notes,
                    account: accounts.name,
                    accountId: transactions.accountId,
                })
                .from(transactions)
                .innerJoin(accounts, eq(transactions.accountId, accounts.id))
                .leftJoin(
                    categories,
                    and(
                        eq(transactions.categoryId, categories.id),
                        eq(categories.userId, auth.userId),
                    ),
                )
                .where(
                    and(
                        accountId ? eq(transactions.accountId, accountId) : undefined,
                        eq(accounts.userId, auth.userId),
                        gte(transactions.date, range.start),
                        lte(transactions.date, range.end),
                    )
                )
                .orderBy(desc(transactions.date))

            return c.json({ data });
        })
    .get(
        "/:id",
        zValidator("param", z.object({
            id: z.string().optional(),
        })),
        clerkMiddleware(),
        async (c) => {
            const auth = getAuth(c);
            const { id } = c.req.valid("param");

            if (!id) {
                return c.json({ error: "Missing id" }, 400);
            }

            if (!auth?.userId) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const [data] = await db
                .select({
                    id: transactions.id,
                    date: transactions.date,
                    categoryId: transactions.categoryId,
                    payee: transactions.payee,
                    amount: transactions.amount,
                    notes: transactions.notes,
                    accountId: transactions.accountId,
                })
                .from(transactions)
                .innerJoin(accounts, eq(transactions.accountId, accounts.id))
                .where(
                    and(
                        eq(transactions.id, id),
                        eq(accounts.userId, auth.userId)
                    ),
                );

            if (!data) {
                return c.json({ error: "Not found" }, 404);
            }

            return c.json({ data });
        }
    )
    .post(
        "/",
        clerkMiddleware(),
        zValidator(
            "json",
            createTransactionSchema
        ),
        async (c) => {
            const auth = getAuth(c);
            const values = c.req.valid("json");

            if (!auth?.userId) {
                return c.json({ error: "unauthorized" }, 401);
            }

            const allowed = await ownsReferences(auth.userId, {
                accountIds: [values.accountId],
                categoryIds: [values.categoryId],
            });

            if (!allowed) {
                return c.json({ error: FORBIDDEN_REFERENCE_ERROR }, 403);
            }

            const [data] = await db.insert(transactions).values({
                id: createId(),
                ...values,
            }).returning();

            return c.json({ data });
        })
    .post(
        "/bulk-create",
        clerkMiddleware(),
        zValidator(
            "json",
            z.array(
                createTransactionSchema
            ).min(1).max(MAX_BULK_TRANSACTIONS),
        ),
        async (c) => {
            const auth = getAuth(c);
            const values = c.req.valid("json");

            if (!auth?.userId){
                return c.json({ error: "Unauthorized" }, 401);
            }

            // Validate every referenced account/category before writing
            // anything; the single multi-row INSERT below is atomic, so the
            // request is all-or-nothing.
            const allowed = await ownsReferences(auth.userId, {
                accountIds: values.map((value) => value.accountId),
                categoryIds: values.map((value) => value.categoryId),
            });

            if (!allowed) {
                return c.json({ error: FORBIDDEN_REFERENCE_ERROR }, 403);
            }

            const data = await db
                .insert(transactions)
                .values(
                    values.map((value) => ({
                    id: createId(),
                    ...value,
                    }))
                )
                .returning();

                return c.json({ data });
        },
    )
    .post(
        "/bulk-delete",
        clerkMiddleware(),
        zValidator(
            "json",
            z.object({
                ids: z.array(z.string()),
            }),
        ),
        async (c) => {
            const auth = getAuth(c);
            const values = c.req.valid("json");

            if (!auth?.userId) {
                return c.json({ error: "Unauthorized" }, 401)
            }

            const transactionsToDelete = db.$with("transactions_to_delete").as(
                db.select({ id: transactions.id }).from(transactions)
                .innerJoin(accounts, eq(transactions.accountId, accounts.id))
                .where(
                    and(
                        inArray(transactions.id, values.ids),
                        eq(accounts.userId, auth.userId),
                    )
                ),
            );

            const data = await db
                .with(transactionsToDelete)
                .delete(transactions)
                .where(
                    inArray(transactions.id, sql`(select id from ${transactionsToDelete})`)
                )
                .returning({
                    id: transactions.id,
                });



            return c.json({ data });
        },
    )
    .patch(
        "/:id",
        clerkMiddleware(),
        zValidator(
            "param",
            z.object({
                id: z.string().optional(),
            }),
        ),
        zValidator(
            "json",
            createTransactionSchema
        ),
        async (c) => {
            const auth = getAuth(c);
            const { id } = c.req.valid("param");
            const values = c.req.valid("json");

            if (!id) {
                return c.json({ error: "Missing id" }, 400);
            }

            if (!auth?.userId) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            // The new account/category must also belong to the caller, so a
            // transaction can't be moved into someone else's account.
            const allowed = await ownsReferences(auth.userId, {
                accountIds: [values.accountId],
                categoryIds: [values.categoryId],
            });

            if (!allowed) {
                return c.json({ error: FORBIDDEN_REFERENCE_ERROR }, 403);
            }

            const transactionsToUpdate = db.$with("transactions_to_update").as(
                db.select({ id: transactions.id })
                .from(transactions)
                .innerJoin(accounts, eq(transactions.accountId, accounts.id))
                .where(
                    and(
                        eq(transactions.id, id),
                        eq(accounts.userId, auth.userId),
                    )
                ),
            );

            const [data] = await db
                .with(transactionsToUpdate)
                .update(transactions)
                .set({
                    ...values,
                    categoryId: values.categoryId ?? null,
                    notes: values.notes ?? null,
                })
                .where(
                    inArray(transactions.id, sql`(select id from ${transactionsToUpdate})`)
                )
                .returning();

            if (!data) {
                return c.json({ error: "Not found" }, 404);
            }

            return c.json({ data });
        },
    )
    .delete(
        "/:id",
        clerkMiddleware(),
        zValidator(
            "param",
            z.object({
                id: z.string().optional(),
            }),
        ),
        async (c) => {
            const auth = getAuth(c);
            const { id } = c.req.valid("param");

            if (!id) {
                return c.json({ error: "Missing id" }, 400);
            }

            if (!auth?.userId) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const transactionsToDelete = db.$with("transactions_to_delete").as(
                db.select({ id: transactions.id })
                .from(transactions)
                .innerJoin(accounts, eq(transactions.accountId, accounts.id))
                .where(
                    and(
                        eq(transactions.id, id),
                        eq(accounts.userId, auth.userId),
                    )
                ),
            );

            const [data] = await db
                .with(transactionsToDelete)
                .delete(transactions)
                .where(
                    inArray(transactions.id, sql`(select id from ${transactionsToDelete})`)
                )
                .returning({
                    id: transactions.id,
                });

            if (!data) {
                return c.json({ error: "Not found" }, 404);
            }

            return c.json({ data });
        },
    );


export default app;
