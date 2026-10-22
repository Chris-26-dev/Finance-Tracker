"use client";

import { useGetSummary } from "@/features/summary/api/use-get-summary";
import { Chart, ChartLoading } from "@/components/chart";
import { SpendingPie, SpendingPieLoading } from "@/components/spending-pie";

export const DataCharts = () => {
    // Errors are reported once, by DataGrid, which uses the same query.
    const { data, isLoading, isError } = useGetSummary();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <ChartLoading />
                </div>
                <div className="lg:col-span-2">
                    <SpendingPieLoading />
                </div>
            </div>
        );
    }

    if (isError) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
                <Chart data={data?.days} />
            </div>
            <div className="lg:col-span-2">
                <SpendingPie data={data?.categories} />
            </div>
        </div>
    );
};
