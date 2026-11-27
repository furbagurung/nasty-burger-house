import "server-only";
import { serviceConfiguration } from "../data/service";
import { getAdminClientOrNull } from "./supabase/admin";
import { getServiceStatus } from "./service";
import { applyScheduledClosures, isShopControlMode, isValidShopHours, isValidShopClosures, shopDate, unavailableShopStatus } from "./shop-control";

export async function readShopControl() {
  const admin = getAdminClientOrNull();
  if (!admin) return null;
  try {
    const { data, error } = await admin.from("shop_control").select("mode,opens_at,closes_at,updated_at,closures").eq("id", 1).single();
    if (error || !data || !isShopControlMode(data.mode)) return null;
    const hours = { opensAt: data.opens_at, closesAt: data.closes_at };
    if (!isValidShopHours(hours) || !isValidShopClosures(data.closures)) return null;
    return { mode: data.mode, hours, closures: data.closures, updatedAt: data.updated_at as string };
  } catch { return null; }
}
export function resolveShopStatus(control: Awaited<ReturnType<typeof readShopControl>>, now = new Date()) {
  const scheduled = getServiceStatus(control ? {
    ...serviceConfiguration, orderHours: control.hours,
  } : serviceConfiguration, now);
  return control ? applyScheduledClosures(scheduled, control.mode, control.hours, control.closures, shopDate(now, scheduled.timezone)) : unavailableShopStatus(scheduled);
}

export async function readShopStatus() { return resolveShopStatus(await readShopControl()); }
