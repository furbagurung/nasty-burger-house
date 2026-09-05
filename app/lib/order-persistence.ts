import "server-only";

import { menuItems } from "../data/menu";
import type { createOrderDispatchPayload } from "./order-dispatch";
import { getAdminClientOrNull } from "./supabase/admin";

type OrderPayload = ReturnType<typeof createOrderDispatchPayload>;

export type OrderPersistenceResult =
  | { ok: true; mode: "supabase"; existing: boolean }
  | { ok: false; reason: "not-configured" | "write-failed"; detail?: string };

function cents(value: number) {
  return Math.round((value + Number.EPSILON) * 100);
}

function lineDetails(line: OrderPayload["lines"][number]) {
  const details: string[] = [];

  if (line.combo.selected) {
    details.push(`Beast Combo${line.combo.drink ? ` · ${line.combo.drink}` : ""}`);
  }

  if (line.extras.length > 0) {
    details.push(
      line.extras
        .map((extra) => `${extra.quantity}× ${extra.name}`)
        .join(", "),
    );
  }

  if (line.removedIngredients.length > 0) {
    details.push(`Without ${line.removedIngredients.join(", ")}`);
  }

  if (line.beastBox) {
    if (line.beastBox.burgers.length > 0) {
      details.push(`Burgers: ${line.beastBox.burgers.join(", ")}`);
    }
    if (line.beastBox.drinks.length > 0) {
      details.push(`Drinks: ${line.beastBox.drinks.join(", ")}`);
    }
  }

  return details;
}

export async function persistOrderToSupabase(
  payload: OrderPayload,
  customerId: string | null,
): Promise<OrderPersistenceResult> {
  const supabase = getAdminClientOrNull();
  if (!supabase) return { ok: false, reason: "not-configured" };

  const { data: existing, error: existingError } = await supabase
    .from("orders")
    .select("id")
    .eq("request_id", payload.requestId)
    .maybeSingle();

  if (existingError) {
    return { ok: false, reason: "write-failed", detail: existingError.message };
  }

  if (existing) {
    return { ok: true, mode: "supabase", existing: true };
  }

  const { error: orderError } = await supabase.from("orders").insert({
    id: payload.orderId,
    request_id: payload.requestId,
    customer_id: customerId,
    customer_name: payload.customer.name,
    customer_email: payload.customer.email,
    customer_phone: payload.customer.phone,
    status: "received",
    fulfilment_type: "pickup",
    pickup_label: `${payload.fulfilment.locationName} · ASAP pickup`,
    payment_method: payload.payment.method,
    payment_status: payload.payment.status,
    subtotal_cents: cents(payload.totals.subtotal),
    notes: payload.notes,
    admin_notification_status: "pending",
    submitted_at: payload.submittedAt,
  });

  if (orderError) {
    return { ok: false, reason: "write-failed", detail: orderError.message };
  }

  const lineRows = payload.lines.map((line) => ({
    order_id: payload.orderId,
    item_id: line.itemId,
    item_name: line.name,
    image_path:
      menuItems.find((item) => item.id === line.itemId)?.image ?? null,
    quantity: line.quantity,
    unit_price_cents: cents(line.unitPrice),
    line_total_cents: cents(line.lineTotal),
    configuration: {
      combo: line.combo,
      extras: line.extras,
      removedIngredients: line.removedIngredients,
      beastBox: line.beastBox,
      details: lineDetails(line),
    },
  }));

  const { error: linesError } = await supabase.from("order_lines").insert(lineRows);
  if (linesError) {
    await supabase.from("orders").delete().eq("id", payload.orderId);
    return { ok: false, reason: "write-failed", detail: linesError.message };
  }

  return { ok: true, mode: "supabase", existing: false };
}

export async function updateOrderNotificationStatus(
  orderId: string,
  status: "sent" | "failed" | "not-configured",
) {
  const supabase = getAdminClientOrNull();
  if (!supabase) return;
  await supabase
    .from("orders")
    .update({ admin_notification_status: status })
    .eq("id", orderId);
}
