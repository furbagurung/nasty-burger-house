"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CalendarDays } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  REPORT_PERIODS,
  reportPeriodLabel,
  type ReportPeriod,
} from "@/app/lib/admin-report-period";

export function AdminPeriodFilter({
  period,
  pathname,
}: {
  period: ReportPeriod;
  pathname: "/admin" | "/admin/analytics";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choosePeriod(value: string | null) {
    if (value !== "24h" && value !== "7d" && value !== "30d") return;
    if (value === period) return;
    const path = value === "30d" ? pathname : `${pathname}?range=${value}`;
    startTransition(() => router.push(path));
  }

  return (
    <div className="admin-report-period" role="group" aria-label="Report date range">
      <CalendarDays size={15} aria-hidden="true" />
      <Select value={period} onValueChange={choosePeriod} disabled={pending}>
        <SelectTrigger className="admin-report-period-trigger" aria-label="Report date range">
          <SelectValue>{reportPeriodLabel(period)}</SelectValue>
        </SelectTrigger>
        <SelectContent
          side="bottom"
          sideOffset={8}
          align="end"
          alignItemWithTrigger={false}
          className="admin-report-period-options"
        >
          {REPORT_PERIODS.map(({ value, label }) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
