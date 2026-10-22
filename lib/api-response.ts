export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

type JsonResponse<T> = {
    ok: boolean;
    status: number;
    json(): Promise<T>;
};

/**
 * Body type of the non-error variants of a (Hono client) response union.
 * Hono types `ok` as `false` for explicit error statuses, so those variants
 * are dropped.
 */
export type SuccessBody<R> = R extends { ok: false }
    ? never
    : R extends { json(): Promise<infer T> }
        ? T
        : never;

const messageFromBody = (body: unknown): string | undefined => {
    if (!body || typeof body !== "object" || !("error" in body)) {
        return undefined;
    }

    const error = (body as { error: unknown }).error;

    if (typeof error === "string") {
        return error;
    }

    // @hono/zod-validator responds with { success: false, error: ZodError }.
    if (error && typeof error === "object" && "issues" in error) {
        const [issue] = (error as { issues: { message?: string }[] }).issues ?? [];
        if (issue?.message) {
            return issue.message;
        }
    }

    return undefined;
};

/**
 * Resolve a fetch/Hono client response to its JSON body, throwing an
 * ApiError (with the server's message when available) for non-2xx statuses.
 */
export async function handleResponse<R extends JsonResponse<unknown>>(
    response: R,
): Promise<SuccessBody<R>> {
    if (!response.ok) {
        let message: string | undefined;

        try {
            message = messageFromBody(await response.json());
        } catch {
            // Non-JSON error body; fall back to a generic message.
        }

        throw new ApiError(
            message ?? `Request failed with status ${response.status}`,
            response.status,
        );
    }

    return response.json() as Promise<SuccessBody<R>>;
}
