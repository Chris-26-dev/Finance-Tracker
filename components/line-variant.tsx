"use client";

import {
    Tooltip,
    XAxis,
    YAxis,
    LineChart,
    Line,
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

export const LineVariant = ({ data }: Props) => {
    const currencyTick = useCompactCurrencyTick();

    return (
        <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                <Line
                    dot={false}
                    dataKey="income"
                    name="Income"
                    stroke="var(--income)"
                    strokeWidth={2}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                />
                <Line
                    dot={false}
                    dataKey="expenses"
                    name="Expenses"
                    stroke="var(--expense)"
                    strokeWidth={2}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
};
