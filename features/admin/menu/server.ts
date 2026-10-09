import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { menuItems } from "@/app/data/menu";
import {
  defaultMenuDraft,
  type AdminMenuProduct,
  type MenuDraftValues,
  type MenuStorageStatus,
} from "@/features/admin/menu/types";

type MenuRow = {
  item_id: string;
  name: string;
  description: string;
  price_cents: number;
  image_path: string | null;
  featured: boolean;
  is_available: boolean;
  version: number;
  updated_at: string;
  updated_by: string | null;
};

const columns = "item_id,name,description,price_cents,image_path,featured,is_available,version,updated_at,updated_by";

export function menuRowValues(row: MenuRow): MenuDraftValues {
  return {
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
    imagePath: row.image_path,
    featured: row.featured,
    available: row.is_available,
  };
}

export function menuRowProduct(row: MenuRow): AdminMenuProduct {
  const item = menuItems.find((candidate) => candidate.id === row.item_id);
  if (!item) throw new Error("Unknown catalogue item.");
  return {
    item,
    values: menuRowValues(row),
    version: row.version,
    updatedAt: row.updated_at,
    editedBy: row.updated_by,
  };
}

export async function loadMenuManagement(admin: SupabaseClient): Promise<{
  products: AdminMenuProduct[];
  storage: MenuStorageStatus;
}> {
  const result = await admin.from("menu_item_drafts").select(columns);
  const storage: MenuStorageStatus = result.error
    ? ["42P01", "PGRST205"].includes(result.error.code ?? "")
      ? "setup-required"
      : "error"
    : "ready";

  if (result.error && storage === "error") {
    console.error("[NBH admin menu drafts unavailable]", result.error.code);
  }

  const rows = (result.data ?? []) as MenuRow[];
  const drafts = new Map(rows.map((row) => [row.item_id, row]));

  return {
    storage,
    products: menuItems.map((item) => {
      const draft = drafts.get(item.id);
      return draft
        ? menuRowProduct(draft)
        : {
            item,
            values: defaultMenuDraft(item),
            version: 0,
            updatedAt: null,
            editedBy: null,
          };
    }),
  };
}

export async function saveMenuDraft(
  admin: SupabaseClient,
  itemId: string,
  userId: string,
  values: MenuDraftValues,
  expectedVersion: number,
): Promise<
  | { ok: true; product: AdminMenuProduct }
  | { ok: false; reason: "conflict" | "unavailable" }
> {
  const draft = {
    name: values.name,
    description: values.description,
    price_cents: values.priceCents,
    image_path: values.imagePath,
    featured: values.featured,
    is_available: values.available,
    updated_by: userId,
    updated_at: new Date().toISOString(),
    version: expectedVersion + 1,
  };

  if (expectedVersion === 0) {
    const result = await admin
      .from("menu_item_drafts")
      .insert({ item_id: itemId, ...draft })
      .select(columns)
      .single();

    if (result.error) {
      if (result.error.code === "23505") return { ok: false, reason: "conflict" };
      console.error("[NBH menu draft insert failed]", result.error.code);
      return { ok: false, reason: "unavailable" };
    }

    return { ok: true, product: menuRowProduct(result.data as MenuRow) };
  }

  const result = await admin
    .from("menu_item_drafts")
    .update(draft)
    .eq("item_id", itemId)
    .eq("version", expectedVersion)
    .select(columns)
    .maybeSingle();

  if (result.error) {
    console.error("[NBH menu draft update failed]", result.error.code);
    return { ok: false, reason: "unavailable" };
  }
  if (!result.data) return { ok: false, reason: "conflict" };
  return { ok: true, product: menuRowProduct(result.data as MenuRow) };
}
