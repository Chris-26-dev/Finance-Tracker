"use client";

import { useCallback } from "react";
import { useUser } from "@clerk/nextjs";

import {
    CurrencyCode,
    DEFAULT_CURRENCY,
    formatCurrency,
    isSupportedCurrency,
} from "@/lib/utils";

/**
 * The signed-in user's display currency, stored in Clerk `unsafeMetadata`.
 * It only affects formatting; it is never used for authorization and stored
 * amounts are not converted.
 */
export function useCurrency(): CurrencyCode {
    const { user } = useUser();
    const value = user?.unsafeMetadata?.currency;
    return isSupportedCurrency(value) ? value : DEFAULT_CURRENCY;
}

export function useFormatCurrency() {
    const currency = useCurrency();

    return useCallback(
        (value: number, options?: Parameters<typeof formatCurrency>[2]) =>
            formatCurrency(value, currency, options),
        [currency],
    );
}
