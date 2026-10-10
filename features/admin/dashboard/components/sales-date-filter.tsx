"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import {
  MAX_SALES_RANGE_DAYS,
  isValidDateKey,
  salesDaysInclusive,
  type SalesRange,
  type SalesRangeMode,
} from "@/app/lib/admin-sales-range";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SalesDateFilter({ selection }: { selection: SalesRange }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<SalesRangeMode>(selection.mode);
  const [from, setFrom] = useState(selection.from);
  const [to, setTo] = useState(selection.to);
  const [error, setError] = useState("");

  useEffect(() => {
    setMode(selection.mode);
    setFrom(selection.from);
    setTo(selection.to);
    setError("");
  }, [selection.mode, selection.from, selection.to]);

  function changeMode(value: string | null) {
    if (value !== "7d" && value !== "30d" && value !== "90d" && value !== "custom") return;
    setMode(value);
    setError("");
    if (value !== "custom") {
      startTransition(() => router.push(value === "30d" ? "/admin" : `/admin?range=${value}`));
    }
  }

  function applyCustom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidDateKey(from) || !isValidDateKey(to) || from > to) {
      setError("Select a valid start and end date.");
      return;
    }
    if (to > selection.today) {
      setError("End date cannot be in the future.");
      return;
    }
    if (salesDaysInclusive(from, to) > MAX_SALES_RANGE_DAYS) {
      setError("Choose up to 366 days.");
      return;
    }
    setError("");
    startTransition(() =>
      router.push(`/admin?range=custom&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
    );
  }

  return (
    <div className="admin-sales-date-filter" aria-label="Sales date filter">
      <div className="admin-sales-date-select">
        <CalendarDays size={15} aria-hidden="true" />
        <Select value={mode} onValueChange={changeMode} disabled={isPending}>
          <SelectTrigger aria-label="Sales period" className="admin-sales-date-trigger">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mode === "custom" && (
        <form className="admin-sales-custom-range" onSubmit={applyCustom}>
          <div className="admin-sales-date-field">
            <Label htmlFor="sales-date-from">From</Label>
            <Input
              id="sales-date-from"
              type="date"
              value={from}
              max={selection.today}
              onChange={(event) => { setFrom(event.target.value); setError(""); }}
              required
              aria-invalid={Boolean(error)}
            />
          </div>
          <div className="admin-sales-date-field">
            <Label htmlFor="sales-date-to">To</Label>
            <Input
              id="sales-date-to"
              type="date"
              value={to}
              max={selection.today}
              onChange={(event) => { setTo(event.target.value); setError(""); }}
              required
              aria-invalid={Boolean(error)}
            />
          </div>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Loading…" : "Apply"}
          </Button>
          {error && <p className="admin-sales-date-error" role="alert">{error}</p>}
        </form>
      )}
    </div>
  );
}
