"use client";

import { RowActions } from "@/components/row-actions";
import { useOpenTransaction } from "@/features/transactions/hooks/use-open-transaction";
import { useDeleteTransaction } from "@/features/transactions/api/use-delete-transaction";

type Props = {
    id: string;
    label: string;
};

export const Actions = ({ id, label }: Props) => {
    const deleteMutation = useDeleteTransaction(id);
    const { onOpen } = useOpenTransaction();

    return (
        <RowActions
            label={label}
            confirmTitle="Delete transaction?"
            confirmMessage="This transaction will be permanently deleted."
            onEdit={() => onOpen(id)}
            onDelete={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
        />
    )
}
