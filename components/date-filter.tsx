"use client";

import qs from "query-string";
import { useState } from "react";
import {
    endOfMonth,
    format,
    parse,
    startOfMonth,
    startOfYear,
    subDays,
    subMonths,
} from "date-fns";
import { DateRange } from "react-day-picker";
import { CalendarDays, ChevronDown } from "lucide-react";
import {
    usePathname,
    useRouter,
    useSearchParams
} from "next/navigation";

import { cn, DAY_PARAM_FORMAT, DEFAULT_RANGE_DAYS, formatDateRange, parseDayParam } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

// URL params are calendar days; parse them as local dates so the label and
// calendar never shift by a day for users west of UTC.
const fromParam = (value: string | null) =>
    value && parseDayParam(value) ? parse(value, DAY_PARAM_FORMAT, new Date()) : undefined;

const PRESETS: { label: string; range: () => { from: Date; to: Date } }[] = [
    { label: "Last 7 days", range: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
    { label: "Last 30 days", range: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
    { label: "Last 90 days", range: () => ({ from: subDays(new Date(), 90), to: new Date() }) },
    { label: "This month", range: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
    {
        label: "Last month",
        range: () => {
            const lastMonth = subMonths(new Date(), 1);
            return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
        },
    },
    { label: "This year", range: () => ({ from: startOfYear(new Date()), to: new Date() }) },
];

export const DateFilter = () => {
    const router = useRouter();
    const pathname = usePathname();

    const params = useSearchParams();
    const accountId = params.get("accountId");
    const from = fromParam(params.get("from"));
    const to = fromParam(params.get("to"));

    const defaultTo = new Date();
    const defaultFrom = subDays(defaultTo, DEFAULT_RANGE_DAYS);

    const paramState = {
        from: from ?? defaultFrom,
        to: to ?? defaultTo,
    };

    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<DateRange | undefined>(paramState);

    const pushToUrl = (dateRange: DateRange | undefined) => {
        const query = {
            from: dateRange?.from ? format(dateRange.from, DAY_PARAM_FORMAT) : undefined,
            to: dateRange?.to ? format(dateRange.to, DAY_PARAM_FORMAT) : undefined,
            accountId,
        };

        const url = qs.stringifyUrl({
            url: pathname,
            query,
        }, { skipEmptyString: true, skipNull: true });

        router.push(url);
    };

    const onOpenChange = (nextOpen: boolean) => {
        // Start from what the URL currently says (e.g. after back/forward).
        if (nextOpen) setDate(paramState);
        setOpen(nextOpen);
    };

    const apply = (range: DateRange | undefined) => {
        pushToUrl(range);
        setOpen(false);
    };

    const onReset = () => apply(undefined);

    const isCustom = !!from || !!to;

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn("w-full justify-between font-normal sm:w-auto", !isCustom && "text-muted-foreground")}
                    aria-label={`Date range: ${formatDateRange(paramState)}`}
                >
                    <span className="flex items-center gap-2">
                        <CalendarDays className="size-4" aria-hidden />
                        {formatDateRange(paramState)}
                    </span>
                    <ChevronDown className="size-4 opacity-50" aria-hidden />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] p-0" align="end">
                <div className="flex flex-col sm:flex-row">
                    <div className="flex flex-row flex-wrap gap-1 border-b p-2 sm:w-36 sm:flex-col sm:border-b-0 sm:border-r">
                        {PRESETS.map((preset) => (
                            <Button
                                key={preset.label}
                                variant="ghost"
                                size="sm"
                                className="justify-start font-normal"
                                onClick={() => apply(preset.range())}
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </div>
                    <div>
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                            disabled={{ after: new Date() }}
                        />
                        <div className="flex items-center justify-end gap-2 border-t p-3">
                            <Button
                                onClick={onReset}
                                disabled={!isCustom}
                                variant="ghost"
                                size="sm"
                            >
                                Reset
                            </Button>
                            <Button
                                onClick={() => apply(date)}
                                disabled={!date?.from || !date?.to}
                                size="sm"
                            >
                                Apply
                            </Button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
