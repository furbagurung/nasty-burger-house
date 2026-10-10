"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CalendarDays } from "lucide-react";
import type { SalesRange } from "@/app/lib/admin-sales-range";
import { REPORT_PERIODS, type ReportPeriod } from "@/app/lib/admin-report-period";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export function AdminPeriodFilter({
  selection,
  pathname,
}: {
  selection: SalesRange;
  pathname: "/admin" | "/admin/analytics";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [days, setDays] = useState(String(selection.mode === "custom" ? selection.days : 14));
  const validDays = /^\d{1,2}$/.test(days) && Number(days) >= 1 && Number(days) <= 30;

  useEffect(() => {
    if (selection.mode === "custom") setDays(String(selection.days));
  }, [selection.mode, selection.days]);

  function choosePeriod(value: string | null) {
    if (!REPORT_PERIODS.some((option) => option.value === value)) return;
    if (value === selection.mode) return;
    const chosen = value as ReportPeriod;
    const path = chosen === "30d" ? pathname :
      chosen === "custom" ? `${pathname}?range=custom&days=${validDays ? days : 14}` :
      `${pathname}?range=${chosen}`;
    startTransition(() => router.push(path));
  }

  function applyCustomDays() {
    if (!validDays || pending) return;
    startTransition(() => {
      router.push(`${pathname}?range=custom&days=${Number(days)}`);
    });
  }

  return (
    <div className="admin-report-filter-stack" aria-label="Report date range controls">
      <div className="admin-report-period" role="group" aria-label="Report date range">
        <CalendarDays size={15} aria-hidden="true" />
        <Select value={selection.mode} onValueChange={choosePeriod} disabled={pending}>
          <SelectTrigger className="admin-report-period-trigger" aria-label="Report date range">
            <SelectValue>{selection.label}</SelectValue>
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
      {selection.mode === "custom" && (
        <form className="admin-report-custom-days" onSubmit={(event) => {
          event.preventDefault();
          applyCustomDays();
        }}>
          <Label htmlFor={`report-custom-days-${pathname === "/admin" ? "sales" : "traffic"}`}>Days</Label>
          <Input
            id={`report-custom-days-${pathname === "/admin" ? "sales" : "traffic"}`}
            type="number"
            min={1}
            max={30}
            step={1}
            inputMode="numeric"
            aria-label="Last number of days (1 to 30)"
            value={days}
            onChange={(event) => setDays(event.target.value)}
          />
          <Button type="submit" variant="outline" disabled={!validDays || pending}>Apply</Button>
        </form>
      )}
    </div>
  );
}
