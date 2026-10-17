import { z } from "zod";

export const analyticsFilterSchema = z.object({
  range: z.enum(["last28", "day", "month", "year", "custom"]).default("last28"),
  date: z.string().optional(),
  month: z.string().optional(),
  year: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
}).strict();

export type AnalyticsFilter = z.infer<typeof analyticsFilterSchema>;
export type AnalyticsRange = { start: string; end: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MONTH = /^\d{4}-\d{2}$/;
const ISO_YEAR = /^\d{4}$/;

function melbourneToday() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts();
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function addDays(date: string, amount: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function validDate(value: string | undefined): value is string {
  if (!value || !ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function endOfMonth(year: number, month: number) { return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10); }

export function resolveAnalyticsRange(filter: AnalyticsFilter): AnalyticsRange | null {
  const latestCompleteDate = addDays(melbourneToday(), -1);
  let start = "";
  let end = "";
  if (filter.range === "last28") { end = latestCompleteDate; start = addDays(end, -27); }
  else if (filter.range === "day") { const date = filter.date; if (!validDate(date)) return null; start = date; end = date; }
  else if (filter.range === "month") {
    if (!filter.month || !ISO_MONTH.test(filter.month)) return null;
    const [year, month] = filter.month.split("-").map(Number);
    if (month < 1 || month > 12) return null;
    start = `${filter.month}-01`; end = endOfMonth(year, month);
  } else if (filter.range === "year") {
    if (!filter.year || !ISO_YEAR.test(filter.year)) return null;
    start = `${filter.year}-01-01`; end = `${filter.year}-12-31`;
  } else {
    const { start: customStart, end: customEnd } = filter;
    if (!validDate(customStart) || !validDate(customEnd)) return null;
    start = customStart; end = customEnd;
  }
  if (start > end || end > latestCompleteDate || start < "2019-01-01") return null;
  const span = Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1;
  return span >= 1 && span <= 366 ? { start, end } : null;
}

export function filterFromSearchParams(searchParams: URLSearchParams) { return analyticsFilterSchema.safeParse(Object.fromEntries(searchParams.entries())); }
