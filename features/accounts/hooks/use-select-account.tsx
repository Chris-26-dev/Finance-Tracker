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
import { Label } from "@/components/ui/label";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useCreateAccount } from "@/features/accounts/api/use-create-account";
import { Select } from "@/components/select";


/**
 * Promise-based account picker. Resolves exactly once with the selected
 * account id, or `undefined` when cancelled or dismissed (Escape, close
 * button, outside click). The selection is reset every time it opens.
 */
export const useSelectAccount = (): [() => React.ReactNode, () => Promise<string | undefined>] => {
    const accountQuery = useGetAccounts();
    const accountMutation = useCreateAccount();
    const accountOptions = (accountQuery.data ?? []).map((account) => ({
        label: account.name,
        value: account.id
    }));

    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<string | undefined>(undefined);
    const resolver = useRef<((value: string | undefined) => void) | null>(null);

    const onCreateAccount = (name: string) => accountMutation.mutate(
        { name: name.trim() },
        {
            // Select the account the user just created.
            onSuccess: (response) => setSelected(response.data.id),
        },
    );

    const settle = useCallback((value: string | undefined) => {
        const resolve = resolver.current;
        resolver.current = null;
        setOpen(false);
        resolve?.(value);
    }, []);

    const confirm = useCallback(() => {
        resolver.current?.(undefined);

        return new Promise<string | undefined>((resolve) => {
            resolver.current = resolve;
            setSelected(undefined);
            setOpen(true);
        });
    }, []);

    const ConfirmationDialog = () => (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) settle(undefined);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select account</DialogTitle>
                    <DialogDescription>
                        Choose the account these transactions belong to, or type a name to create one.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="import-account">Account</Label>
                    <Select
                        id="import-account"
                        placeholder="Select an account"
                        options={accountOptions}
                        onCreate={onCreateAccount}
                        value={selected}
                        onChange={setSelected}
                        disabled={accountQuery.isLoading || accountMutation.isPending}
                    />
                </div>
                <DialogFooter className="pt-2">
                    <Button
                        onClick={() => settle(undefined)}
                        variant="outline"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => settle(selected)}
                        disabled={!selected}
                    >
                        Continue
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    return [ConfirmationDialog, confirm]
};
