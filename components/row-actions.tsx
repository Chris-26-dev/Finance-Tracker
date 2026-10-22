"use client";

import { MoreHorizontal, Pencil, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

type Props = {
    /** Human-readable name of the row, for accessible labels. */
    label: string;
    confirmTitle: string;
    confirmMessage: string;
    onEdit: () => void;
    onDelete: () => void;
    disabled?: boolean;
};

export const RowActions = ({
    label,
    confirmTitle,
    confirmMessage,
    onEdit,
    onDelete,
    disabled,
}: Props) => {
    const [ConfirmDialog, confirm] = useConfirm(confirmTitle, confirmMessage, {
        confirmLabel: "Delete",
        destructive: true,
    });

    const handleDelete = async () => {
        if (await confirm()) {
            onDelete();
        }
    };

    return (
        <>
            <ConfirmDialog />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8" aria-label={`Actions for ${label}`}>
                        <MoreHorizontal className="size-4"/>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled={disabled} onClick={onEdit}>
                        <Pencil className="size-4"/>
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled={disabled} onClick={handleDelete} variant="destructive">
                        <Trash className="size-4"/>
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}
