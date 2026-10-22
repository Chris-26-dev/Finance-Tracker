type SeedEnv = Partial<Record<
    "ALLOW_DESTRUCTIVE_SEED" | "SEED_USER_ID" | "NODE_ENV" | "VERCEL_ENV" | "DATABASE_URL",
    string
>>;

/**
 * Reasons the seed script must not run. Empty means it is safe to proceed:
 * explicit opt-in, a Clerk user id to scope every write to, a database URL,
 * and not a production environment.
 */
export function getSeedSafetyErrors(env: SeedEnv) {
    const errors: string[] = [];

    if (env.ALLOW_DESTRUCTIVE_SEED !== "true") {
        errors.push("Set ALLOW_DESTRUCTIVE_SEED=true to confirm you want to replace this user's data.");
    }
    if (!/^user_[A-Za-z0-9]+$/.test(env.SEED_USER_ID ?? "")) {
        errors.push("Set SEED_USER_ID to a Clerk user id (user_...) from a development instance.");
    }
    if (env.NODE_ENV === "production" || env.VERCEL_ENV === "production") {
        errors.push("Refusing to seed in production.");
    }
    if (!env.DATABASE_URL) {
        errors.push("DATABASE_URL is not set.");
    }

    return errors;
}
