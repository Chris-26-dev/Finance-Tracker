import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { eachDayOfInterval, format, subDays } from "date-fns";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { categories, accounts, transactions } from "@/db/schema";
import { convertAmountToMiliunits, toUtcCalendarDate } from "@/lib/utils";
import { getSeedSafetyErrors } from "./seed-guard";

config({ path: ".env.local" });

/**
 * Seeds demo data for ONE user. Fails closed: it only runs when
 *   ALLOW_DESTRUCTIVE_SEED=true SEED_USER_ID=user_xxx npm run db:seed
 * and never in production. It first deletes that user's existing accounts
 * (cascading to their transactions) and categories; no other user's rows
 * are touched.
 */
function assertSafeToSeed() {
    const errors = getSeedSafetyErrors(process.env);

    if (errors.length > 0) {
        console.error(`Seed aborted:\n- ${errors.join("\n- ")}`);
        process.exit(1);
    }

    return process.env.SEED_USER_ID!;
}

const SEED_USER_ID = assertSafeToSeed();

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Prefix ids with the user id so seeding several users never collides.
const seedId = (id: string) => `seed_${SEED_USER_ID}_${id}`;

const SEED_CATEGORIES = [
    { id: seedId("category_1"), name: "Housing", userId: SEED_USER_ID, plaidId: null },
    { id: seedId("category_2"), name: "Food", userId: SEED_USER_ID, plaidId: null },
    { id: seedId("category_3"), name: "Transport", userId: SEED_USER_ID, plaidId: null },
    { id: seedId("category_4"), name: "Travel", userId: SEED_USER_ID, plaidId: null },
    { id: seedId("category_5"), name: "Clothing", userId: SEED_USER_ID, plaidId: null },
    { id: seedId("category_6"), name: "Entertainment", userId: SEED_USER_ID, plaidId: null },
];

const SEED_ACCOUNTS = [
    { id: seedId("account_1"), name: "Checking", userId: SEED_USER_ID, plaidId: null },
    { id: seedId("account_2"), name: "Savings", userId: SEED_USER_ID, plaidId: null },
];

const SEED_PAYEES = ["Grocer", "Landlord", "Metro", "Airline", "Cinema", "Employer", "Cafe"];

const defaultTo = new Date();
const defaultFrom = subDays(defaultTo, 90);

const SEED_TRANSACTIONS: typeof transactions.$inferSelect[] = [];

const generateRandomAmount = (category: typeof categories.$inferInsert) => {
    switch (category.name) {
        case "Housing":
            return Math.random() * 400 + 90;
        case "Travel":
            return Math.random() * 300 + 50;
        case "Food":
            return Math.random() * 60 + 10;
        case "Clothing":
            return Math.random() * 120 + 10;
        case "Entertainment":
            return Math.random() * 80 + 10;
        default:
            return Math.random() * 50 + 5;
    }
};

const generateTransactionsForDay = (day: Date) => {
    const numTransactions = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i < numTransactions; i++) {
        const category = SEED_CATEGORIES[Math.floor(Math.random() * SEED_CATEGORIES.length)];
        const isExpense = Math.random() > 0.4;
        const amount = generateRandomAmount(category);
        const formattedAmount = convertAmountToMiliunits(isExpense ? -amount : amount);

        SEED_TRANSACTIONS.push({
            id: seedId(`transaction_${format(day, "yyyy-MM-dd")}_${i}`),
            accountId: SEED_ACCOUNTS[Math.floor(Math.random() * SEED_ACCOUNTS.length)].id,
            categoryId: category.id,
            date: toUtcCalendarDate(day),
            amount: formattedAmount,
            payee: SEED_PAYEES[Math.floor(Math.random() * SEED_PAYEES.length)],
            notes: null,
        });
    }
};

const generateTransactions = () => {
    const days = eachDayOfInterval({ start: defaultFrom, end: defaultTo });
    days.forEach(day => generateTransactionsForDay(day));
};

generateTransactions();

const main = async () => {
    try {
        // Reset ONLY the seed user's data. Deleting accounts cascades to
        // their transactions.
        await db.delete(accounts).where(eq(accounts.userId, SEED_USER_ID));
        await db.delete(categories).where(eq(categories.userId, SEED_USER_ID));

        await db.insert(categories).values(SEED_CATEGORIES);
        await db.insert(accounts).values(SEED_ACCOUNTS);
        await db.insert(transactions).values(SEED_TRANSACTIONS);

        console.log(`Seeded ${SEED_TRANSACTIONS.length} transactions for ${SEED_USER_ID}.`);
    } catch (error) {
        console.error("Error during seed:", error);
        process.exit(1);
    }
};

main();
