"use client";

import {
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
    Tooltip
} from "recharts";

import { useFormatCurrency } from "@/hooks/use-currency";
import { CategoryTooltip } from "@/components/category-tooltip";
import { CategorySlice } from "@/components/pie-variant";

type Props = {
    data: CategorySlice[];
};

export const RadarVariant = ({ data }: Props) => {
    const formatCurrency = useFormatCurrency();

    return (
        <ResponsiveContainer width="100%" height={300}>
            <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="65%"
                data={data.map((slice) => ({ ...slice, fill: "var(--chart-1)" }))}
            >
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} dataKey="name" />
                <PolarRadiusAxis
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    tickFormatter={(value: number) => formatCurrency(value, { compact: true })}
                    axisLine={false}
                />
                <Tooltip content={<CategoryTooltip />} />
                <Radar dataKey="value" stroke="var(--chart-1)" strokeWidth={2} fill="var(--chart-1)" fillOpacity={0.25}/>
            </RadarChart>
        </ResponsiveContainer>
    );
};
