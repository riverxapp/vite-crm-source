import { crmConfig } from "@/config/crm";

const money = new Intl.NumberFormat(crmConfig.locale, {
  style: "currency",
  currency: crmConfig.currency,
  maximumFractionDigits: 0,
});

const compactMoney = new Intl.NumberFormat(crmConfig.locale, {
  style: "currency",
  currency: crmConfig.currency,
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatMoney(cents: number | null | undefined) {
  return money.format((cents ?? 0) / 100);
}

export function formatMoneyCompact(cents: number | null | undefined) {
  return compactMoney.format((cents ?? 0) / 100);
}

export function toCents(input: string) {
  const value = Number.parseFloat(input.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

export function centsToInput(cents: number | null | undefined) {
  return cents ? String(cents / 100) : "";
}

const dateFormat = new Intl.DateTimeFormat(crmConfig.locale, { month: "short", day: "numeric", year: "numeric" });
const dateTimeFormat = new Intl.DateTimeFormat(crmConfig.locale, { dateStyle: "medium", timeStyle: "short" });
const relativeFormat = new Intl.RelativeTimeFormat(crmConfig.locale, { numeric: "auto" });

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 86400],
  ["month", 30 * 86400],
  ["week", 7 * 86400],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

export function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function formatDate(date: Date | null | undefined) {
  return date ? dateFormat.format(date) : "—";
}

export function formatDateTime(date: Date | null | undefined) {
  return date ? dateTimeFormat.format(date) : "—";
}

export function formatRelative(date: Date | null | undefined) {
  if (!date) return "—";
  const seconds = (date.getTime() - Date.now()) / 1000;
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size) return relativeFormat.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

/** Due before today (a task due today is not overdue). */
export function isOverdue(date: Date | null | undefined) {
  return Boolean(date && date < startOfDay());
}

/** yyyy-MM-dd for <input type="date">, in local time. */
export function toDateInput(date: Date | null | undefined) {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateInput(value: string) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

export function fullName(p: { firstName: string; lastName?: string | null }) {
  return [p.firstName, p.lastName].filter(Boolean).join(" ");
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/** Empty strings from form fields become null so optional columns stay NULL. */
export function nullify<T extends Record<string, unknown>>(values: T) {
  return Object.fromEntries(
    Object.entries(values).map(([k, v]) => [k, typeof v === "string" && v.trim() === "" ? null : v]),
  ) as { [K in keyof T]: T[K] extends string ? string | null : T[K] };
}

export function likePattern(search: string) {
  return `%${search.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export function plural(count: number, word: string, pluralWord = `${word}s`) {
  return `${count.toLocaleString()} ${count === 1 ? word : pluralWord}`;
}
