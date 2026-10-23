import "server-only";
import { getAdminClientOrNull } from "./supabase/admin";
import { getServiceStatus } from "./service";
import { applyShopControl, isShopControlMode, unavailableShopStatus } from "./shop-control";

export async function readShopControl() {
  const admin = getAdminClientOrNull();
  if (!admin) return null;
  try {
    const { data, error } = await admin.from("shop_control").select("mode,updated_at").eq("id", 1).single();
    if (error || !data || !isShopControlMode(data.mode)) return null;
    return { mode: data.mode, updatedAt: data.updated_at as string };
  } catch { return null; }
}
export async function readShopStatus() {
  const control = await readShopControl();
  const scheduled = getServiceStatus();
  return control ? applyShopControl(scheduled, control.mode) : unavailableShopStatus(scheduled);
}
