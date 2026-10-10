/** Shared Sydney calendar-day range rules for Square sales analytics. */
export const MAX_SALES_RANGE_DAYS = 366;
export type SalesRangeMode = "7d" | "30d" | "90d" | "custom";

export type SalesRange = {
  mode: SalesRangeMode;
  from: string;
  to: string;
  today: string;
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

export function isValidDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
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

function displayDate(key: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${key}T00:00:00.000Z`));
}

export function resolveSalesRange(
  params: { range?: string; from?: string; to?: string },
  now = new Date(),
): SalesRange {
  const today = sydneyToday(now);
  const mode: SalesRangeMode =
    params.range === "7d" || params.range === "90d" || params.range === "custom"
      ? params.range
      : "30d";
  const daysForMode = mode === "7d" ? 7 : mode === "90d" ? 90 : 30;
  let from = addSalesDays(today, 1 - daysForMode);
  let to = today;
  let chosenMode = mode;

  if (mode === "custom") {
    const start = params.from ?? "";
    const end = params.to ?? "";
    if (
      isValidDateKey(start) &&
      isValidDateKey(end) &&
      start <= end &&
      end <= today &&
      salesDaysInclusive(start, end) <= MAX_SALES_RANGE_DAYS
    ) {
      from = start;
      to = end;
    } else {
      chosenMode = "30d";
    }
  }

  const days = salesDaysInclusive(from, to);
  return {
    mode: chosenMode,
    from,
    to,
    today,
    days,
    label: chosenMode === "custom"
      ? `${displayDate(from)} – ${displayDate(to)}`
      : `Last ${days} days`,
  };
}
