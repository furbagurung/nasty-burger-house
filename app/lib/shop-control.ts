import type { ServiceStatus } from "./service";

export type ShopControlMode = "auto" | "open" | "closed";
export type ShopHours = { opensAt: string; closesAt: string };

export function isShopControlMode(value: unknown): value is ShopControlMode {
  return value === "auto" || value === "open" || value === "closed";
}
export function isValidShopHours(value: unknown): value is ShopHours {
  if (!value || typeof value !== "object") return false;
  const hours = value as Record<string, unknown>;
  const validClock = (clock: unknown) => typeof clock === "string" && /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(clock);
  return validClock(hours.opensAt) && validClock(hours.closesAt) && (hours.opensAt as string) < (hours.closesAt as string);
}
export function formatShopClock(value: string): string {
  const [hour, minute] = value.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}
export function formatShopHours(hours: ShopHours): string {
  return `${formatShopClock(hours.opensAt)}–${formatShopClock(hours.closesAt)}`;
}
export function applyShopControl(status: ServiceStatus, mode: ShopControlMode): ServiceStatus {
  if (mode === "auto") return status;
  const open = mode === "open";
  return {
    ...status, mode, acceptingOrders: open, statusTone: open ? "open" : "closed",
    statusLabel: open ? "Open for pickup orders" : "Online ordering closed",
    notice: open ? "Pickup ordering is open. Preparation time may change during busy periods."
      : "Online ordering is closed right now. You can still browse the menu. Please check back later.",
  };
}
export function unavailableShopStatus(status: ServiceStatus): ServiceStatus {
  return { ...status, acceptingOrders: false, statusTone: "closed", statusLabel: "Ordering temporarily unavailable",
    notice: "We cannot confirm online ordering availability right now. Please try again shortly." };
}


export type ShopClosure = { id: string; start: string; end: string; reason: string };
export function shopDate(now = new Date(), timezone = "Australia/Sydney"): string {
  const parts = new Intl.DateTimeFormat("en-AU", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (name: string) => parts.find(p => p.type === name)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function nextShopDate(date: string): string {
  const value = new Date(date + "T12:00:00Z");
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}
export function formatShopDate(date: string): string {
  return new Intl.DateTimeFormat("en-AU", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(new Date(date + "T12:00:00Z"));
}
export function isShopDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("9999-")) return false;
  const date = new Date(value + "T12:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function isValidShopClosures(value: unknown): value is ShopClosure[] {
  if (!Array.isArray(value) || value.length > 100) return false;
  const ids = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== "object" || typeof item.id !== "string" || !/^[a-zA-Z0-9-]{1,64}$/.test(item.id) || ids.has(item.id) ||
        !isShopDate(item.start) || !isShopDate(item.end) || item.end < item.start ||
        typeof item.reason !== "string" || item.reason.length > 120) return false;
    ids.add(item.id);
  }
  const sorted = [...value].sort((a, b) => a.start.localeCompare(b.start));
  return sorted.every((item, index) => index === 0 || sorted[index - 1].end < item.start);
}
export function closureReopeningDate(closure: ShopClosure, closures: ShopClosure[]): string {
  let next = nextShopDate(closure.end);
  for (const item of [...closures].sort((a, b) => a.start.localeCompare(b.start))) {
    if (item.start <= next && item.end >= next) next = nextShopDate(item.end);
  }
  return next;
}
export function applyScheduledClosures(status: ServiceStatus, mode: ShopControlMode, hours: ShopHours, closures: ShopClosure[], today: string): ServiceStatus {
  if (mode === "closed") return applyShopControl(status, mode);
  const active = closures.find(item => item.start <= today && item.end >= today);
  if (!active) return applyShopControl(status, mode);
  const date = formatShopDate(closureReopeningDate(active, closures));
  return { ...applyShopControl(status, "closed"), statusLabel: "Closed for scheduled break",
    notice: `Online ordering is closed. Regular trading resumes on ${date} at ${formatShopClock(hours.opensAt)} Sydney time.` };
}
