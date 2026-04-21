import { format, formatDistanceToNowStrict, parseISO, isValid } from "date-fns";

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const moneyWithCentsFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatMoney(n: number, opts?: { cents?: boolean }): string {
  return opts?.cents
    ? moneyWithCentsFormatter.format(n)
    : moneyFormatter.format(n);
}

export function parseDateSafe(input: string | Date | undefined | null): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isValid(input) ? input : null;
  const d = parseISO(input);
  return isValid(d) ? d : null;
}

export function formatDate(
  input: string | Date | undefined | null,
  pattern = "MMM d, yyyy"
): string {
  const d = parseDateSafe(input);
  return d ? format(d, pattern) : "—";
}

export function formatRelative(input: string | Date | undefined | null): string {
  const d = parseDateSafe(input);
  if (!d) return "—";
  const diff = d.getTime() - Date.now();
  const suffix = formatDistanceToNowStrict(d, { addSuffix: false });
  return diff >= 0 ? `in ${suffix}` : `${suffix} ago`;
}

export function startOfMonthIso(date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  return d.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(days: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isDateBetween(date: string, startIso: string, endIso: string): boolean {
  return date >= startIso && date <= endIso;
}
