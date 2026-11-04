import type { SquarePaidOrder } from "./paid-order-notifications";

export type SquareOrderStatus = "received" | "preparing" | "ready" | "completed" | "cancelled";

/** Map Square's pickup fulfillment state, not just its payment/order state. */
export function squarePickupStatus(
  order: Pick<SquarePaidOrder, "state" | "fulfillments">,
): SquareOrderStatus {
  const fulfillment = order.fulfillments?.find((entry) => entry.type === "PICKUP");
  if (order.state === "CANCELED" || fulfillment?.state === "CANCELED" ||
      fulfillment?.state === "FAILED") return "cancelled";
  if (order.state === "COMPLETED" || fulfillment?.state === "COMPLETED") return "completed";
  if (fulfillment?.state === "PREPARED") return "ready";
  if (fulfillment?.state === "RESERVED") return "preparing";
  return "received";
}
