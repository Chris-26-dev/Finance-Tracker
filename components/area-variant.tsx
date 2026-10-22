"use client";

import {
    Tooltip,
    XAxis,
    YAxis,
    AreaChart,
    Area,
    ResponsiveContainer,
    CartesianGrid
} from "recharts";
import { CustomTooltip } from "@/components/custom-tooltip";
import {
    AXIS_TICK,
    DailyPoint,
    formatDayTick,
    GRID_STROKE,
    useCompactCurrencyTick,
} from "@/components/chart-axes";

type Props = {
    data: DailyPoint[];
};

export const AreaVariant = ({ data }: Props) => {
    const currencyTick = useCompactCurrencyTick();

    return (
        <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="fill-income" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--income)" stopOpacity={0.25}/>
                        <stop offset="100%" stopColor="var(--income)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="fill-expenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--expense)" stopOpacity={0.25}/>
                        <stop offset="100%" stopColor="var(--expense)" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={GRID_STROKE} />
                <XAxis
                    axisLine={false}
                    tickLine={false}
                    dataKey="date"
                    tickFormatter={formatDayTick}
                    tick={AXIS_TICK}
                    tickMargin={10}
                    minTickGap={24}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={AXIS_TICK}
                    tickFormatter={currencyTick}
                    width={64}
                />
                <Tooltip content={<CustomTooltip/>} cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "4 4" }}/>
                <Area
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    strokeWidth={2}
                    stroke="var(--income)"
                    fill="url(#fill-income)"
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                />
                <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses"
                    strokeWidth={2}
                    stroke="var(--expense)"
                    fill="url(#fill-expenses)"
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}
