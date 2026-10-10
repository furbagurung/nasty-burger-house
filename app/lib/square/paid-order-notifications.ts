import "server-only";

import { getServiceStatus } from "../service";
import type { createOrderDispatchPayload } from "../order-dispatch";

export type SquareMoney = { amount?: number; currency?: string };
export type SquarePaidPayment = {
  id?: string;
  order_id?: string;
  location_id?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  total_money?: SquareMoney;
  amount_money?: SquareMoney;
  refunded_money?: SquareMoney;
};
export type SquarePaidOrder = {
  id?: string;
  location_id?: string;
  reference_id?: string;
  state?: string;
  metadata?: Record<string, string>;
  total_money?: SquareMoney;
  line_items?: Array<{
    uid?: string;
    catalog_object_id?: string;
    name?: string;
    quantity?: string;
    note?: string;
    base_price_money?: SquareMoney;
    total_money?: SquareMoney;
  }>;
  fulfillments?: Array<{
    type?: string;
    pickup_details?: {
      note?: string;
      recipient?: {
        display_name?: string;
        email_address?: string;
        phone_number?: string;
      };
    };
  }>;
};

export type PaidOrderNotification = {
  orderId: string;
  squareOrderId: string;
  paymentId: string;
  paidAt: string;
  customer: { name: string; email: string; phone: string };
  locationName: string;
  notes: string;
  lines: Array<{ name: string; quantity: number; lineTotal: number; details: string[] }>;
  total: number;
};

type OriginalDispatch = ReturnType<typeof createOrderDispatchPayload>;
export type PaidSquareOrderDispatchPayload =
  Omit<OriginalDispatch, "status" | "payment"> & {
    status: "paid";
    payment: {
      method: "square_checkout";
      status: "paid";
      amount: number;
      currency: "AUD";
      squarePaymentId: string;
      paidAt: string;
    };
  };

function validMoney(
  money: SquareMoney | undefined,
): money is { amount: number; currency: "AUD" } {
  return money?.currency === "AUD" &&
    typeof money.amount === "number" &&
    Number.isSafeInteger(money.amount) && money.amount > 0;
}

/**
 * Accept only fully paid, website-created pickup orders from our own
 * configured Square location. Never trust the webhook body's payment status.
 */
export function createPaidSquareOrderNotifications(
  payment: SquarePaidPayment,
  order: SquarePaidOrder,
  locationId: string,
): { email: PaidOrderNotification; webhook: PaidSquareOrderDispatchPayload } | null {
  if (!payment.id || payment.status !== "COMPLETED" ||
      order.state === "CANCELED" ||
      (payment.refunded_money?.amount ?? 0) > 0 ||
      !payment.order_id || payment.order_id !== order.id ||
      payment.location_id !== locationId || order.location_id !== locationId) return null;

  const orderRef = order.reference_id?.trim() ?? "";
  if (!/^NBH-[A-Z0-9]{8,40}$/.test(orderRef) ||
      !order.metadata?.nbh_customer_id?.trim() ||
      !order.metadata?.nbh_loyalty_id?.trim()) return null;

  const pickup = order.fulfillments?.find((entry) => entry.type === "PICKUP");
  const orderMoney = order.total_money;
  if (!pickup || !validMoney(orderMoney)) return null;

  // Square payment links charge a single full payment; ignore partial/unpaid
  // payments, including a payment that covers less than the order's total.
  const paidMoney = payment.total_money ?? payment.amount_money;
  if (!validMoney(paidMoney) || paidMoney.amount < orderMoney.amount) return null;

  const customer = {
    name: pickup.pickup_details?.recipient?.display_name?.trim() || "Customer",
    email: pickup.pickup_details?.recipient?.email_address?.trim() || "",
    phone: pickup.pickup_details?.recipient?.phone_number?.trim() || "",
  };
  const location = getServiceStatus();
  const lines = (order.line_items ?? []).map((line) => {
    const quantity = Number(line.quantity);
    const count = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
    const lineCents = line.total_money?.amount;
    const unitCents = line.base_price_money?.amount ?? 0;
    const lineTotal = (typeof lineCents === "number" && Number.isFinite(lineCents)
      ? lineCents : unitCents * count) / 100;
    return {
      name: line.name?.trim() || "Menu item",
      quantity: count,
      lineTotal,
      itemId: line.catalog_object_id ?? "",
      lineId: line.uid ?? "",
      details: line.note?.trim() ? [line.note.trim()] : [],
    };
  });
  if (lines.length === 0) return null;

  const total = orderMoney.amount / 100;
  const paidAt = payment.updated_at || payment.created_at || new Date().toISOString();
  const notes = pickup.pickup_details?.note?.trim() || "";
  const email: PaidOrderNotification = {
    orderId: orderRef,
    squareOrderId: order.id!,
    paymentId: payment.id,
    paidAt,
    customer,
    locationName: location.locationName,
    notes,
    lines: lines.map((line) => ({
      name: line.name, quantity: line.quantity,
      lineTotal: line.lineTotal, details: line.details,
    })),
    total,
  };
  const webhook: PaidSquareOrderDispatchPayload = {
    schemaVersion: 2,
    orderId: orderRef,
    requestId: order.id!,
    submittedAt: paidAt,
    status: "paid",
    fulfilment: {
      type: "pickup",
      timing: "asap",
      locationName: location.locationName,
      address: location.address,
      estimatedPreparation: location.prepTimeLabel,
    },
    payment: {
      method: "square_checkout",
      status: "paid",
      amount: total,
      currency: "AUD",
      squarePaymentId: payment.id,
      paidAt,
    },
    notification: { email: process.env.ORDER_NOTIFICATION_EMAIL?.trim() || null },
    customer: { ...customer, customerId: order.metadata!.nbh_customer_id! },
    loyalty: { member: true, earnedPoints: 0 },
    notes,
    lines: lines.map((line) => ({
      lineId: line.lineId,
      itemId: line.itemId,
      name: line.name,
      quantity: line.quantity,
      unitPrice: line.lineTotal / line.quantity,
      lineTotal: line.lineTotal,
      combo: { selected: false },
      extras: [],
      removedIngredients: [],
      beastBox: null,
    })),
    totals: { subtotal: total, total, currency: "AUD" },
  };

  return { email, webhook };
}
