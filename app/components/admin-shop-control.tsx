"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, Clock3, Store, Plus, Pencil, CalendarCheck, ChevronLeft, ChevronRight, PauseCircle, Play, Settings2, ShieldCheck, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatShopClock, formatShopDate, closureReopeningDate, isValidShopHours, isValidShopClosures, type ShopControlMode, type ShopHours, type ShopClosure } from "../lib/shop-control";
import type { ServiceStatus } from "../lib/service";

type Snapshot = { mode: ShopControlMode; hours: ShopHours; closures: ShopClosure[]; today: string; updatedAt: string; status: ServiceStatus };
type Panel = "closure" | "hours" | null;

function ClosureCalendar({ today, closures, disabled, onSelect }: {
  today: string; closures: ShopClosure[]; disabled: boolean; onSelect: (day: string) => void;
}) {
  const [offset, setOffset] = useState(0);
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
            data-closed={!!closure} data-today={date === today} aria-current={date === today ? "date" : undefined}
            aria-label={formatShopDate(date) + (closure ? ", scheduled closure" : ", regular hours") + (past ? ", past" : "")}
            disabled={disabled || past || !!closure} onClick={() => onSelect(date)}>{i + 1}</Button>;
        })}
      </div>
      <div className="admin-shop-control__calendar-legend"><span><i data-kind="today" />Today</span><span><i data-kind="closed" />Closure</span></div>
      <p>Select a date to schedule a closure.</p>
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
        <div><h2 id="shop-control-title">Shop management</h2><p>Online ordering availability</p></div>
        <span className="admin-shop-control__timezone"><Clock3 size={16} aria-hidden="true" /> Sydney time</span>
      </header>
      <div className="admin-shop-control__banner" data-tone={!available ? "unknown" : isOpen ? "open" : "closed"}>
        <div className="admin-shop-control__banner-icon">{isOpen ? <Store size={24} aria-hidden="true" /> : <CircleAlert size={24} aria-hidden="true" />}</div>
        <div className="admin-shop-control__banner-copy" role="status">
          <strong>{statusTitle}</strong>
          <p>{available ? saved?.status.notice : "Checking online ordering availability."}</p>
        </div>
        <div className="admin-shop-control__switch-wrap">
          <Label htmlFor="shop-availability-switch">{isOpen ? "Open" : "Closed"}</Label>
          <Switch id="shop-availability-switch" aria-label="Online ordering availability" checked={isOpen} disabled={toggleDisabled} onCheckedChange={changeAvailability} />
        </div>
      </div>
      {(confirm === "close-today" || confirm === "reopen-active" || confirm === "reopen-now" || confirm === "force-open") && saved && <Card className="admin-shop-control__block admin-shop-control__quick-confirm" role="group" aria-label="Confirm shop status">
        <h2>{confirm === "close-today" ? "Close for today?" : confirm === "reopen-active" ? "End the current closure?" : confirm === "force-open" ? "Open outside trading hours?" : "Resume regular hours?"}</h2>
        <p>{confirm === "close-today" ? "New online orders stop now. Regular trading resumes after today and any consecutive scheduled closures." : confirm === "reopen-active" ? "This cancels the active closure, including any remaining days in it. Future closures stay scheduled." : confirm === "force-open" ? "Online orders will open now and stay open until you resume regular hours." : "The shop follows its regular hours. Outside trading hours it stays closed; use Open manually in More options if needed."}</p>
        <div className="admin-shop-control__actions"><Button disabled={saving} onClick={confirmAvailability}>{confirm === "close-today" ? "Close for today" : confirm === "force-open" ? "Open manually" : "Resume regular hours"}</Button><Button disabled={saving} variant="outline" onClick={() => setConfirm(null)}>Cancel</Button></div>
      </Card>}
      <div className="admin-shop-control__overview">
        <Card className="admin-shop-control__tile admin-shop-control__tile--status">
          <div className="admin-shop-control__tile-heading"><span className="admin-shop-control__icon" data-tone={saved?.status.acceptingOrders ? "open" : "neutral"}><Store size={24} aria-hidden="true" /></span><h3>Current status</h3></div>
          <div className="admin-shop-control__metric" role="status">{loading ? "Checking…" : !saved || saved.status.statusLabel === "Ordering temporarily unavailable" ? "Unavailable" : saved.status.acceptingOrders ? "Open now" : "Closed now"}</div>
          <Badge variant="outline" className="admin-shop-control__status" data-open={saved?.status.acceptingOrders ?? false}><span aria-hidden="true" />{manual ? "Manual override" : active ? "Scheduled break" : saved ? "Regular schedule" : "Checking status"}</Badge>
          <p>{saved?.status.notice ?? "Checking availability…"}</p>
          {manual && <p>Resume regular hours to end the manual override.</p>}
          <div className="admin-shop-control__actions">
            {manual && <Button disabled={disabled} onClick={() => setConfirm("resume")}><Play size={16} aria-hidden="true" />Resume regular hours</Button>}
            {!active && <Button disabled={disabled} variant="outline" onClick={() => startClosure()}><PauseCircle size={18} aria-hidden="true" />Close shop</Button>}
            {active && <Button disabled={disabled} variant="outline" onClick={() => setConfirm(active.id)}>Cancel current closure</Button>}
          </div>
        </Card>
        <Card className="admin-shop-control__tile">
          <div className="admin-shop-control__tile-heading"><span className="admin-shop-control__icon"><CalendarDays size={24} aria-hidden="true" /></span><h3>Scheduled closures</h3></div>
          <div className="admin-shop-control__metric">{saved ? upcoming.length : "—"} <span>planned</span></div>
          <p>{upcoming.length ? "Next: " + formatShopDate(upcoming[0].start) : saved ? "No upcoming closures" : "Checking dates…"}</p>
          <div className="admin-shop-control__actions"><Button disabled={disabled} onClick={() => startClosure()}><Plus size={18} aria-hidden="true" />Schedule closure</Button></div>
        </Card>
        <Card className="admin-shop-control__tile">
          <div className="admin-shop-control__tile-heading"><span className="admin-shop-control__icon"><Clock3 size={24} aria-hidden="true" /></span><h3>Regular trading hours</h3></div>
          <div className="admin-shop-control__hours-range">{saved ? formatShopClock(saved.hours.opensAt) + " – " + formatShopClock(saved.hours.closesAt) : "—"}</div>
          <p>Every day</p>
          <div className="admin-shop-control__actions"><Button disabled={disabled} variant="outline" onClick={() => { setHours(saved!.hours); setPanel("hours"); setConfirm(null); }}><Pencil size={16} aria-hidden="true" />Edit hours</Button></div>
        </Card>
      </div>
      <Card className="admin-shop-control__block">
        <div className="admin-shop-control__heading"><div><h2><CalendarDays size={20} aria-hidden="true" />Closure calendar</h2><p>Regular hours resume automatically after each break.</p></div></div>
        {saved && <ClosureCalendar key={saved.today.slice(0, 7)} today={saved.today} closures={saved.closures} disabled={disabled || panel === "closure" || !!confirm} onSelect={day => { startClosure(); setDraft(d => ({ ...d, start: day, end: day })); }} />}
        {panel === "closure" && saved && <fieldset disabled={saving}>
          <legend>{upcoming.some(item => item.id === draft.id) ? "Edit closure" : "Choose closure dates"}</legend>
          <div className="admin-shop-control__actions">
            <Button type="button" variant="outline" onClick={() => setDraft(d => ({ ...d, start: saved.today, end: saved.today }))}>Today only</Button>
          </div>
          <div className="admin-shop-control__time-grid">
            <div><Label htmlFor="closure-start">First closed day</Label><Input id="closure-start" type="date" min={saved.today} value={draft.start} onChange={e => { const start = e.target.value; setDraft(d => ({ ...d, start, end: d.end < start ? start : d.end })); }} /></div>
            <div><Label htmlFor="closure-end">Last closed day (inclusive)</Label><Input id="closure-end" type="date" min={draft.start} value={draft.end} onChange={e => setDraft(d => ({ ...d, end: e.target.value }))} /></div>
          </div>
          <div className="admin-shop-control__field"><Label htmlFor="closure-reason">Reason (optional, internal)</Label><Input id="closure-reason" maxLength={120} value={draft.reason} onChange={e => setDraft(d => ({ ...d, reason: e.target.value }))} /></div>
          {valid ? <div className="admin-shop-control__reopen"><CalendarCheck size={22} aria-hidden="true" /><div><small>Automatically reopens</small><strong>{formatShopDate(closureReopeningDate(draft, candidate))} · {formatShopClock(saved.hours.opensAt)}</strong></div></div> : <p role="alert">Choose valid dates that do not overlap another closure.</p>}
          {manual && <p>Saving will end the current manual override and restore regular trading outside the scheduled dates.</p>}
          <div className="admin-shop-control__actions"><Button disabled={!valid || saving} onClick={() => void save({ mode: "auto", closures: candidate }, "Closure saved.")}>Save closure</Button><Button variant="outline" onClick={() => setPanel(null)}>Cancel</Button></div>
        </fieldset>}
        {upcoming.length === 0 ? <div className="admin-shop-control__empty"><span className="admin-shop-control__empty-icon"><CalendarCheck size={36} strokeWidth={1.5} aria-hidden="true" /></span><strong>{saved ? "No upcoming closures." : "Closure calendar unavailable"}</strong><p>{saved ? "Regular hours apply." : "Load shop status to view closures."}</p><Button disabled={disabled} variant="outline" onClick={() => startClosure()}><Plus size={16} aria-hidden="true" />Add a closure</Button></div> : <ul className="admin-shop-control__list">{upcoming.map(item => <li key={item.id}>
          <div className="admin-shop-control__date" aria-hidden="true"><span>{new Intl.DateTimeFormat("en-AU", { month: "short", timeZone: "UTC" }).format(new Date(item.start + "T12:00:00Z"))}</span><strong>{item.start.slice(8, 10)}</strong></div>
          <div className="admin-shop-control__closure-copy"><strong>{item.reason || (item.start === item.end ? "Day off" : "Scheduled break")}</strong>{item === active && <span className="admin-shop-control__active">Active</span>}<p>{formatShopDate(item.start)}{item.start !== item.end && " – " + formatShopDate(item.end)}</p><p className="admin-shop-control__return"><CalendarCheck size={16} aria-hidden="true" />Reopens {formatShopDate(closureReopeningDate(item, upcoming))}{saved && " · " + formatShopClock(saved.hours.opensAt)}</p></div>
          <div className="admin-shop-control__actions">{item.start >= (saved?.today ?? "") && <Button disabled={disabled} variant="outline" onClick={() => startClosure(item)}><Pencil size={16} aria-hidden="true" />Edit</Button>}<Button disabled={disabled} variant="outline" onClick={() => { setPanel(null); setConfirm(item.id); }}>Cancel closure</Button></div>
        </li>)}</ul>}
      </Card>
      {panel === "hours" && <Card className="admin-shop-control__block">
        <fieldset disabled={saving}><legend>Edit trading hours</legend><div className="admin-shop-control__time-grid">
          <div><Label htmlFor="shop-opens-at">Opens</Label><Input id="shop-opens-at" type="time" value={hours.opensAt} onChange={e => setHours(h => ({ ...h, opensAt: e.target.value }))} /></div>
          <div><Label htmlFor="shop-closes-at">Closes</Label><Input id="shop-closes-at" type="time" value={hours.closesAt} onChange={e => setHours(h => ({ ...h, closesAt: e.target.value }))} /></div>
        </div>{!isValidShopHours(hours) && <p role="alert">Closing time must be later than opening time.</p>}<div className="admin-shop-control__actions"><Button disabled={!isValidShopHours(hours) || saving} onClick={() => void save({ hours }, "Trading hours saved.")}>Save hours</Button><Button variant="outline" onClick={() => setPanel(null)}>Cancel</Button></div></fieldset>
      </Card>}
      {confirm && !["close-today", "reopen-active", "reopen-now", "force-open"].includes(confirm) && saved && <Card className="admin-shop-control__block" role="group" aria-label="Confirm change"><h2>{confirm === "resume" ? "Resume regular hours?" : confirm === "force-open" ? "Open outside trading hours?" : confirm === "force-closed" ? "Close until further notice?" : "Cancel this closure?"}</h2><p>{confirm.startsWith("force-") ? "This override stays active until you resume regular hours." : "Online orders will follow regular hours and any other scheduled closures."}</p><div className="admin-shop-control__actions"><Button disabled={saving} onClick={confirmAvailability}>Confirm</Button><Button variant="outline" disabled={saving} onClick={() => setConfirm(null)}>Keep current settings</Button></div></Card>}
      <details className="admin-shop-control__block"><summary><Settings2 size={18} aria-hidden="true" />More options</summary><p>Manual overrides stay active until you resume regular hours. Use scheduled closures for automatic reopening.</p><div className="admin-shop-control__actions"><Button variant="outline" disabled={disabled || upcoming.length > 0} onClick={() => setConfirm("force-open")}>Open manually</Button><Button variant="outline" disabled={disabled || upcoming.length > 0} onClick={() => setConfirm("force-closed")}>Close until further notice</Button></div>{upcoming.length > 0 && <p>Cancel upcoming closures before using an indefinite override.</p>}</details>
      <p className="admin-shop-control__hint"><ShieldCheck size={18} aria-hidden="true" />Existing orders are unaffected. The menu remains available during closures.</p>
      {error && <><p className="admin-shop-control__error" role="alert"><CircleAlert size={16} aria-hidden="true" />{error}</p><Button variant="outline" disabled={saving || loading} onClick={() => { setPanel(null); setConfirm(null); setLoading(true); void load(); }}>Reload status</Button></>}
      <p className="admin-shop-control__feedback" role="status">{saving ? "Saving…" : message}</p>
    </section>
  );
}
