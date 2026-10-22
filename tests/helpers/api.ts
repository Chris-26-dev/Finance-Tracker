/**
 * Shared helpers for API tests. Each API test file must declare:
 *
 *   vi.mock("@/db/drizzle", () => import("../helpers/mock-db"));
 *   vi.mock("@hono/clerk-auth", () => import("../helpers/mock-clerk"));
 *
 * so every file gets its own in-memory PGlite database and a Clerk stub that
 * reads the caller from the `x-test-user-id` header.
 */
export const USER_A = "user_alice";
export const USER_B = "user_bob";

type RequestOptions = {
    user?: string | null;
    body?: unknown;
};

export async function request(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    { user, body }: RequestOptions = {},
) {
    const { app } = await import("@/app/api/[[...route]]/app");

    const headers: Record<string, string> = {};
    if (user) headers["x-test-user-id"] = user;
    if (body !== undefined) headers["content-type"] = "application/json";

    const response = await app.request(path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    const json = await response.json().catch(() => null);
    return { status: response.status, json };
}
