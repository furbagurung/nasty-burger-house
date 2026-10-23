"use client";
import { useEffect, useState } from "react";
import { getServiceStatus, type ServiceStatus } from "../lib/service";
import { unavailableShopStatus } from "../lib/shop-control";

export async function fetchServiceStatus(signal?: AbortSignal): Promise<ServiceStatus> {
  const response = await fetch("/api/service-status", { cache: "no-store", signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(8_000)]) : AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error("Shop status unavailable");
  return response.json();
}
export function useServiceStatus(initial?: ServiceStatus) {
  const [status, setStatus] = useState(() => initial ?? unavailableShopStatus(getServiceStatus()));
  const [ready, setReady] = useState(initial !== undefined);
  useEffect(() => {
    let active = true;
    let pending = false;
    const controller = new AbortController();
    const refresh = async () => {
      if (pending) return;
      pending = true;
      try {
        const next = await fetchServiceStatus(controller.signal);
        if (active) setStatus(next);
      } catch { if (active) setStatus((current) => unavailableShopStatus(current)); }
      finally { pending = false; if (active) setReady(true); }
    };
    void refresh();
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(); }, 15_000);
    const onVisible = () => { if (!document.hidden) void refresh(); };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false; controller.abort(); window.clearInterval(interval);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return [status, setStatus, ready] as const;
}
