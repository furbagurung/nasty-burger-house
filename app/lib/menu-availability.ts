import "server-only";

import { getAdminClientOrNull } from "@/app/lib/supabase/admin";
import { menuItems } from "@/app/data/menu";

export type MenuAvailabilityResult = {
  ok: boolean;
  soldOutIds: string[];
  reason?: "setup-required" | "unavailable";
};

/** The same server-only availability source is used by storefront and checkout.
 * Never send Supabase service credentials to customer components. */
export async function readMenuAvailability(): Promise<MenuAvailabilityResult> {
  const admin = getAdminClientOrNull();
  if (!admin) return { ok: false, soldOutIds: [], reason: "setup-required" };

  try {
    const { data, error } = await admin.from("menu_availability").select("item_id,is_sold_out");
    if (error) {
      const missing = error.code === "42P01" || error.code === "PGRST205" || error.code === "PGRST116";
      if (!missing) console.error("[NBH menu availability read failed]", error.code);
      return { ok: false, soldOutIds: [], reason: missing ? "setup-required" : "unavailable" };
    }
    const knownIds = new Set(menuItems.map((item) => item.id));
    return {
      ok: true,
      soldOutIds: (data ?? [])
        .filter((row) => row.is_sold_out === true && knownIds.has(row.item_id))
        .map((row) => row.item_id as string),
    };
  } catch {
    console.error("[NBH menu availability read failed unexpectedly]");
    return { ok: false, soldOutIds: [], reason: "unavailable" };
  }
}

/** A sold-out combo drink or Beast Box component must also be rejected. */
export function findSoldOutOrderItems(
  lines: Array<{ itemId: string; combo: boolean; drink?: string; boxBurgers: string[]; boxDrinks: string[] }>,
  soldOutIds: ReadonlySet<string>,
): string[] {
  const blocked = new Set<string>();
  for (const line of lines) {
    if (soldOutIds.has(line.itemId)) blocked.add(line.itemId);
    if (line.combo && line.drink) {
      const drinkId = line.drink.toLowerCase().replaceAll(" ", "-");
      if (soldOutIds.has(drinkId)) blocked.add(drinkId);
    }
    for (const burgerId of line.boxBurgers) if (soldOutIds.has(burgerId)) blocked.add(burgerId);
    for (const name of line.boxDrinks) {
      const drinkId = name.toLowerCase().replaceAll(" ", "-");
      if (soldOutIds.has(drinkId)) blocked.add(drinkId);
    }
  }
  return [...blocked].map((id) => menuItems.find((item) => item.id === id)?.name ?? id);
}
