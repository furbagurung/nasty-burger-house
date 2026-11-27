"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, Clock3, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatShopHours, formatShopClock, formatShopDate, closureReopeningDate, isValidShopHours, isValidShopClosures, type ShopControlMode, type ShopHours, type ShopClosure } from "../lib/shop-control";
import type { ServiceStatus } from "../lib/service";

type Snapshot = { mode: ShopControlMode; hours: ShopHours; closures: ShopClosure[]; today: string; updatedAt: string; status: ServiceStatus };
type Panel = "closure" | "hours" | null;

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
  return (
    <section className="admin-shop-control" aria-labelledby="shop-control-title" aria-busy={loading || saving}>
      <div className="admin-shop-control__heading">
        <div><h2 id="shop-control-title"><Store size={20} aria-hidden="true" />Shop management</h2>
          <p>Manage when customers can place online orders.</p></div>
      </div>
      <div className="admin-shop-control__block">
        <div className="admin-shop-control__heading">
          <div><h2>Current status</h2><p>{saved?.status.notice ?? "Checking availability…"}</p></div>
          <span className="admin-shop-control__status" data-open={saved?.status.acceptingOrders ?? false}>
            {loading ? "Checking…" : saved ? (saved.status.acceptingOrders ? "Open" : saved.status.statusLabel) : "Unavailable"}
          </span>
        </div>
        {manual && <p>Manual override is active. Resume regular hours to enable automatic opening and closing.</p>}
        <div className="admin-shop-control__actions">
          {manual && <Button disabled={disabled} onClick={() => setConfirm("resume")}>Resume regular hours</Button>}
          {!active && <Button disabled={disabled} variant="outline" onClick={() => startClosure()}>Close shop</Button>}
          {active && <Button disabled={disabled} variant="outline" onClick={() => setConfirm(active.id)}>Cancel current closure</Button>}
        </div>
      </div>
      <div className="admin-shop-control__block">
        <div className="admin-shop-control__heading">
          <div><h2><CalendarDays size={18} aria-hidden="true" />Scheduled closures</h2><p>Automatically resume regular trading after your selected dates.</p></div>
          <Button disabled={disabled} variant="outline" onClick={() => startClosure()}>Schedule closure</Button>
        </div>
        {panel === "closure" && saved && <fieldset disabled={saving}>
          <legend>{upcoming.some(item => item.id === draft.id) ? "Edit closure" : "Choose closure dates"}</legend>
          <div className="admin-shop-control__actions">
            <Button type="button" variant="outline" onClick={() => setDraft(d => ({ ...d, start: saved.today, end: saved.today }))}>Today only</Button>
          </div>
          <div className="admin-shop-control__time-grid">
            <div><label htmlFor="closure-start">First closed day</label><Input id="closure-start" type="date" min={saved.today} value={draft.start} onChange={e => { const start = e.target.value; setDraft(d => ({ ...d, start, end: d.end < start ? start : d.end })); }} /></div>
            <div><label htmlFor="closure-end">Last closed day (inclusive)</label><Input id="closure-end" type="date" min={draft.start} value={draft.end} onChange={e => setDraft(d => ({ ...d, end: e.target.value }))} /></div>
          </div>
          <div className="admin-shop-control__field"><label htmlFor="closure-reason">Reason (optional, internal)</label><Input id="closure-reason" maxLength={120} value={draft.reason} onChange={e => setDraft(d => ({ ...d, reason: e.target.value }))} /></div>
          {valid ? <p><strong>Automatically reopens:</strong> {formatShopDate(closureReopeningDate(draft, candidate))}, {formatShopClock(saved.hours.opensAt)} Sydney time.</p> : <p role="alert">Choose valid dates that do not overlap another closure.</p>}
          {manual && <p>Saving will end the current manual override and restore regular trading outside the scheduled dates.</p>}
          <div className="admin-shop-control__actions"><Button disabled={!valid || saving} onClick={() => void save({ mode: "auto", closures: candidate }, "Closure saved.")}>Save closure</Button><Button variant="outline" onClick={() => setPanel(null)}>Cancel</Button></div>
        </fieldset>}
        {upcoming.length === 0 ? <p>No upcoming closures.</p> : <ul className="admin-shop-control__list">{upcoming.map(item => <li key={item.id}>
          <div><strong>{item.reason || (item.start === item.end ? "Day off" : "Scheduled break")}</strong><p>{formatShopDate(item.start)} – {formatShopDate(item.end)}{item === active ? " · Active" : ""}</p><p>Reopens {formatShopDate(closureReopeningDate(item, upcoming))}</p></div>
          <div className="admin-shop-control__actions">{item.start >= (saved?.today ?? "") && <Button disabled={disabled} variant="outline" onClick={() => startClosure(item)}>Edit</Button>}<Button disabled={disabled} variant="outline" onClick={() => { setPanel(null); setConfirm(item.id); }}>Cancel closure</Button></div>
        </li>)}</ul>}
      </div>
      <div className="admin-shop-control__block">
        <div className="admin-shop-control__heading"><div><h2><Clock3 size={18} aria-hidden="true" />Regular trading hours</h2><p>Every day · {saved ? formatShopHours(saved.hours) : "—"} · Sydney time</p></div><Button disabled={disabled} variant="outline" onClick={() => { setHours(saved!.hours); setPanel("hours"); setConfirm(null); }}>Edit hours</Button></div>
        {panel === "hours" && <fieldset disabled={saving}><legend>Edit trading hours</legend><div className="admin-shop-control__time-grid">
          <div><label htmlFor="shop-opens-at">Opens</label><Input id="shop-opens-at" type="time" value={hours.opensAt} onChange={e => setHours(h => ({ ...h, opensAt: e.target.value }))} /></div>
          <div><label htmlFor="shop-closes-at">Closes</label><Input id="shop-closes-at" type="time" value={hours.closesAt} onChange={e => setHours(h => ({ ...h, closesAt: e.target.value }))} /></div>
        </div>{!isValidShopHours(hours) && <p role="alert">Closing time must be later than opening time.</p>}<div className="admin-shop-control__actions"><Button disabled={!isValidShopHours(hours) || saving} onClick={() => void save({ hours }, "Trading hours saved.")}>Save hours</Button><Button variant="outline" onClick={() => setPanel(null)}>Cancel</Button></div></fieldset>}
      </div>
      {confirm && saved && <div className="admin-shop-control__block" role="group" aria-label="Confirm change"><h2>{confirm === "resume" ? "Resume regular hours?" : confirm === "force-open" ? "Open outside trading hours?" : confirm === "force-closed" ? "Close until further notice?" : "Cancel this closure?"}</h2><p>{confirm.startsWith("force-") ? "This override stays active until you resume regular hours." : "Online orders will follow regular hours and any other scheduled closures."}</p><div className="admin-shop-control__actions"><Button disabled={saving} onClick={() => void save(confirm === "resume" ? { mode: "auto" } : confirm === "force-open" ? { mode: "open" } : confirm === "force-closed" ? { mode: "closed" } : { closures: upcoming.filter(item => item.id !== confirm) }, "Shop availability updated.")}>Confirm</Button><Button variant="outline" disabled={saving} onClick={() => setConfirm(null)}>Keep current settings</Button></div></div>}
      <details className="admin-shop-control__block"><summary>More options</summary><p>Manual overrides stay active until you resume regular hours. Use scheduled closures for automatic reopening.</p><div className="admin-shop-control__actions"><Button variant="outline" disabled={disabled || upcoming.length > 0} onClick={() => setConfirm("force-open")}>Open manually</Button><Button variant="outline" disabled={disabled || upcoming.length > 0} onClick={() => setConfirm("force-closed")}>Close until further notice</Button></div>{upcoming.length > 0 && <p>Cancel upcoming closures before using an indefinite override.</p>}</details>
      <p className="admin-shop-control__hint">Existing orders are unaffected. The menu remains available during closures.</p>
      {error && <><p className="admin-shop-control__error" role="alert">{error}</p><Button variant="outline" disabled={saving || loading} onClick={() => { setPanel(null); setConfirm(null); setLoading(true); void load(); }}>Reload status</Button></>}
      <p className="admin-shop-control__feedback" role="status">{saving ? "Saving…" : message}</p>
    </section>
  );
}
