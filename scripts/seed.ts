import { config } from "dotenv";
import { subDays } from "date-fns";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { categories, accounts, transactions } from "@/db/schema";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const SEED_USER_ID = "user_2xJ4PAcE9qi0StGXAW0lKGlOMKc";
const SEED_CATEGORIES = [
    { id: "category_1", name: "House", userId: SEED_USER_ID, plaidId: null },
    { id: "category_2", name: "Aerox", userId: SEED_USER_ID, plaidId: null },
    { id: "category_3", name: "Laptop", userId: SEED_USER_ID, plaidId: null },
    { id: "category_4", name: "Japan", userId: SEED_USER_ID, plaidId: null },
    { id: "category_5", name: "Clothing", userId: SEED_USER_ID, plaidId: null },
    { id: "category_6", name: "Appliances", userId: SEED_USER_ID, plaidId: null },
];

const SEED_ACCOUNTS = [
    { id: "account_1", name: "Checking", userId: SEED_USER_ID, plaidId: null },
    { id: "account_2", name: "Saving", userId: SEED_USER_ID, plaidId: null },
]

const defaultTo = new Date();
const defaultFrom = subDays(defaultTo, 90);

const SEED_TRANSACTIONS: typeof transactions.$inferSelect[] = [];

import { eachDayOfInterval, format } from "date-fns";
import { convertAmountToMiliunits } from "@/lib/utils";

const generateRandomAmount = (category: typeof categories.$inferInsert) => {
    switch (category.name) {
        case "House":
            return Math.random() * 4000 + 90;
        case "Laptop":
            return Math.random() * 2000 + 50;
        case "Food":
            return Math.random() * 3000 + 10;
        case "Clothing":
            return Math.random() * 530 + 10;
        case "Entertainment":
        case "Appliances":
            return Math.random() * 1000 + 10;
        case "Dates":
        case "Japan":
            return Math.random() * 500 + 15;
        default:
            return Math.random() * 100 + 20; 
    }
};


const generateTransactionsForDay = (day: Date) => {
    const numTransactions = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i < numTransactions; i++) {
        const category = SEED_CATEGORIES[Math.floor(Math.random() * SEED_CATEGORIES.length)];
        const isExpense = Math.random() > 0.6;
        const amount = generateRandomAmount(category);
        const formattedAmount = convertAmountToMiliunits(isExpense ? -amount : amount);

        SEED_TRANSACTIONS.push({
            id: `transaction_${format(day, "yyyy-MM-dd")}_${i}`,
            accountId: SEED_ACCOUNTS[1].id, 
            categoryId: category.id,
            date: day,
            amount: formattedAmount,
            payee: "Merchant",
            notes: "Random transaction"
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
        //Reset database
        await db.delete(transactions).execute();
        await db.delete(accounts).execute();
        await db.delete(categories).execute();
        //Seed Categories
        await db.insert(categories).values(SEED_CATEGORIES).execute();
        //Seed Accounts
        await db.insert(accounts).values(SEED_ACCOUNTS).execute();
        //Seed transactions
        await db.insert(transactions).values(SEED_TRANSACTIONS).execute();
    } catch (error) {
        console.error("Error during seed:", error);
        process.exit(1);
    }
};

main();