export type ReportPeriod = "24h" | "7d" | "30d" | "3m" | "1y" | "custom";

export const REPORT_PERIODS: ReadonlyArray<{
  value: ReportPeriod;
  label: string;
}> = [
  { value: "24h", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "3m", label: "Last 3 Months" },
  { value: "1y", label: "Last 1 Year" },
  { value: "custom", label: "Custom (1–30 Days)" },
];

export function resolveReportPeriod(value?: string): ReportPeriod {
  if (value === "24h" || value === "7d" || value === "3m" ||
      value === "1y" || value === "custom") return value;
  return "30d";
}

/** Invalid query values never create an unbounded reporting query. */
export function resolveCustomDays(value?: string) {
  if (!value || !/^\d{1,2}$/.test(value)) return 14;
  const days = Number(value);
  return Number.isSafeInteger(days) && days >= 1 && days <= 30 ? days : 14;
}

export function reportPeriodLabel(value: ReportPeriod, customDays = 14) {
  if (value === "custom") {
    return `Last ${customDays} ${customDays === 1 ? "Day" : "Days"}`;
  }
  return REPORT_PERIODS.find((period) => period.value === value)?.label ?? "Last 30 Days";
}
