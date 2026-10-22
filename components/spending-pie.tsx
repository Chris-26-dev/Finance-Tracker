"use client";

import { useState } from "react";
import { PieChart, Radar, Target, Wallet } from "lucide-react";

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
import { CategorySlice, PieVariant } from "@/components/pie-variant";
import { RadarVariant } from "@/components/radar-variant";
import { RadialVariant } from "@/components/radial-variant";
import { UNCATEGORIZED_LABEL } from "@/lib/utils";

type Props = {
    data?: {
        name: string;
        value: number;
    }[];
};

// Validated categorical order (see app/globals.css). Uncategorized is always
// the neutral grey so it reads as "missing data", not as another category.
const SLOT_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const withColors = (data: NonNullable<Props["data"]>): CategorySlice[] => {
    let slot = 0;
    return data.map((category) => ({
        ...category,
        fill: category.name === UNCATEGORIZED_LABEL
            ? "var(--chart-muted)"
            : SLOT_COLORS[slot++ % SLOT_COLORS.length],
    }));
};

const CHART_TYPES = [
    { value: "pie", label: "Donut", icon: PieChart },
    { value: "radar", label: "Radar", icon: Radar },
    { value: "radial", label: "Radial", icon: Target },
] as const;

export const SpendingPie = ({ data = [] }: Props) => {
    const [chartType, setChartType] = useState("pie");

    const onTypeChange = (type: string) => {
        //TODO: ADD PAYWALL
        setChartType(type);
    }

    const slices = withColors(data);

    return (
        <Card className="h-full gap-4">
            <CardHeader className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                    <CardTitle className="text-base">Spending by category</CardTitle>
                    <CardDescription>Where your money went</CardDescription>
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
            <CardContent>
                {slices.length === 0 ? (
                    <EmptyState
                        icon={Wallet}
                        title="No spending in this period"
                        description="Expenses will appear here, grouped by category."
                        className="h-[320px]"
                    />
                ) : (
                    <>
                        {chartType === "pie" && <PieVariant data={slices} />}
                        {chartType === "radar" && <RadarVariant data={slices} />}
                        {chartType === "radial" && <RadialVariant data={slices} />}
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export const SpendingPieLoading = () => {
    return (
        <Card className="h-full gap-4" aria-hidden>
            <CardHeader className="flex items-start justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-40"/>
                    <Skeleton className="h-4 w-32"/>
                </div>
                <Skeleton className="h-8 w-28"/>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
                <Skeleton className="size-[200px] rounded-full"/>
                <div className="w-full space-y-2">
                    <Skeleton className="h-4 w-full"/>
                    <Skeleton className="h-4 w-5/6"/>
                    <Skeleton className="h-4 w-4/6"/>
                </div>
            </CardContent>
        </Card>
    );
};
