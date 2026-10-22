"use client";

import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip
} from "recharts";

import { formatPercentage } from "@/lib/utils";
import { useFormatCurrency } from "@/hooks/use-currency";
import { CategoryTooltip } from "@/components/category-tooltip";

export type CategorySlice = {
    name: string;
    value: number;
    fill: string;
};

type Props = {
    data: CategorySlice[];
};

export const PieVariant = ({ data }: Props) => {
    const formatCurrency = useFormatCurrency();
    const total = data.reduce((sum, slice) => sum + slice.value, 0);

    return (
        <div className="flex flex-col items-center gap-6 sm:flex-row lg:flex-col 2xl:flex-row">
            <div className="relative h-[220px] w-full max-w-[220px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Tooltip content={<CategoryTooltip />}/>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            innerRadius={72}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                            stroke="var(--card)"
                            strokeWidth={2}
                            labelLine={false}
                        >
                            {data.map((slice) => (
                                <Cell key={slice.name} fill={slice.fill} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs text-muted-foreground">Total spent</span>
                    <span className="text-lg font-semibold tabular-nums">{formatCurrency(total, { compact: total >= 100_000 })}</span>
                </div>
            </div>
            <ul className="w-full space-y-2.5">
                {data.map((slice) => (
                    <li key={slice.name} className="flex items-center gap-3 text-sm">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.fill }} />
                        <span className="min-w-0 flex-1 truncate">{slice.name}</span>
                        <span className="tabular-nums text-muted-foreground">
                            {formatPercentage(total ? (slice.value / total) * 100 : 0)}
                        </span>
                        <span className="w-24 text-right font-medium tabular-nums">{formatCurrency(slice.value)}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
