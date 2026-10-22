"use client";

import { useFormatCurrency } from "@/hooks/use-currency";

type Props = {
    active?: boolean;
    payload?: { value?: number; payload?: { name?: string; fill?: string } }[];
};

export const CategoryTooltip = ({ active, payload }: Props) => {
    const formatCurrency = useFormatCurrency();

    if (!active || !payload?.length) return null;

    const entry = payload[0];

    return (
        <div className="min-w-40 rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md">
            <div className="flex items-center justify-between gap-4 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="size-2 rounded-full" style={{ backgroundColor: entry.payload?.fill }} />
                    {entry.payload?.name}
                </span>
                <span className="font-medium tabular-nums">{formatCurrency(entry.value ?? 0)}</span>
            </div>
        </div>
    )
}
