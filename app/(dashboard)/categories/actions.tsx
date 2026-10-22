"use client";

import { RowActions } from "@/components/row-actions";
import { useOpenCategory } from "@/features/categories/hooks/use-open-category";
import { useDeleteCategory } from "@/features/categories/api/use-delete-category";

type Props = {
    id: string;
    label: string;
};

export const Actions = ({ id, label }: Props) => {
    const deleteMutation = useDeleteCategory(id);
    const { onOpen } = useOpenCategory();

    return (
        <RowActions
            label={label}
            confirmTitle="Delete category?"
            confirmMessage="This category will be deleted. Its transactions will become uncategorized."
            onEdit={() => onOpen(id)}
            onDelete={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
        />
    )
}
