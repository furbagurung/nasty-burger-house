import "server-only";
import { serviceConfiguration } from "../data/service";
import { getAdminClientOrNull } from "./supabase/admin";
import { getServiceStatus } from "./service";
import { applyShopControl, isShopControlMode, isValidShopHours, unavailableShopStatus } from "./shop-control";

export async function readShopControl() {
  const admin = getAdminClientOrNull();
  if (!admin) return null;
  try {
    const { data, error } = await admin.from("shop_control").select("mode,opens_at,closes_at,updated_at").eq("id", 1).single();
    if (error || !data || !isShopControlMode(data.mode)) return null;
    const hours = { opensAt: data.opens_at, closesAt: data.closes_at };
    if (!isValidShopHours(hours)) return null;
    return { mode: data.mode, hours, updatedAt: data.updated_at as string };
  } catch { return null; }
}
export async function readShopStatus() {
  const control = await readShopControl();
  const scheduled = getServiceStatus(control ? {
    ...serviceConfiguration, orderHours: control.hours,
  } : serviceConfiguration);
  return control ? applyShopControl(scheduled, control.mode) : unavailableShopStatus(scheduled);
}
