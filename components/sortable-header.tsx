"use client";

import { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props<TData, TValue> = {
    column: Column<TData, TValue>;
    title: string;
    align?: "left" | "right";
};

export function SortableHeader<TData, TValue>({ column, title, align = "left" }: Props<TData, TValue>) {
    const sorted = column.getIsSorted();
    const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;

    return (
        <Button
            variant="ghost"
            size="sm"
            className={cn(
                "-mx-2 h-8 gap-1.5 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground",
                align === "right" && "ml-auto flex",
            )}
            onClick={() => column.toggleSorting(sorted === "asc")}
        >
            {title}
            <Icon className={cn("size-3.5", !sorted && "opacity-40")} aria-hidden />
        </Button>
    );
}
