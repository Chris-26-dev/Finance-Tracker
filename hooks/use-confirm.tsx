import React, { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

type ConfirmOptions = {
    confirmLabel?: string;
    destructive?: boolean;
};

/**
 * Promise-based confirmation dialog. The promise resolves exactly once:
 * `true` on Confirm, `false` on Cancel, Escape, the close button or an
 * outside click. Calling `confirm()` while a dialog is already open settles
 * the earlier promise with `false` instead of leaving it pending.
 */
export const useConfirm = (
    title: string,
    message: string,
    { confirmLabel = "Confirm", destructive = false }: ConfirmOptions = {},
): [() => React.ReactNode, () => Promise<boolean>] => {
    const [open, setOpen] = useState(false);
    const resolver = useRef<((value: boolean) => void) | null>(null);

    const settle = useCallback((value: boolean) => {
        const resolve = resolver.current;
        resolver.current = null;
        setOpen(false);
        resolve?.(value);
    }, []);

    const confirm = useCallback(() => {
        resolver.current?.(false);

        return new Promise<boolean>((resolve) => {
            resolver.current = resolve;
            setOpen(true);
        });
    }, []);

    const ConfirmationDialog = () => (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) settle(false);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{message}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="pt-2">
                    <Button
                        onClick={() => settle(false)}
                        variant="outline"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => settle(true)}
                        variant={destructive ? "destructive" : "default"}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    return [ConfirmationDialog, confirm]
};
