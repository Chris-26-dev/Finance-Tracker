"use client";

import {
    RadialBar,
    RadialBarChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

import { useFormatCurrency } from "@/hooks/use-currency";
import { CategoryTooltip } from "@/components/category-tooltip";
import { CategorySlice } from "@/components/pie-variant";

type Props = {
    data: CategorySlice[];
};

export const RadialVariant = ({ data }: Props) => {
    const formatCurrency = useFormatCurrency();

    return (
        <div className="space-y-4">
            <ResponsiveContainer width="100%" height={240}>
                <RadialBarChart
                    cx="50%"
                    cy="50%"
                    barSize={10}
                    innerRadius="30%"
                    outerRadius="100%"
                    data={[...data].reverse()}
                >
                    <Tooltip content={<CategoryTooltip />} />
                    <RadialBar
                        background={{ fill: "var(--muted)" }}
                        dataKey="value"
                        cornerRadius={4}
                    />
                </RadialBarChart>
            </ResponsiveContainer>
            <ul className="space-y-2.5">
                {data.map((slice) => (
                    <li key={slice.name} className="flex items-center gap-3 text-sm">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.fill }} />
                        <span className="min-w-0 flex-1 truncate">{slice.name}</span>
                        <span className="font-medium tabular-nums">{formatCurrency(slice.value)}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
