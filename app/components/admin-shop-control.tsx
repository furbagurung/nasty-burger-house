"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock3, Store } from "lucide-react";
import type { ShopControlMode } from "../lib/shop-control";
import type { ServiceStatus } from "../lib/service";

type Snapshot = { mode: ShopControlMode; updatedAt: string; status: ServiceStatus };
const choices: { mode: ShopControlMode; label: string; help: string }[] = [
  { mode: "auto", label: "Scheduled hours", help: "11:00 AM–9:45 PM, Sydney" },
  { mode: "open", label: "Open manually", help: "Accept orders outside scheduled hours" },
  { mode: "closed", label: "Close manually", help: "Pause new online orders" },
];

export default function AdminShopControl() {
  const [saved, setSaved] = useState<Snapshot | null>(null);
  const [selected, setSelected] = useState<ShopControlMode>("auto");
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
      setSaved(data); setSelected(data.mode);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not load shop status."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function save() {
    if (busy.current || !saved || selected === saved.mode) return;
    busy.current = true; setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/shop-status", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: selected }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save shop status.");
      setSaved(data); setSelected(data.mode); setMessage("Shop status saved. Website updates within 15 seconds.");
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save shop status."); }
    finally { busy.current = false; setSaving(false); }
  }

  return (
    <section className="admin-shop-control" aria-labelledby="shop-control-title" aria-busy={loading || saving}>
      <div className="admin-shop-control__heading">
        <div><h2 id="shop-control-title"><Store size={20} aria-hidden="true" />Shop status</h2>
          <p>Control online ordering. Customers can always browse the menu.</p></div>
        <span className="admin-shop-control__status" data-open={saved?.status.acceptingOrders ?? false}>
          {loading ? "Checking status…" : saved ? saved.status.statusLabel : "Status unavailable"}
        </span>
      </div>
      <fieldset disabled={loading || saving || !saved}>
        <legend>Ordering mode</legend>
        <div className="admin-shop-control__choices">
          {choices.map(({ mode, label, help }) => (
            <label key={mode} data-selected={selected === mode}>
              <input type="radio" name="shop-control-mode" value={mode} checked={selected === mode}
                onChange={() => { setSelected(mode); setMessage(""); }} />
              <span><strong>{label}</strong><small>{help}</small></span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="admin-shop-control__hint"><Clock3 size={16} aria-hidden="true" />Manual mode stays active until you change it. Existing orders are unaffected.</p>
      <div className="admin-shop-control__actions">
        <button type="button" disabled={loading || saving || !saved || selected === saved.mode} onClick={() => void save()}>
          {saving ? "Saving…" : "Save shop status"}
        </button>
        {error && <button type="button" className="admin-shop-control__retry" disabled={saving || loading} onClick={() => { setLoading(true); setError(""); void load(); }}>Reload status</button>}
        {saved && <span>Last saved {new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", dateStyle: "medium", timeStyle: "short" }).format(new Date(saved.updatedAt))} (Sydney)</span>}
      </div>
      {error && <p className="admin-shop-control__error" role="alert">{error}</p>}
      <p className="admin-shop-control__feedback" role="status">{message}</p>
    </section>
  );
}
