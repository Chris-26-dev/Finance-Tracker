"use client";

import { RowActions } from "@/components/row-actions";
import { useOpenAccount } from "@/features/accounts/hooks/use-open-account";
import { useDeleteAccount } from "@/features/accounts/api/use-delete-account";

type Props = {
    id: string;
    label: string;
};

export const Actions = ({ id, label }: Props) => {
    const deleteMutation = useDeleteAccount(id);
    const { onOpen } = useOpenAccount();

    return (
        <RowActions
            label={label}
            confirmTitle="Delete account?"
            confirmMessage="This account and all of its transactions will be permanently deleted."
            onEdit={() => onOpen(id)}
            onDelete={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
        />
    )
}
