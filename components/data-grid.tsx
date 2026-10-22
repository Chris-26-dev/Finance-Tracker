"use client";

import { useSearchParams } from "next/navigation";
import { PiggyBank, TrendingDown, TrendingUp } from "lucide-react";

import { useGetSummary } from "@/features/summary/api/use-get-summary";
import { formatDateRange } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/error-state";
import { DataCard, DataCardLoading } from "@/components/data-card";

export const DataGrid = () => {
    const { data, isLoading, isError, error, refetch } = useGetSummary();

    const params = useSearchParams();
    const to = params.get("to") || undefined;
    const from = params.get("from") || undefined;

    const dateRangeLabel = formatDateRange({ to, from });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <DataCardLoading />
                <DataCardLoading />
                <DataCardLoading />
            </div>
        )
    }

    if (isError) {
        return (
            <Card>
                <ErrorState title="Couldn't load your summary" error={error} onRetry={() => refetch()} />
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <DataCard
                title="Net balance"
                value={data?.remainingAmount}
                percentageChange={data?.remainingChange}
                icon={PiggyBank}
                tone="balance"
                dateRange={dateRangeLabel}
            />
            <DataCard
                title="Income"
                value={data?.incomeAmount}
                percentageChange={data?.incomeChange}
                icon={TrendingUp}
                tone="income"
                dateRange={dateRangeLabel}
            />
            <DataCard
                title="Expenses"
                value={data?.expensesAmount}
                percentageChange={data?.expensesChange}
                icon={TrendingDown}
                tone="expense"
                dateRange={dateRangeLabel}
                invertTrend
            />
        </div>
    )
}
