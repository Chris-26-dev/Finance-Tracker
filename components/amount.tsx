"use client";

import { useFormatCurrency } from "@/hooks/use-currency";
import { cn } from "@/lib/utils";

type Props = {
    /** Amount in currency units; negative = expense. */
    value: number;
    className?: string;
};

/**
 * Income shows in green with an explicit "+"; expenses keep the default text
 * colour with a minus sign, so meaning never relies on colour alone.
 */
export const Amount = ({ value, className }: Props) => {
    const formatCurrency = useFormatCurrency();

    return (
        <span
            className={cn(
                "font-medium tabular-nums whitespace-nowrap",
                value > 0 && "text-success",
                className,
            )}
        >
            {formatCurrency(value, { signDisplay: "exceptZero" })}
        </span>
    );
};
