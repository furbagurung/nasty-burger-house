import "server-only";

import { menuItems } from "../../data/menu";
import type { CustomerOrder } from "../customer-store";
import { getAdminClientOrNull } from "../supabase/admin";
import { getSquareConfig, squareRequest } from "./api";
import {
  createPaidSquareOrderNotifications,
  type SquarePaidOrder,
  type SquarePaidPayment,
} from "./paid-order-notifications";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type SquareOrderStatus = CustomerOrder["status"];

export function squarePickupStatus(order: SquarePaidOrder): SquareOrderStatus {
  const fulfillment = order.fulfillments?.find((entry) => entry.type === "PICKUP");
  if (order.state === "CANCELED" || fulfillment?.state === "CANCELED" ||
      fulfillment?.state === "FAILED") return "cancelled";
  if (order.state === "COMPLETED" || fulfillment?.state === "COMPLETED") return "completed";
  if (fulfillment?.state === "PREPARED") return "ready";
  if (fulfillment?.state === "RESERVED") return "preparing";
  return "received";
}

export async function recordPaidSquareCustomerOrder(
  payment: SquarePaidPayment,
  order: SquarePaidOrder,
): Promise<{ linked: boolean; orderId?: string }> {
  // Reuse the full-payment, correct-location, website-order gate used by email.
  const validated = createPaidSquareOrderNotifications(
    payment, order, getSquareConfig().locationId,
  );
  if (!validated || !order.id) return { linked: false };

  // Set only at checkout using a verified server-side Supabase session.
  // Never grant order history access based on a freely typed email or phone.
  const customerId = order.metadata?.nbh_user_id?.trim() ?? "";
  if (!UUID_PATTERN.test(customerId)) return { linked: false };

  const db = getAdminClientOrNull();
  if (!db) throw new Error("Supabase admin client is required for Square order history.");

  const { data: customer, error: customerError } = await db
    .from("customers")
    .select("email")
    .eq("id", customerId)
    .maybeSingle();
  if (customerError) throw customerError;
  if (!customer || customer.email.trim().toLowerCase() !==
      validated.email.customer.email.trim().toLowerCase()) {
    return { linked: false };
  }

  const referenceId = validated.email.orderId;
  const status = squarePickupStatus(order);
  const submittedAt = order.created_at || payment.created_at || validated.email.paidAt;
  const snapshot: CustomerOrder = {
    orderId: referenceId,
    squareOrderId: order.id,
    paymentStatus: "paid",
    submittedAt,
    status,
    subtotal: validated.email.total,
    earnedDripPoints: 0, // Square Loyalty, not the legacy Supabase points trigger.
    customerId,
    customerName: validated.email.customer.name,
    customerEmail: validated.email.customer.email,
    customerPhone: validated.email.customer.phone,
    pickupLabel: validated.email.locationName + " · ASAP pickup",
    lines: (order.line_items ?? []).map((line) => {
      const quantity = Math.max(1, Number(line.quantity) || 1);
      const lineCents = line.total_money?.amount ??
        (line.base_price_money?.amount ?? 0) * quantity;
      const item = menuItems.find((entry) => entry.name === line.name);
      const details = line.note?.trim() ? [line.note.trim()] : [];
      return {
        itemId: item?.id ?? line.uid ?? "square-menu-item",
        name: line.name?.trim() || "Menu item",
        image: item?.image,
        quantity,
        unitPrice: (line.base_price_money?.amount ?? 0) / 100,
        lineTotal: lineCents / 100,
        details,
      };
    }),
  };

  const { error } = await db.from("customer_square_orders").upsert({
    square_order_id: order.id,
    customer_id: customerId,
    order_id: referenceId,
    payment_id: payment.id!,
    status,
    submitted_at: submittedAt,
    snapshot,
    updated_at: new Date().toISOString(),
  }, { onConflict: "square_order_id" });
  if (error) throw error;

  return { linked: true, orderId: referenceId };
}

export async function refreshSquareCustomerOrderStatus(squareOrderId: string) {
  const db = getAdminClientOrNull();
  if (!db) return;
  const { data: existing, error: lookupError } = await db
    .from("customer_square_orders")
    .select("square_order_id,status")
    .eq("square_order_id", squareOrderId)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (!existing) return; // Guest/POS/unlinked order: nothing to synchronize.

  const response = await squareRequest<{ order?: SquarePaidOrder }>(
    "/v2/orders/" + encodeURIComponent(squareOrderId),
  );
  if (!response.order || response.order.id !== squareOrderId ||
      response.order.location_id !== getSquareConfig().locationId) return;

  const status = squarePickupStatus(response.order);
  if (status === existing.status) return;
  const { error } = await db.from("customer_square_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("square_order_id", squareOrderId);
  if (error) throw error;
}
