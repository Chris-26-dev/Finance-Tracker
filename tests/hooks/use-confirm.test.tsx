// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";

import { useConfirm } from "@/hooks/use-confirm";

// Vitest runs without globals, so unmount explicitly between tests.
afterEach(cleanup);

const setup = () => {
    const hook = renderHook(() => useConfirm("Delete account?", "This cannot be undone."));
    const Dialog = () => {
        const [ConfirmDialog] = hook.result.current;
        return <ConfirmDialog />;
    };
    const view = render(<Dialog />);
    const rerender = () => view.rerender(<Dialog />);
    return { hook, rerender };
};

describe("useConfirm", () => {
    it("resolves true when confirmed", async () => {
        const { hook, rerender } = setup();
        let promise!: Promise<boolean>;
        act(() => { promise = hook.result.current[1](); });
        rerender();

        fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
        await expect(promise).resolves.toBe(true);
    });

    it("resolves false when cancelled", async () => {
        const { hook, rerender } = setup();
        let promise!: Promise<boolean>;
        act(() => { promise = hook.result.current[1](); });
        rerender();

        fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));
        await expect(promise).resolves.toBe(false);
    });

    it("resolves false when dismissed with Escape", async () => {
        const { hook, rerender } = setup();
        let promise!: Promise<boolean>;
        act(() => { promise = hook.result.current[1](); });
        rerender();

        const dialog = await screen.findByRole("dialog");
        fireEvent.keyDown(dialog, { key: "Escape" });
        await expect(promise).resolves.toBe(false);
    });

    it("resolves false when the close button is used", async () => {
        const { hook, rerender } = setup();
        let promise!: Promise<boolean>;
        act(() => { promise = hook.result.current[1](); });
        rerender();

        fireEvent.click(await screen.findByRole("button", { name: "Close" }));
        await expect(promise).resolves.toBe(false);
    });

    it("settles a pending promise when confirm() is called again", async () => {
        const { hook, rerender } = setup();
        let first!: Promise<boolean>;
        let second!: Promise<boolean>;
        act(() => { first = hook.result.current[1](); });
        act(() => { second = hook.result.current[1](); });
        rerender();

        await expect(first).resolves.toBe(false);
        fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
        await expect(second).resolves.toBe(true);
    });

    it("resolves only once even if clicked twice", async () => {
        const { hook, rerender } = setup();
        const results: boolean[] = [];
        act(() => { hook.result.current[1]().then((value) => results.push(value)); });
        rerender();

        const confirmButton = await screen.findByRole("button", { name: "Confirm" });
        fireEvent.click(confirmButton);
        fireEvent.click(confirmButton);
        await waitFor(() => expect(results).toEqual([true]));
    });
});
