import { describe, expect, it } from "vitest";

import { ApiError, handleResponse } from "@/lib/api-response";

const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("handleResponse", () => {
    it("returns the body for successful responses", async () => {
        await expect(handleResponse(json({ data: { id: "1" } }, 200))).resolves.toEqual({ data: { id: "1" } });
    });

    it("throws the server's error message for failed responses", async () => {
        const error = await handleResponse(json({ error: "An account with this name already exists" }, 409))
            .catch((e) => e);
        expect(error).toBeInstanceOf(ApiError);
        expect(error.message).toBe("An account with this name already exists");
        expect(error.status).toBe(409);
    });

    it("surfaces the first zod validation issue", async () => {
        const body = { success: false, error: { name: "ZodError", issues: [{ message: "Payee is required" }] } };
        await expect(handleResponse(json(body, 400))).rejects.toThrow("Payee is required");
    });

    it("falls back to a generic message for non-JSON errors", async () => {
        const response = new Response("<html>Bad gateway</html>", { status: 502 });
        await expect(handleResponse(response)).rejects.toThrow("Request failed with status 502");
    });

    it("never treats 4xx/5xx as success", async () => {
        for (const status of [400, 401, 403, 404, 409, 500]) {
            await expect(handleResponse(json({ data: "looks fine" }, status))).rejects.toBeInstanceOf(ApiError);
        }
    });
});
