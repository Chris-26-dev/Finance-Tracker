import { z } from "zod";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const accounts = pgTable("accounts", {
    id: text("id").primaryKey(),
    plaidId: text("plaid_id"),
    name: text("name").notNull(),
    userId: text("user_id").notNull(),
});

export const accountsRelations = relations(accounts, ({ many }) => ({
    transactions: many(transactions),
}));

export const insertAccountSchema = createInsertSchema(accounts);

export const categories = pgTable("categories", {
    id: text("id").primaryKey(),
    plaidId: text("plaid_id"),
    name: text("name").notNull(),
    userId: text("user_id").notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
    transactions: many(transactions),
}));

export const insertCategorySchema = createInsertSchema(categories);

export const transactions = pgTable("transactions", {
    id: text("id").primaryKey(),
    amount: integer("amount").notNull(),
    payee: text("payee").notNull(),
    notes: text("notes"),
    date: timestamp("date", { mode: "date" }).notNull(),
    accountId: text("account_id").references(() => accounts.id, {
        onDelete: "cascade",
    }).notNull(),
    categoryId: text("category_id").references(() => categories.id, {
        onDelete: "set null",
    }),
});


export const transactionsRelations = relations(transactions, ({ one }) => ({
    account: one(accounts, {
        fields: [transactions.accountId],
        references: [accounts.id], 
    }),
    categories: one(categories, {
        fields: [transactions.categoryId],
        references: [categories.id], 
    }),
}));

// Amounts are stored as integer miliunits in a 32-bit column, so keep a
// safe margin below 2^31 (= 2,000,000.000 in currency units).
export const MAX_AMOUNT_MILIUNITS = 2_000_000_000;
export const MAX_NAME_LENGTH = 64;
export const MAX_PAYEE_LENGTH = 200;
export const MAX_NOTES_LENGTH = 1000;
export const MAX_BULK_TRANSACTIONS = 5000;

export const nameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(MAX_NAME_LENGTH, `Name must be ${MAX_NAME_LENGTH} characters or fewer`),
});

export const insertTransactionSchema = z.object({
  id: z.string().optional(), // Optional if auto-generated
  amount: z
    .number()
    .int()
    .refine((value) => value !== 0, "Amount cannot be zero")
    .refine(
      (value) => Math.abs(value) <= MAX_AMOUNT_MILIUNITS,
      "Amount is too large",
    ),
  payee: z
    .string()
    .trim()
    .min(1, "Payee is required")
    .max(MAX_PAYEE_LENGTH),
  notes: z.string().trim().max(MAX_NOTES_LENGTH).optional().nullable(),
  date: z.coerce
    .date()
    .refine((value) => !Number.isNaN(value.getTime()), "Invalid date"),
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().min(1).optional().nullable(),
});