"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, Clock3, Store, Plus, Pencil, CalendarCheck, ChevronLeft, ChevronRight, Play, Ellipsis, CircleAlert, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatShopClock, formatShopDate, nextShopDate, closureReopeningDate, isValidShopHours, isValidShopClosures, type ShopControlMode, type ShopHours, type ShopClosure } from "../lib/shop-control";
import type { ServiceStatus } from "../lib/service";

type Snapshot = { mode: ShopControlMode; hours: ShopHours; closures: ShopClosure[]; today: string; updatedAt: string; status: ServiceStatus };
type Panel = "closure" | "hours" | null;

function ClosureCalendar({ today, closures, disabled, selected, onSelect }: {
  today: string; closures: ShopClosure[]; disabled: boolean; selected: ShopClosure; onSelect: (day: string) => void;
}) {
  const [offset, setOffset] = useState(() => { const [y, m] = selected.start.split("-").map(Number); const [ty, tm] = today.split("-").map(Number); return Math.max(0, (y - ty) * 12 + m - tm); });
  const [year, month] = today.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 1 + offset, 1, 12));
  const days = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0, 12)).getUTCDate();
  const leading = (first.getUTCDay() + 6) % 7;
  const monthLabel = new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric", timeZone: "UTC" }).format(first);
  const prefix = first.toISOString().slice(0, 7);
  return (
    <div className="admin-shop-control__calendar">
      <div className="admin-shop-control__calendar-heading">
        <Button type="button" variant="ghost" size="icon" aria-label="Previous month" disabled={offset <= 0} onClick={() => setOffset(n => n - 1)}><ChevronLeft aria-hidden="true" /></Button>
        <strong aria-live="polite">{monthLabel}</strong>
        <Button type="button" variant="ghost" size="icon" aria-label="Next month" disabled={offset >= 120} onClick={() => setOffset(n => n + 1)}><ChevronRight aria-hidden="true" /></Button>
      </div>
      <div className="admin-shop-control__calendar-grid" role="group" aria-label={monthLabel + " closure dates"}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => <span className="admin-shop-control__calendar-weekday" key={day} aria-hidden="true">{day}</span>)}
        {Array.from({ length: leading }, (_, i) => <span key={"blank-" + i} aria-hidden="true" />)}
        {Array.from({ length: days }, (_, i) => {
          const date = prefix + "-" + String(i + 1).padStart(2, "0");
          const closure = closures.find(item => item.start <= date && item.end >= date);
          const past = date < today;
          return <Button type="button" variant="ghost" key={date} className="admin-shop-control__calendar-day"
            data-closed={!!closure} data-selected={date >= selected.start && date <= selected.end} data-today={date === today} aria-current={date === today ? "date" : undefined}
            aria-label={formatShopDate(date) + (closure ? ", scheduled closure" : ", regular hours") + (past ? ", past" : "")}
            aria-pressed={date >= selected.start && date <= selected.end} disabled={disabled || past || !!closure} onClick={() => onSelect(date)}>{i + 1}</Button>;
        })}
      </div>
      <div className="admin-shop-control__calendar-legend"><span><i data-kind="today" />Today</span><span><i data-kind="closed" />Closure</span></div>
      
    </div>
  );
}

