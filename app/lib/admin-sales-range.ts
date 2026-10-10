/** Shared Sydney calendar-day range rules for Square sales analytics. */
import { reportPeriodLabel, type ReportPeriod } from "./admin-report-period";

export type SalesRange = {
  mode: ReportPeriod;
  from: string;
  to: string;
  days: number;
  label: string;
};

const STORE_TIME_ZONE = "Australia/Sydney";
const DAY_MS = 86_400_000;

const dayParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: STORE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: STORE_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function numericParts(formatter: Intl.DateTimeFormat, date: Date) {
  const parts = formatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

function dateKey(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

export function sydneyToday(now: Date) {
  const { year, month, day } = numericParts(dayParts, now);
  return dateKey(year, month, day);
}

export function addSalesDays(date: string, days: number) {
  const time = Date.parse(`${date}T00:00:00.000Z`);
  return new Date(time + days * DAY_MS).toISOString().slice(0, 10);
}

export function salesDaysInclusive(from: string, to: string) {
  return Math.round(
    (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / DAY_MS,
  ) + 1;
}

/** Converts a Sydney midnight to UTC, including DST changes. */
export function sydneyMidnightUtc(dateKeyValue: string) {
  const [year, month, day] = dateKeyValue.split("-").map(Number);
  const target = Date.UTC(year, month - 1, day);
  let utc = target;
  for (let i = 0; i < 3; i += 1) {
    const local = numericParts(timeParts, new Date(utc));
    const actual = Date.UTC(
      local.year, local.month - 1, local.day,
      local.hour, local.minute, local.second,
    );
    const offset = target - actual;
    if (offset === 0) break;
    utc += offset;
  }
  return new Date(utc);
}

export function resolveSalesRange(
  mode: ReportPeriod,
  now = new Date(),
): SalesRange {
  const today = sydneyToday(now);
  const days = mode === "7d" ? 7 : mode === "30d" ? 30 : 1;
  return {
    mode,
    from: addSalesDays(today, 1 - days),
    to: today,
    days,
    label: reportPeriodLabel(mode),
  };
}
