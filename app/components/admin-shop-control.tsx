"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock3, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatShopHours, isValidShopHours, type ShopControlMode, type ShopHours } from "../lib/shop-control";
import type { ServiceStatus } from "../lib/service";

type Snapshot = { mode: ShopControlMode; hours: ShopHours; updatedAt: string; status: ServiceStatus };
const choices: { mode: ShopControlMode; label: string; help: string }[] = [
  { mode: "auto", label: "Scheduled", help: "Follow daily hours" },
  { mode: "open", label: "Open manually", help: "Take orders anytime" },
  { mode: "closed", label: "Close manually", help: "Pause new orders" },
];

const shortStatusLabels: Record<string, string> = {
  "Ordering preview active": "Preview active",
  "Open for pickup orders": "Orders open",
  "Ordering paused": "Orders paused",
  "Online ordering closed": "Orders closed",
  "Online ordering closed for today": "Closed today",
  "Ordering temporarily unavailable": "Orders unavailable",
};

function shortStatusLabel(label: string): string {
  const openingPrefix = "Online ordering opens at ";
  if (label.startsWith(openingPrefix)) return `Opens at ${label.slice(openingPrefix.length)}`;
  return shortStatusLabels[label] ?? label;
}

export default function AdminShopControl() {
  const [saved, setSaved] = useState<Snapshot | null>(null);
  const [selected, setSelected] = useState<ShopControlMode>("auto");
  const [hours, setHours] = useState<ShopHours>({ opensAt: "11:30", closesAt: "21:45" });
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
      setSaved(data); setSelected(data.mode); setHours(data.hours); setError("");
    } catch (error) { setError(error instanceof Error ? error.message : "Could not load shop status."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const dirty = !!saved && (selected !== saved.mode || hours.opensAt !== saved.hours.opensAt || hours.closesAt !== saved.hours.closesAt);
  const valid = isValidShopHours(hours);
  async function save() {
    if (busy.current || !saved || !dirty || !valid) return;
    busy.current = true; setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/shop-status", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: selected, hours }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save shop status.");
      setSaved(data); setSelected(data.mode); setHours(data.hours);
      setMessage("Saved. Status updates within 15 seconds.");
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save shop settings."); }
    finally { busy.current = false; setSaving(false); }
  }
  return (
    <section className="admin-shop-control" aria-labelledby="shop-control-title" aria-busy={loading || saving}>
      <div className="admin-shop-control__heading">
        <div><h2 id="shop-control-title"><Store size={20} aria-hidden="true" />Shop status</h2>
          <p>The menu stays available.</p></div>
        <span className="admin-shop-control__status" data-open={saved?.status.acceptingOrders ?? false}>
          {loading ? "Checking…" : saved ? shortStatusLabel(saved.status.statusLabel) : "Unavailable"}
        </span>
      </div>
      <fieldset disabled={loading || saving || !saved}>
        <legend>Ordering mode</legend>
        <div className="admin-shop-control__choices">
          {choices.map(({ mode, label, help }) => (
            <label key={mode} data-selected={selected === mode}>
              <input type="radio" name="shop-control-mode" value={mode} checked={selected === mode}
                onChange={() => { setSelected(mode); setMessage(""); }} />
              <span><strong>{label}</strong><small>{mode === "auto" && saved ? formatShopHours(hours) : help}</small></span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="admin-shop-control__schedule" disabled={loading || saving || !saved}>
        <legend><Clock3 size={18} aria-hidden="true" /> Daily hours</legend>
        <p>Sydney time · daylight saving adjusts automatically.</p>
        <div className="admin-shop-control__time-grid">
          <div><label htmlFor="shop-opens-at">Opens</label>
            <Input id="shop-opens-at" type="time" step={60} value={hours.opensAt}
              aria-invalid={!valid} onChange={(event) => { setHours((current) => ({ ...current, opensAt: event.target.value })); setMessage(""); }} /></div>
          <div><label htmlFor="shop-closes-at">Closes</label>
            <Input id="shop-closes-at" type="time" step={60} value={hours.closesAt}
              aria-invalid={!valid} onChange={(event) => { setHours((current) => ({ ...current, closesAt: event.target.value })); setMessage(""); }} /></div>
        </div>
        {!valid && <p className="admin-shop-control__error" role="alert">Closing time must be later than opening time.</p>}
        {selected !== "auto" && <p className="admin-shop-control__schedule-note">Hours apply in Scheduled mode.</p>}
      </fieldset>
      <p className="admin-shop-control__hint"><Clock3 size={16} aria-hidden="true" />Manual mode stays until changed. Existing orders are unaffected.</p>
      <div className="admin-shop-control__actions">
        <Button type="button" size="lg" disabled={loading || saving || !saved || !dirty || !valid} onClick={() => void save()}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
        {error && <Button type="button" variant="outline" disabled={saving || loading} onClick={() => { setLoading(true); setError(""); void load(); }}>Reload status</Button>}
        {saved && <span>Saved {new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", dateStyle: "medium", timeStyle: "short" }).format(new Date(saved.updatedAt))}</span>}
      </div>
      {error && <p className="admin-shop-control__error" role="alert">{error}</p>}
      <p className="admin-shop-control__feedback" role="status">{message}</p>
    </section>
  );
}
