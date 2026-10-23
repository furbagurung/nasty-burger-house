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
