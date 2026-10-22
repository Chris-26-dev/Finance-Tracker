"use client";

import { ArrowDownRight, ArrowUpRight, LucideIcon, Minus } from "lucide-react";
import { cva, VariantProps } from "class-variance-authority";

import { cn, formatPercentage } from "@/lib/utils";
import { useFormatCurrency } from "@/hooks/use-currency";
import { CountUp } from "@/components/count-up";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const iconVariant = cva(
    "flex size-9 shrink-0 items-center justify-center rounded-lg",
    {
        variants: {
            tone: {
                balance: "bg-primary/10 text-primary",
                income: "bg-success/10 text-success",
                expense: "bg-destructive/10 text-destructive",
            },
        },
        defaultVariants: {
            tone: "balance",
        },
    },
);

type DataCardProps = VariantProps<typeof iconVariant> & {
    icon: LucideIcon;
    title: string;
    value?: number;
    dateRange: string;
    percentageChange?: number;
    /** When true, an increase is bad (e.g. expenses). */
    invertTrend?: boolean;
};

export const DataCard = ({
    icon: Icon,
    title,
    value = 0,
    tone,
    dateRange,
    percentageChange = 0,
    invertTrend = false,
}: DataCardProps) => {
    const format = useFormatCurrency();

    const direction = percentageChange > 0 ? "up" : percentageChange < 0 ? "down" : "flat";
    const good = direction === "flat" ? null : (direction === "up") !== invertTrend;
    const TrendIcon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
    const trendLabel = direction === "flat"
        ? "No change"
        : `${direction === "up" ? "Up" : "Down"} ${formatPercentage(Math.abs(percentageChange))}`;

    return (
        <Card className="gap-4 p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground/80 truncate">{dateRange}</p>
                </div>
                <div className={iconVariant({ tone })}>
                    <Icon className="size-[18px]" aria-hidden />
                </div>
            </div>
            <p className="text-2xl font-semibold tracking-tight tabular-nums truncate lg:text-[1.75rem]">
                <CountUp
                    preserveValue
                    start={0}
                    end={value}
                    decimals={2}
                    duration={0.8}
                    formattingFn={(n) => format(n)}
                />
            </p>
            <div className="flex items-center gap-2 text-xs">
                <span
                    className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                        good === null && "bg-muted text-muted-foreground",
                        good === true && "bg-success/10 text-success",
                        good === false && "bg-destructive/10 text-destructive",
                    )}
                >
                    <TrendIcon className="size-3.5" aria-hidden />
                    {trendLabel}
                </span>
                <span className="text-muted-foreground">vs previous period</span>
            </div>
        </Card>
    );
};

export const DataCardLoading = () => {
    return (
        <Card className="gap-4 p-5" aria-hidden>
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="size-9 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-5 w-40" />
        </Card>
    );
};
