"use client";

import { format, parseISO } from "date-fns";

import { useFormatCurrency } from "@/hooks/use-currency";

type Entry = {
    dataKey?: string | number;
    value?: number;
    payload?: { date?: string };
};

type Props = {
    active?: boolean;
    payload?: Entry[];
};

const SERIES = [
    { key: "income", label: "Income", color: "var(--income)" },
    { key: "expenses", label: "Expenses", color: "var(--expense)" },
] as const;

export const CustomTooltip = ({ active, payload }: Props) => {
    const formatCurrency = useFormatCurrency();

    if (!active || !payload?.length) return null;

    const date = payload[0]?.payload?.date;
    const valueOf = (key: string) => payload.find((entry) => entry.dataKey === key)?.value ?? 0;

    return (
        <div className="min-w-44 rounded-lg border bg-popover text-popover-foreground shadow-md">
            {date && (
                <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
                    {format(parseISO(date), "EEE, MMM d, yyyy")}
                </div>
            )}
            <div className="space-y-1.5 px-3 py-2">
                {SERIES.map((series) => (
                    <div key={series.key} className="flex items-center justify-between gap-4 text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                            <span className="size-2 rounded-full" style={{ backgroundColor: series.color }} />
                            {series.label}
                        </span>
                        <span className="font-medium tabular-nums">{formatCurrency(valueOf(series.key))}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
