"use client";

import {
    Tooltip,
    XAxis,
    YAxis,
    BarChart,
    Bar,
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

export const BarVariant = ({ data }: Props) => {
    const currencyTick = useCompactCurrencyTick();

    return (
        <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} barGap={2} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                <Tooltip content={<CustomTooltip/>} cursor={{ fill: "var(--muted)" }}/>
                <Bar
                    dataKey="income"
                    name="Income"
                    fill="var(--income)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={16}
                />
                <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill="var(--expense)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={16}
                />
            </BarChart>
        </ResponsiveContainer>
    );
};
