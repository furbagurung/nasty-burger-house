import type { ServiceStatus } from "./service";

export type ShopControlMode = "auto" | "open" | "closed";
export function isShopControlMode(value: unknown): value is ShopControlMode {
  return value === "auto" || value === "open" || value === "closed";
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
