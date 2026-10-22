"use client";

import { format, parseISO } from "date-fns";

import { useFormatCurrency } from "@/hooks/use-currency";

export type DailyPoint = {
    date: string;
    income: number;
    expenses: number;
};

/** Shared, recessive axis/grid styling for the cash-flow charts. */
export const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 12 };
export const GRID_STROKE = "var(--border)";

export const formatDayTick = (value: string) => format(parseISO(value), "MMM d");

export const useCompactCurrencyTick = () => {
    const formatCurrency = useFormatCurrency();
    return (value: number) => formatCurrency(value, { compact: true });
};
