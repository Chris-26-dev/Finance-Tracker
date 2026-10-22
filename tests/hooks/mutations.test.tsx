// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, act, renderHook, waitFor } from "@testing-library/react";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const respond = vi.hoisted(() => ({
    next: null as null | { status: number; body: unknown },
}));

const fakeEndpoint = async () =>
    new Response(JSON.stringify(respond.next!.body), {
        status: respond.next!.status,
        headers: { "content-type": "application/json" },
    });

// Every client method used by the mutation hooks resolves to `respond.next`.
vi.mock("@/lib/hono", () => {
    const endpoint = new Proxy({}, {
        get: () => endpoint,
        apply: () => fakeEndpoint(),
    });
    const callable: unknown = new Proxy(function () {}, {
        get: () => callable,
        apply: () => fakeEndpoint(),
    });
    return { client: callable };
});

import { useCreateAccount } from "@/features/accounts/api/use-create-account";
import { useEditTransaction } from "@/features/transactions/api/use-edit-transaction";
import { useBulkCreateTransactions } from "@/features/transactions/api/use-bulk-create-transactions";
import { useDeleteCategory } from "@/features/categories/api/use-delete-category";

// Vitest runs without globals, so unmount explicitly between tests.
afterEach(cleanup);

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
        {children}
    </QueryClientProvider>
);

beforeEach(() => {
    toast.success.mockReset();
    toast.error.mockReset();
});

describe("mutation hooks", () => {
    it("report failure, not success, when the server rejects the request", async () => {
        respond.next = { status: 409, body: { error: "An account with this name already exists" } };
        const onSuccess = vi.fn();
        const { result } = renderHook(() => useCreateAccount(), { wrapper });

        act(() => result.current.mutate({ name: "Checking" }, { onSuccess }));

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(onSuccess).not.toHaveBeenCalled();
        expect(toast.success).not.toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith("Failed to create account", {
            description: "An account with this name already exists",
        });
    });

    it.each([
        ["edit transaction", () => useEditTransaction("tx_1"), { amount: 1, payee: "x", date: new Date(), accountId: "a" }],
        ["bulk-create transactions", () => useBulkCreateTransactions(), []],
        ["delete category", () => useDeleteCategory("cat_1"), undefined],
    ] as const)("%s surfaces 403/404/500 as errors", async (_label, useHook, variables) => {
        for (const status of [403, 404, 500]) {
            toast.success.mockReset();
            respond.next = { status, body: { error: `status ${status}` } };
            const { result } = renderHook(useHook as () => ReturnType<typeof useDeleteCategory>, { wrapper });

            act(() => result.current.mutate(variables as never));

            await waitFor(() => expect(result.current.isError).toBe(true));
            expect(result.current.error?.message).toBe(`status ${status}`);
            expect(toast.success).not.toHaveBeenCalled();
        }
    });

    it("report success only after a 2xx response", async () => {
        respond.next = { status: 200, body: { data: { id: "acc_1", name: "Checking", userId: "u", plaidId: null } } };
        const { result } = renderHook(() => useCreateAccount(), { wrapper });

        let created: unknown;
        await act(async () => { created = await result.current.mutateAsync({ name: "Checking" }); });

        expect(created).toEqual({ data: { id: "acc_1", name: "Checking", userId: "u", plaidId: null } });
        expect(toast.success).toHaveBeenCalledWith("Account created");
        expect(toast.error).not.toHaveBeenCalled();
    });
});
