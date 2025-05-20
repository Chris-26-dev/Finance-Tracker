import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Load env vars
config({ path: ".env.local" });

// Use the 'postgres' client from the 'postgres' package
const client = postgres(process.env.DATABASE_URL!, {
  ssl: 'require',
});

const db = drizzle(client);

const main = async () => {
  try {
    await migrate(db, { migrationsFolder: "drizzle" });
    console.log("✅ Migration complete");
    await client.end(); // close the connection
  } catch (err) {
    console.error("❌ Error during migration:", err);
    process.exit(1);
  }
};

main();
