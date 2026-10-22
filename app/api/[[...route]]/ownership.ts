import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db/drizzle";
import { accounts, categories } from "@/db/schema";

type References = {
    accountIds: (string | null | undefined)[];
    categoryIds: (string | null | undefined)[];
};

const unique = (ids: (string | null | undefined)[]) =>
    Array.from(new Set(ids.filter((id): id is string => !!id)));

/**
 * Returns true only when every referenced account and category belongs to
 * `userId`. Unknown ids and ids owned by another user are treated the same,
 * so callers never learn whether someone else's record exists.
 *
 * The `user_id` of an account/category is never updated by any endpoint, so
 * a check followed by a single-statement write cannot be raced into a
 * cross-user write (neon-http does not support interactive transactions).
 */
export async function ownsReferences(
    userId: string,
    { accountIds, categoryIds }: References,
) {
    const accountSet = unique(accountIds);
    const categorySet = unique(categoryIds);

    if (accountSet.length > 0) {
        const owned = await db
            .select({ id: accounts.id })
            .from(accounts)
            .where(
                and(
                    eq(accounts.userId, userId),
                    inArray(accounts.id, accountSet),
                ),
            );

        if (owned.length !== accountSet.length) {
            return false;
        }
    }

    if (categorySet.length > 0) {
        const owned = await db
            .select({ id: categories.id })
            .from(categories)
            .where(
                and(
                    eq(categories.userId, userId),
                    inArray(categories.id, categorySet),
                ),
            );

        if (owned.length !== categorySet.length) {
            return false;
        }
    }

    return true;
}

export const FORBIDDEN_REFERENCE_ERROR = "Account or category not found";
