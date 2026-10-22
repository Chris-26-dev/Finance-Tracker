import type { Context, Next } from "hono";

// Replaces "@hono/clerk-auth" in API tests. The caller is whoever the
// `x-test-user-id` header names; no header means signed out.
export const clerkMiddleware = () => async (c: Context, next: Next) => {
    c.set("clerkAuth" as never, { userId: c.req.header("x-test-user-id") ?? null } as never);
    await next();
};

export const getAuth = (c: Context) =>
    c.get("clerkAuth" as never) as { userId: string | null } | undefined;