export default function AdminShopControl() {
  const [saved, setSaved] = useState<Snapshot | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [hours, setHours] = useState<ShopHours>({ opensAt: "11:30", closesAt: "21:45" });
  const [draft, setDraft] = useState<ShopClosure>({ id: "", start: "", end: "", reason: "" });
  const [confirm, setConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const busy = useRef(false);
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/shop-status", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load shop status.");
      setSaved(data); setHours(data.hours); setError("");
    } catch (error) { setError(error instanceof Error ? error.message : "Could not load shop status."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    if (panel || saving || confirm) return;
    const timer = window.setInterval(() => { if (!busy.current) void load(); }, 15000);
    return () => window.clearInterval(timer);
  }, [load, panel, saving, confirm]);

  async function save(changes: { mode?: ShopControlMode; hours?: ShopHours; closures?: ShopClosure[] }, feedback: string) {
    if (busy.current || !saved) return;
    busy.current = true; setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/shop-status", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: saved.mode, updatedAt: saved.updatedAt, ...changes }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save shop settings.");
      setSaved(data); setHours(data.hours); setPanel(null); setConfirm(null); setMessage(feedback);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save shop settings."); }
    finally { busy.current = false; setSaving(false); }
  }

  function startClosure(item?: ShopClosure) {
    if (!saved) return;
    setDraft(item ?? { id: crypto.randomUUID(), start: saved.today, end: saved.today, reason: "" });
    setConfirm(null); setPanel("closure"); setError("");
  }
  const disabled = loading || saving || !saved;
  const upcoming = (saved?.closures ?? []).filter(item => item.end >= (saved?.today ?? "")).sort((a, b) => a.start.localeCompare(b.start));
  const active = upcoming.find(item => item.start <= (saved?.today ?? ""));
  const candidate = [...upcoming.filter(item => item.id !== draft.id), draft];
  const valid = isValidShopClosures(candidate) && !!saved && draft.start >= saved.today;
  const manual = saved && saved.mode !== "auto";
  const available = !!saved && !loading && !error && saved.status.statusLabel !== "Ordering temporarily unavailable";
  const isOpen = available && !!saved?.status.acceptingOrders;
  const statusTitle = loading ? "Checking shop status…" : !available ? "Shop status unavailable" : isOpen ? "Shop is open" : "Shop is closed";
  const sydneyClock = new Intl.DateTimeFormat("en-GB", { timeZone: "Australia/Sydney", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
  const withinHours = !!saved && sydneyClock >= saved.hours.opensAt && sydneyClock < saved.hours.closesAt;
  const nextOpeningDay = saved ? (sydneyClock >= saved.hours.closesAt ? nextShopDate(saved.today) : saved.today) : "";
  const nextOpeningClosure = upcoming.find(item => item.start <= nextOpeningDay && item.end >= nextOpeningDay);
  const reopeningDay = nextOpeningClosure ? closureReopeningDate(nextOpeningClosure, upcoming) : nextOpeningDay;
  const toggleDisabled = disabled || !available || !!panel || !!confirm;
  function changeAvailability(checked: boolean) {
    if (!saved || toggleDisabled || checked === isOpen) return;
    if (!checked) {
      setPanel(null);
      setConfirm("close-today");
    } else {
      setPanel(null);
      setConfirm(active ? "reopen-active" : !withinHours && upcoming.length === 0 ? "force-open" : "reopen-now");
    }
  }
  function confirmAvailability() {
    if (!saved || !confirm) return;
    if (confirm === "close-today") {
      if (active) return;
      const closure = { id: crypto.randomUUID(), start: saved.today, end: saved.today, reason: "Closed for today" };
      void save({ mode: "auto", closures: [...upcoming, closure] }, "Shop closed for today.");
    } else if (confirm === "reopen-active" && active) {
      // Explicitly cancel only the active closure; retain future dates.
      void save({ mode: "auto", closures: upcoming.filter(item => item.id !== active.id) }, "Current closure cancelled. Regular hours resumed.");
    } else if (confirm === "reopen-now") {
      // Resume the schedule rather than creating a persistent force-open override.
      void save({ mode: "auto" }, "Regular hours resumed.");
    } else {
      void save(confirm === "resume" ? { mode: "auto" } : confirm === "force-open" ? { mode: "open" } : confirm === "force-closed" ? { mode: "closed" } : { closures: upcoming.filter(item => item.id !== confirm) }, "Shop availability updated.");
    }
  }
  return (
    <section className="admin-shop-control" aria-labelledby="shop-control-title" aria-busy={loading || saving}>
      <header className="admin-shop-control__heading">
        <h2 id="shop-control-title">Shop management</h2>
        <span className="admin-shop-control__timezone"><Clock3 size={16} aria-hidden="true" /> Sydney time</span>
      </header>
      <Card className="admin-shop-control__banner" data-tone={!available ? "unknown" : isOpen ? "open" : "closed"}>
        <div className="admin-shop-control__banner-icon">{isOpen ? <Store size={24} aria-hidden="true" /> : <CircleAlert size={24} aria-hidden="true" />}</div>
        <div className="admin-shop-control__banner-copy" role="status">
          <strong>{statusTitle}</strong>
          {available && !isOpen && <p>{saved.mode === "closed" ? "Closed until reopened" : "Reopens " + (reopeningDay === saved.today ? "today" : formatShopDate(reopeningDay)) + " · " + formatShopClock(saved.hours.opensAt)}</p>}
          {available && manual && <p>Manual control</p>}
        </div>
        <div className="admin-shop-control__switch-wrap">
          <Label htmlFor="shop-availability-switch">{!available ? "Unavailable" : isOpen ? "Open" : "Closed"}</Label>
          <Switch id="shop-availability-switch" aria-label="Online ordering availability" checked={isOpen} disabled={toggleDisabled} onCheckedChange={changeAvailability} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Shop status actions" disabled={toggleDisabled} />}><Ellipsis aria-hidden="true" /></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="admin-shop-control__status-menu">
            {manual && <DropdownMenuItem onClick={() => setConfirm("resume")}><Play aria-hidden="true" />Resume regular hours</DropdownMenuItem>}
            <DropdownMenuItem disabled={upcoming.length > 0 || saved?.mode === "open"} onClick={() => setConfirm("force-open")}>Open manually</DropdownMenuItem>
            <DropdownMenuItem disabled={upcoming.length > 0 || saved?.mode === "closed"} onClick={() => setConfirm("force-closed")}>Close until further notice</DropdownMenuItem>
            {upcoming.length > 0 && <DropdownMenuItem disabled>Planned closures take priority</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
        {manual && <div className="admin-shop-control__status-reset"><Button disabled={toggleDisabled} variant="outline" onClick={() => setConfirm("resume")}><Play size={16} aria-hidden="true" />Resume regular hours</Button></div>}
      </Card>
      {(confirm === "close-today" || confirm === "reopen-active" || confirm === "reopen-now" || confirm === "force-open") && saved && <Card className="admin-shop-control__block admin-shop-control__quick-confirm" role="group" aria-label="Confirm shop status">
        <h2>{confirm === "close-today" ? "Close for today?" : confirm === "reopen-active" ? "End the current closure?" : confirm === "force-open" ? "Open outside opening hours?" : "Resume regular hours?"}</h2>
        <p>{confirm === "close-today" ? "Orders stop today. Any planned closures still apply." : confirm === "reopen-active" ? "This ends all remaining days of this closure." : confirm === "force-open" ? "Stays open until you resume regular hours." : "Opens during regular hours."}</p>
        <div className="admin-shop-control__actions"><Button disabled={saving} onClick={confirmAvailability}>{confirm === "close-today" ? "Close for today" : confirm === "force-open" ? "Open manually" : "Resume regular hours"}</Button><Button disabled={saving} variant="outline" onClick={() => setConfirm(null)}>Cancel</Button></div>
      </Card>}
      <div className="admin-shop-control__overview">
        <Card className="admin-shop-control__tile admin-shop-control__tile--hours">
          <div className="admin-shop-control__tile-heading"><span className="admin-shop-control__icon"><Clock3 size={24} aria-hidden="true" /></span><h3>Opening hours</h3><Button variant="ghost" size="icon" aria-label="Edit opening hours" disabled={disabled} onClick={() => { setHours(saved!.hours); setPanel("hours"); setConfirm(null); }}><Pencil aria-hidden="true" /></Button></div>
          <div className="admin-shop-control__hour-pair">
            <div><Sun size={18} aria-hidden="true" /><span>Opens</span><strong>{saved ? formatShopClock(saved.hours.opensAt) : "—"}</strong></div>
            <div><Moon size={18} aria-hidden="true" /><span>Closes</span><strong>{saved ? formatShopClock(saved.hours.closesAt) : "—"}</strong></div>
          </div>
          <p>Every day</p>
        </Card>
        <Card className="admin-shop-control__tile admin-shop-control__tile--closures">
          <div className="admin-shop-control__tile-heading"><span className="admin-shop-control__icon"><CalendarDays size={24} aria-hidden="true" /></span><h3>Scheduled closures</h3><span className="admin-shop-control__count" aria-label="Planned closures">{saved ? upcoming.length : "—"}</span></div>
          <div className="admin-shop-control__actions"><Button disabled={disabled} onClick={() => startClosure()}><Plus size={18} aria-hidden="true" />Schedule closure</Button></div>
        {upcoming.length === 0 ? <div className="admin-shop-control__empty"><span className="admin-shop-control__empty-icon"><CalendarCheck size={36} strokeWidth={1.5} aria-hidden="true" /></span><strong>{saved ? "No upcoming closures." : "Closures unavailable"}</strong></div> : <ul className="admin-shop-control__list">{upcoming.map(item => <li key={item.id}>
          <div className="admin-shop-control__date" aria-hidden="true"><span>{new Intl.DateTimeFormat("en-AU", { month: "short", timeZone: "UTC" }).format(new Date(item.start + "T12:00:00Z"))}</span><strong>{item.start.slice(8, 10)}</strong></div>
          <div className="admin-shop-control__closure-copy"><strong>{item.reason || (item.start === item.end ? "Day off" : "Scheduled break")}</strong>{item === active && <span className="admin-shop-control__active">Active</span>}<p>{formatShopDate(item.start)}{item.start !== item.end && " – " + formatShopDate(item.end)}</p><p className="admin-shop-control__return"><CalendarCheck size={16} aria-hidden="true" />Reopens {formatShopDate(closureReopeningDate(item, upcoming))}{saved && " · " + formatShopClock(saved.hours.opensAt)}</p></div>
          <div className="admin-shop-control__actions">{item.start >= (saved?.today ?? "") && <Button disabled={disabled} variant="outline" onClick={() => startClosure(item)}><Pencil size={16} aria-hidden="true" />Edit</Button>}<Button disabled={disabled} variant="outline" onClick={() => { setPanel(null); setConfirm(item.id); }}>Cancel closure</Button></div>
        </li>)}</ul>}

        </Card>
      </div>
      <Sheet open={panel === "closure"} onOpenChange={open => { if (!open && !saving) setPanel(null); }}>
        <SheetContent side="right" showCloseButton={!saving} className="admin-shop-control admin-shop-control__sheet">
          <SheetHeader className="admin-shop-control__sheet-header">
            <SheetTitle>{upcoming.some(item => item.id === draft.id) ? "Edit closure" : "Schedule closure"}</SheetTitle>
            <SheetDescription className="sr-only">Choose the first and last closed dates.</SheetDescription>
          </SheetHeader>
          <div className="admin-shop-control__sheet-body">
            {saved && panel === "closure" && <ClosureCalendar key={draft.id} today={saved.today} closures={saved.closures.filter(item => item.id !== draft.id)} selected={draft} disabled={saving} onSelect={day => setDraft(d => ({ ...d, start: day, end: day }))} />}
            {saved && panel === "closure" && <fieldset disabled={saving}>
          <legend className="sr-only">Closure dates</legend>
          <div className="admin-shop-control__actions">
            <Button type="button" variant="outline" onClick={() => setDraft(d => ({ ...d, start: saved.today, end: saved.today }))}>Today only</Button>
          </div>
          <div className="admin-shop-control__time-grid">
            <div><Label htmlFor="closure-start">From</Label><Input id="closure-start" type="date" min={saved.today} value={draft.start} onChange={e => { const start = e.target.value; setDraft(d => ({ ...d, start, end: d.end < start ? start : d.end })); }} /></div>
            <div><Label htmlFor="closure-end">To (included)</Label><Input id="closure-end" type="date" min={draft.start} value={draft.end} onChange={e => setDraft(d => ({ ...d, end: e.target.value }))} /></div>
          </div>
          <div className="admin-shop-control__field"><Label htmlFor="closure-reason">Reason (optional, private)</Label><Input id="closure-reason" maxLength={120} value={draft.reason} onChange={e => setDraft(d => ({ ...d, reason: e.target.value }))} /></div>
          {valid ? <div className="admin-shop-control__reopen"><CalendarCheck size={22} aria-hidden="true" /><div><small>Automatically reopens</small><strong>{formatShopDate(closureReopeningDate(draft, candidate))} · {formatShopClock(saved.hours.opensAt)}</strong></div></div> : <p role="alert">Choose dates that do not overlap.</p>}
          {manual && <p>Saving restores regular hours outside these dates.</p>}
          <div className="admin-shop-control__actions"><Button disabled={!valid || saving} onClick={() => void save({ mode: "auto", closures: candidate }, "Closure saved.")}>Save closure</Button><Button disabled={saving} variant="outline" onClick={() => setPanel(null)}>Cancel</Button></div>
        </fieldset>}
            {error && <p className="admin-shop-control__error" role="alert">{error}</p>}
          </div>
        </SheetContent>
      </Sheet>
      {panel === "hours" && <Card className="admin-shop-control__block">
        <fieldset disabled={saving}><legend>Edit opening hours</legend><div className="admin-shop-control__time-grid">
          <div><Label htmlFor="shop-opens-at">Opens</Label><Input id="shop-opens-at" type="time" value={hours.opensAt} onChange={e => setHours(h => ({ ...h, opensAt: e.target.value }))} /></div>
          <div><Label htmlFor="shop-closes-at">Closes</Label><Input id="shop-closes-at" type="time" value={hours.closesAt} onChange={e => setHours(h => ({ ...h, closesAt: e.target.value }))} /></div>
        </div>{!isValidShopHours(hours) && <p role="alert">Closing time must be after opening.</p>}<div className="admin-shop-control__actions"><Button disabled={!isValidShopHours(hours) || saving} onClick={() => void save({ hours }, "Opening hours saved.")}>Save hours</Button><Button variant="outline" onClick={() => setPanel(null)}>Cancel</Button></div></fieldset>
      </Card>}
      {confirm && !["close-today", "reopen-active", "reopen-now", "force-open"].includes(confirm) && saved && <Card className="admin-shop-control__block" role="group" aria-label="Confirm change"><h2>{confirm === "resume" ? "Resume regular hours?" : confirm === "force-open" ? "Open outside trading hours?" : confirm === "force-closed" ? "Close until further notice?" : "Cancel this closure?"}</h2><p>{confirm.startsWith("force-") ? "Stays active until regular hours resume." : "Returns to regular hours."}</p><div className="admin-shop-control__actions"><Button disabled={saving} onClick={confirmAvailability}>Confirm</Button><Button variant="outline" disabled={saving} onClick={() => setConfirm(null)}>Cancel</Button></div></Card>}
      {error && panel !== "closure" && <><p className="admin-shop-control__error" role="alert"><CircleAlert size={16} aria-hidden="true" />{error}</p><Button variant="outline" disabled={saving || loading} onClick={() => { setPanel(null); setConfirm(null); setLoading(true); void load(); }}>Reload status</Button></>}
      <p className="admin-shop-control__feedback" role="status">{saving ? "Saving…" : message}</p>
    </section>
  );
}
