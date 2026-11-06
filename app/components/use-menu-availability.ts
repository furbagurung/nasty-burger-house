"use client";

import { useEffect, useSyncExternalStore } from "react";

// Share the last successful availability snapshot across menu/product routes.
// Each navigation reuses it instantly while a fresh request runs in background.
type AvailabilitySnapshot = {
  soldOutIds: readonly string[];
  checkedAt: number;
  ok: boolean;
};

const EMPTY_IDS: readonly string[] = [];
const FRESH_MS = 10_000;
const POLL_MS = 15_000;
let snapshot: AvailabilitySnapshot | null = null;
let inFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot(): AvailabilitySnapshot | null {
  return null;
}

function emit() {
  listeners.forEach((listener) => listener());
}

function refreshAvailability(force = false): Promise<void> {
  if (inFlight) return inFlight;
  if (!force && snapshot?.ok && Date.now() - snapshot.checkedAt < FRESH_MS) {
    return Promise.resolve();
  }

  inFlight = (async () => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch("/api/menu/availability", {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Menu availability unavailable");

      const data: unknown = await response.json();
      if (
        !data || typeof data !== "object" ||
        !("ok" in data) || data.ok !== true ||
        !("soldOutIds" in data) || !Array.isArray(data.soldOutIds) ||
        !data.soldOutIds.every((id: unknown) => typeof id === "string")
      ) {
        throw new Error("Invalid menu availability response");
      }

      snapshot = { soldOutIds: data.soldOutIds as string[], checkedAt: Date.now(), ok: true };
      emit();
    } catch {
      // Preserve known availability across a brief network outage.
      // Without a prior snapshot, disable add-to-cart until it can be checked.
      if (!snapshot) {
        snapshot = { soldOutIds: EMPTY_IDS, checkedAt: 0, ok: false };
        emit();
      }
    } finally {
      window.clearTimeout(timeout);
    }
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

export function useMenuAvailability() {
  const availability = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    void refreshAvailability();

    const onFocus = () => {
      if (!document.hidden) void refreshAvailability(true);
    };
    const interval = window.setInterval(() => {
      if (!document.hidden) void refreshAvailability(true);
    }, POLL_MS);

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  return {
    soldOutIds: availability?.soldOutIds ?? EMPTY_IDS,
    ready: availability?.ok === true,
  };
}
