"use client";

import { useState } from "react";
import { AreaChart, BarChart3, FileSearch, LineChart } from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectValue,
    SelectItem
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { AreaVariant } from "@/components/area-variant";
import { BarVariant } from "@/components/bar-variant";
import { LineVariant } from "@/components/line-variant";
import { DailyPoint } from "@/components/chart-axes";

type Props = {
    data?: DailyPoint[];
};

const CHART_TYPES = [
    { value: "area", label: "Area", icon: AreaChart },
    { value: "line", label: "Line", icon: LineChart },
    { value: "bar", label: "Bar", icon: BarChart3 },
] as const;

const LEGEND = [
    { label: "Income", color: "var(--income)" },
    { label: "Expenses", color: "var(--expense)" },
];

export const Chart = ({ data = [] }: Props) => {
    const [chartType, setChartType] = useState("area");

    const onTypeChange = (type: string) => {
        //TODO: ADD PAYWALL
        setChartType(type);
    }

    return (
        <Card className="h-full gap-4">
            <CardHeader className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                    <CardTitle className="text-base">Cash flow</CardTitle>
                    <CardDescription>Daily income and expenses</CardDescription>
                </div>
                <Select
                    value={chartType}
                    onValueChange={onTypeChange}
                >
                    <SelectTrigger size="sm" className="w-28" aria-label="Chart type">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                        {CHART_TYPES.map(({ value, label, icon: Icon }) => (
                            <SelectItem key={value} value={value}>
                                <Icon className="size-4" aria-hidden />
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
                {data.length === 0 ? (
                    <EmptyState
                        icon={FileSearch}
                        title="No transactions in this period"
                        description="Try a wider date range or add a transaction."
                        className="h-[320px]"
                    />
                ) : (
                    <>
                        <ul className="mb-3 flex gap-4 px-4 text-xs text-muted-foreground sm:px-0" aria-label="Legend">
                            {LEGEND.map((item) => (
                                <li key={item.label} className="flex items-center gap-1.5">
                                    <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                    {item.label}
                                </li>
                            ))}
                        </ul>
                        {chartType === "line" && <LineVariant data={data} />}
                        {chartType === "area" && <AreaVariant data={data} />}
                        {chartType === "bar" && <BarVariant data={data} />}
                    </>
                )}
            </CardContent>
        </Card>
    );
};


export const ChartLoading = () => {
    return (
        <Card className="h-full gap-4" aria-hidden>
            <CardHeader className="flex items-start justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-24"/>
                    <Skeleton className="h-4 w-40"/>
                </div>
                <Skeleton className="h-8 w-28"/>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[340px] w-full"/>
            </CardContent>
        </Card>
    );
};
