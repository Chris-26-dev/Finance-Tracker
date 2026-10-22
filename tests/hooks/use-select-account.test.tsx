// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";

const accounts = vi.hoisted(() => ({
    list: [{ id: "acc_1", name: "Checking" }],
}));

vi.mock("@/features/accounts/api/use-get-accounts", () => ({
    useGetAccounts: () => ({ data: accounts.list, isLoading: false }),
}));

// Creating an account succeeds immediately with a new id.
vi.mock("@/features/accounts/api/use-create-account", () => ({
    useCreateAccount: () => ({
        isPending: false,
        mutate: (
            { name }: { name: string },
            options?: { onSuccess?: (response: { data: { id: string; name: string } }) => void },
        ) => {
            const created = { id: "acc_new", name };
            accounts.list = [...accounts.list, created];
            options?.onSuccess?.({ data: created });
        },
    }),
}));

import { useSelectAccount } from "@/features/accounts/hooks/use-select-account";

afterEach(() => {
    cleanup();
    accounts.list = [{ id: "acc_1", name: "Checking" }];
});

const setup = () => {
    const hook = renderHook(() => useSelectAccount());
    const Dialog = () => {
        const [AccountDialog] = hook.result.current;
        return <AccountDialog />;
    };
    const view = render(<Dialog />);
    const open = () => {
        let promise!: Promise<string | undefined>;
        act(() => { promise = hook.result.current[1](); });
        view.rerender(<Dialog />);
        return promise;
    };
    return { open, rerender: () => view.rerender(<Dialog />) };
};

const continueButton = () => screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement;

describe("useSelectAccount", () => {
    it("requires a selection before continuing", async () => {
        const { open } = setup();
        open();
        await screen.findByRole("dialog");
        expect(continueButton().disabled).toBe(true);
    });

    it("selects an account the user just created", async () => {
        const { open, rerender } = setup();
        const promise = open();

        const input = await screen.findByRole("combobox");
        fireEvent.change(input, { target: { value: "Travel card" } });
        fireEvent.keyDown(input, { key: "Enter" });
        rerender();

        expect(continueButton().disabled).toBe(false);
        fireEvent.click(continueButton());
        await expect(promise).resolves.toBe("acc_new");
    });

    it("resolves undefined on Escape and starts fresh when reopened", async () => {
        const { open, rerender } = setup();
        const first = open();

        const input = await screen.findByRole("combobox");
        fireEvent.change(input, { target: { value: "Temp" } });
        fireEvent.keyDown(input, { key: "Enter" });
        rerender();
        expect(continueButton().disabled).toBe(false);

        fireEvent.keyDown(await screen.findByRole("dialog"), { key: "Escape" });
        await expect(first).resolves.toBeUndefined();

        open();
        await screen.findByRole("dialog");
        expect(continueButton().disabled).toBe(true);
    });
});
