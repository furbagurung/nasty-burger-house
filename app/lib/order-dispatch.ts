import { menuItems, modifierChoices } from "../data/menu";
import type { ServiceStatus } from "./service";
import {
  calculateLineUnitPrice,
  type ValidatedOrder,
} from "./order";
import { calculateEarnedDripPoints } from "./loyalty";

type DispatchResult =
  | { ok: true }
  | { ok: false; reason: "not-configured" | "delivery-failed" };

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function createOrderId(requestId: string) {
  return `NBH-${requestId.replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

export function createOrderDispatchPayload(
  order: ValidatedOrder,
  serviceStatus: ServiceStatus,
  orderId: string,
) {
  const notificationEmail =
    process.env.ORDER_NOTIFICATION_EMAIL?.trim() ||
    "vcouncil.furba@gmail.com";
  const earnedDripPoints = order.dripMember
    ? calculateEarnedDripPoints(order.subtotal)
    : 0;

  return {
    schemaVersion: 2,
    orderId,
    requestId: order.requestId,
    submittedAt: new Date().toISOString(),
    status: "new",
    fulfilment: {
      type: "pickup",
      timing: "asap",
      locationName: serviceStatus.locationName,
      address: serviceStatus.address,
      estimatedPreparation: serviceStatus.prepTimeLabel,
    },
    payment: {
      method: order.paymentMethod,
      status: "unpaid",
      amount: order.subtotal,
      currency: "AUD",
    },
    notification: {
      email: notificationEmail,
    },
    customer: {
      ...order.customer,
      customerId: order.customerId ?? null,
    },
    loyalty: {
      member: order.dripMember,
      earnedPoints: earnedDripPoints,
    },
    notes: order.notes,
    lines: order.cart.map((line) => {
      const item = menuItems.find((entry) => entry.id === line.itemId)!;
      const unitPrice = calculateLineUnitPrice(line, item);

      return {
        lineId: line.lineId,
        itemId: item.id,
        name: item.name,
        quantity: line.quantity,
        unitPrice,
        lineTotal: money(unitPrice * line.quantity),
        combo: line.combo
          ? { selected: true, drink: line.drink }
          : { selected: false },
        extras: line.modifiers.map((selection) => {
          const modifier = modifierChoices.find(
            (entry) => entry.id === selection.id,
          )!;
          return {
            id: modifier.id,
            name: modifier.name,
            quantity: selection.quantity,
            unitPrice: modifier.price,
          };
        }),
        removedIngredients: line.removedIngredients,
        beastBox: item.boxConfig
          ? {
              burgers: line.boxBurgers.map(
                (burgerId) =>
                  menuItems.find((entry) => entry.id === burgerId)?.name ??
                  burgerId,
              ),
              drinks: line.boxDrinks,
            }
          : null,
      };
    }),
    totals: {
      subtotal: order.subtotal,
      total: order.subtotal,
      currency: "AUD",
    },
  };
}

export async function dispatchOrder(
  payload: ReturnType<typeof createOrderDispatchPayload>,
): Promise<DispatchResult> {
  const endpoint = process.env.ORDER_WEBHOOK_URL?.trim();
  if (!endpoint) return { ok: false, reason: "not-configured" };

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return { ok: false, reason: "not-configured" };
  }

  const localDevelopmentEndpoint =
    process.env.NODE_ENV !== "production" &&
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.protocol !== "https:" && !localDevelopmentEndpoint) {
    return { ok: false, reason: "not-configured" };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Idempotency-Key": payload.requestId,
  };
  const secret = process.env.ORDER_WEBHOOK_SECRET?.trim();
  if (secret) headers.Authorization = `Bearer ${secret}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    return response.ok
      ? { ok: true }
      : { ok: false, reason: "delivery-failed" };
  } catch {
    return { ok: false, reason: "delivery-failed" };
  }
}
