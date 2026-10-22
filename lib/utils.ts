import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parse, subDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertAmountFromMiliunits(amount: number) {
  return amount / 1000;
}

export function convertAmountToMiliunits(amount: number) {
  return Math.round(amount * 1000);
}

export const SUPPORTED_CURRENCIES = [
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "PHP", label: "Philippine Peso" },
  { code: "JPY", label: "Japanese Yen" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "AUD", label: "Australian Dollar" },
  { code: "SGD", label: "Singapore Dollar" },
  { code: "INR", label: "Indian Rupee" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];
export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export function isSupportedCurrency(value: unknown): value is CurrencyCode {
  return SUPPORTED_CURRENCIES.some((currency) => currency.code === value);
}

/**
 * Format an amount in currency units (not miliunits). Data hooks convert
 * miliunits at the API boundary, so every caller passes units.
 */
export function formatCurrency(
  value: number,
  currency: CurrencyCode = DEFAULT_CURRENCY,
  options: { compact?: boolean; signDisplay?: "auto" | "always" | "exceptZero" } = {},
) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: options.compact ? "compact" : "standard",
    maximumFractionDigits: options.compact ? 1 : undefined,
    signDisplay: options.signDisplay ?? "auto",
  }).format(value);
};

export function calculatePercentageChange(
  current: number,
  previous: number,
) {
  if (previous === 0) {
    return previous === current ? 0 : 100;
  }

  // Divide by the magnitude so the sign reflects the direction of change
  // even when the previous value was negative.
  return ((current - previous) / Math.abs(previous)) * 100;
}

const DAY_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_RANGE_DAYS = 30;
export const UNCATEGORIZED_LABEL = "Uncategorized";
export const DELETE_DATA_CONFIRMATION = "DELETE";
export const DAY_PARAM_FORMAT = "yyyy-MM-dd";
export const DAY_PARAM_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Transaction dates are calendar days stored as UTC midnight. Parse a
 * `yyyy-MM-dd` value to that UTC midnight, or undefined when invalid.
 */
export function parseDayParam(value?: string | null) {
  if (!value || !DAY_PARAM_REGEX.test(value)) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return undefined;
  }

  return date;
}

/**
 * Resolve `from`/`to` query params into an inclusive UTC range:
 * `start` is the first day's midnight, `end` the last millisecond of `to`.
 * Defaults to the last 30 days. Returns null for malformed input.
 */
export function resolveDateRange(
  from?: string | null,
  to?: string | null,
  now: Date = new Date(),
) {
  const startParam = parseDayParam(from);
  const endParam = parseDayParam(to);

  if ((from && !startParam) || (to && !endParam)) {
    return null;
  }

  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const endDay = endParam ?? today;
  const startDay = startParam ?? new Date(endDay.getTime() - DEFAULT_RANGE_DAYS * DAY_MS);

  if (startDay.getTime() > endDay.getTime()) {
    return null;
  }

  return {
    start: startDay,
    end: new Date(endDay.getTime() + DAY_MS - 1),
    days: Math.round((endDay.getTime() - startDay.getTime()) / DAY_MS) + 1,
  };
}

/** `yyyy-MM-dd` key for a UTC-midnight calendar date. */
export function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Convert a stored calendar date (UTC midnight, possibly serialized) to a
 * local Date on the same calendar day, so formatting never shifts the day
 * for users west of UTC.
 */
export function toLocalCalendarDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/** Inverse of toLocalCalendarDate: a local calendar day stored as UTC midnight. */
export function toUtcCalendarDate(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

export function fillMissingDays(
  activeDays: {
    date: string;
    income: number;
    expenses: number;
  }[],
  startDate: Date,
  endDate: Date,
) {
  if (activeDays.length === 0) {
    return [];
  }

  const byDay = new Map(activeDays.map((day) => [day.date, day]));
  const days = [];

  for (let time = startDate.getTime(); time <= endDate.getTime(); time += DAY_MS) {
    const key = toDayKey(new Date(time));
    days.push(byDay.get(key) ?? { date: key, income: 0, expenses: 0 });
  }

  return days;
}

type Period = {
  from: string | Date | undefined;
  to: string | Date | undefined;
}

const toDisplayDate = (value: string | Date) =>
  typeof value === "string" ? parse(value, DAY_PARAM_FORMAT, new Date()) : value;

export function formatDateRange (period?: Period) {
  const defaultTo = new Date();
  const defaultFrom = subDays(defaultTo, DEFAULT_RANGE_DAYS);

  if (!period?.from) {
    return `${format(defaultFrom, "LLL dd")} - ${format(defaultTo, "LLL dd, y")}`
  }

  if (period.to) {
    return `${format(toDisplayDate(period.from), "LLL dd")} - ${format(toDisplayDate(period.to), "LLL dd, y")}`
  }

  return format(toDisplayDate(period.from), "LLL dd, y");
}

export function formatPercentage(
  value: number,
  options: { addPrefix?: boolean } = {
    addPrefix: false,
  },
) {
  const result = new Intl.NumberFormat("en-US", {
    style: "percent",
  }).format(value / 100);

  if (options.addPrefix && value > 0) {
    return `+${result}`;
  }

  return result;
};