import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { and, desc, eq, gte, lt, lte, sql, sum } from "drizzle-orm";
import { accounts, categories, transactions } from "@/db/schema";
import {
    calculatePercentageChange,
    fillMissingDays,
    resolveDateRange,
    UNCATEGORIZED_LABEL,
} from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;

const app = new Hono()
    .get(
        "/",
        clerkMiddleware(),
        zValidator(
            "query",
            z.object({
                from: z.string().optional(),
                to: z.string().optional(),
                accountId: z.string().optional(),
            }),
        ),
        async (c) => {
            const auth = getAuth(c);
            const { from, to, accountId } = c.req.valid("query");

            if (!auth?.userId) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const range = resolveDateRange(from, to);

            if (!range) {
                return c.json({ error: "Invalid date range" }, 400);
            }

            const startDate = range.start;
            const endDate = range.end;

            // Compare against the immediately preceding period of equal length.
            const periodMs = range.days * DAY_MS;
            const lastPeriodStart = new Date(startDate.getTime() - periodMs);
            const lastPeriodEnd = new Date(endDate.getTime() - periodMs);

            async function fetchFinancialData(
                userId: string,
                startDate: Date,
                endDate: Date
            ) {
                return await db
                    .select({
                        income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} >= 0 THEN ${transactions.amount} ELSE 0 END), 0)`.mapWith(Number),
                        expenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.amount} < 0 THEN ${transactions.amount} ELSE 0 END), 0)`.mapWith(Number),
                        remaining: sql<number>`COALESCE(${sum(transactions.amount)}, 0)`.mapWith(Number),
                    })
                    .from(transactions)
                    .innerJoin(
                        accounts,
                        eq(
                            transactions.accountId, accounts.id
                        ),
                    )
                    .where(
                        and(
                            accountId ? eq(transactions.accountId, accountId) : undefined,
                            eq(accounts.userId, userId),
                            gte(transactions.date, startDate),
                            lte(transactions.date, endDate)
                        )
                    );
            };

            const [currentPeriod] = await fetchFinancialData(
                auth.userId,
                startDate,
                endDate
            );
            const [lastPeriod] = await fetchFinancialData(
                auth.userId,
                lastPeriodStart,
                lastPeriodEnd
            );

            const incomeChange = calculatePercentageChange(
                currentPeriod.income,
                lastPeriod.income,
            );
            // Expenses are negative; report the change in how much was spent,
            // so a positive value always means "spent more".
            const expensesChange = calculatePercentageChange(
                Math.abs(currentPeriod.expenses),
                Math.abs(lastPeriod.expenses),
            );
            const remainingChange = calculatePercentageChange(
                currentPeriod.remaining,
                lastPeriod.remaining,
            );

            const categoryRows = await db
                .select({
                    name: categories.name,
                    value: sql<number>`SUM(ABS(${transactions.amount}))`.mapWith(Number),
                })
                .from(transactions)
                .innerJoin(
                    accounts,
                    eq(
                        transactions.accountId,
                        accounts.id,
                    ),
                )
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
                        lt(transactions.amount, 0),
                        gte(transactions.date, startDate),
                        lte(transactions.date, endDate)
                    )
                )
                .groupBy(categories.name)
                .orderBy(desc(
                    sql`SUM(ABS(${transactions.amount}))`
                ));

            // Expenses without a (visible) category are grouped under one label.
            const category = categoryRows.map((row) => ({
                name: row.name ?? UNCATEGORIZED_LABEL,
                value: row.value,
            }));

            const topCategories = category.slice(0, 3);
            const otherCategories = category.slice(3);
            const otherSum = otherCategories
                .reduce((sum, current) => sum + current.value, 0);

            const finalCategories = [...topCategories];
            if (otherCategories.length > 0) {
                finalCategories.push({
                    name: "Other",
                    value: otherSum,
                });
            }

            const day = sql<string>`to_char(${transactions.date}, 'YYYY-MM-DD')`;

            const activeDays = await db
                .select({
                    date: day,
                    income: sql<number>`SUM(CASE WHEN ${transactions.amount} >= 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(Number),
                    expenses: sql<number>`SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END)`.mapWith(Number),
                })
                .from(transactions)
                .innerJoin(
                    accounts,
                    eq(
                        transactions.accountId,
                        accounts.id,
                    ),
                )
                .where(
                    and(
                        accountId ? eq(transactions.accountId, accountId) : undefined,
                        eq(accounts.userId, auth.userId),
                        gte(transactions.date, startDate),
                        lte(transactions.date, endDate)
                    )
                )
                .groupBy(day)
                .orderBy(day);

            const days = fillMissingDays(
                activeDays,
                startDate,
                endDate,
            );


            return c.json({
                data: {
                    remainingAmount: currentPeriod.remaining,
                    remainingChange,
                    incomeAmount: currentPeriod.income,
                    incomeChange,
                    expensesAmount: currentPeriod.expenses,
                    expensesChange,
                    categories: finalCategories,
                    days
                }
            })
        },
    );


export default app;