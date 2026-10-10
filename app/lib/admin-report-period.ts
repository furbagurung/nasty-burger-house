export type ReportPeriod = "24h" | "7d" | "30d";

export const REPORT_PERIODS: ReadonlyArray<{
  value: ReportPeriod;
  label: string;
}> = [
  { value: "24h", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
];

export function resolveReportPeriod(value?: string): ReportPeriod {
  if (value === "24h" || value === "7d") return value;
  return "30d";
}

export function reportPeriodLabel(value: ReportPeriod) {
  return REPORT_PERIODS.find((period) => period.value === value)?.label ?? "Last 30 Days";
}
