import "server-only";

import { getSquareConfig, squareRequest } from "./square/api";

/** Completed and cancelled sales from Square, including POS and website orders. */
type SquareMoney = { amount?: number; currency?: string };
type SquareLine = { name?: string; quantity?: string; total_money?: SquareMoney };
type SquareOrder = {
  id?: string;
  reference_id?: string;
  state?: string;
  closed_at?: string;
  created_at?: string;
  customer_id?: string;
  metadata?: Record<string, string>;
  total_money?: SquareMoney;
  net_amounts?: { total_money?: SquareMoney };
  tenders?: Array<{ customer_id?: string }>;
  line_items?: SquareLine[];
};
type OrdersResponse = { orders?: SquareOrder[]; cursor?: string };
type Customer = { id?: string; given_name?: string; family_name?: string; company_name?: string };
type CustomerResponse = {
  responses?: Record<string, { customer?: Customer }>;
};

export type RestaurantOrder = {
  id: string;
  reference: string;
  closedAt: string;
  status: "Completed" | "Cancelled";
  channel: "Website" | "Square / POS";
  customerName: string;
  customerId: string | null;
  amount: number;
  currency: string;
  items: Array<{ name: string; quantity: number; amount: number }>;
};

export type RestaurantOrderPage = {
  orders: RestaurantOrder[];
  nextCursor: string | null;
};

function money(value: SquareMoney | undefined) {
  return typeof value?.amount === "number" && Number.isFinite(value.amount)
    ? value.amount / 100
    : 0;
}

function isWebsiteOrder(order: SquareOrder) {
  return Boolean(
    order.metadata?.nbh_customer_id?.trim() ||
      order.metadata?.nbh_loyalty_id?.trim(),
  );
}

function customerName(customer: Customer | undefined) {
  const full = [customer?.given_name, customer?.family_name]
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
  return full || customer?.company_name?.trim() || "Square customer";
}

async function customerNames(ids: string[]) {
  const names = new Map<string, string>();
  const unique = [...new Set(ids.filter(Boolean))];

  // Customer lookup is best-effort; history must still work if the directory
  // permission is missing. Never infer identity from an unrelated transaction.
  for (let index = 0; index < unique.length; index += 100) {
    const group = unique.slice(index, index + 100);
    try {
      const response = await squareRequest<CustomerResponse>(
        "/v2/customers/bulk-retrieve",
        {
          method: "POST",
          body: JSON.stringify({ customer_ids: group }),
        },
      );
      for (const [id, item] of Object.entries(response.responses ?? {})) {
        if (item.customer) names.set(id, customerName(item.customer));
      }
    } catch (error) {
      console.error("[NBH admin order customer lookup failed]", error);
    }
  }
  return names;
}

export async function loadRestaurantOrderPage({
  cursor,
  customerId,
}: {
  cursor?: string;
  customerId?: string;
} = {}): Promise<RestaurantOrderPage> {
  const { locationId } = getSquareConfig();
  if (!locationId) throw new Error("Square location is not configured.");

  const query = {
    filter: {
      state_filter: { states: ["COMPLETED", "CANCELED"] },
      ...(customerId
        ? { customer_filter: { customer_ids: [customerId] } }
        : {}),
    },
    sort: { sort_field: "CLOSED_AT", sort_order: "DESC" },
  };
  const result = await squareRequest<OrdersResponse>("/v2/orders/search", {
    method: "POST",
    body: JSON.stringify({
      location_ids: [locationId],
      return_entries: false,
      limit: 50,
      query,
      ...(cursor ? { cursor } : {}),
    }),
  });

  const orders = (result.orders ?? []).filter((order) => Boolean(order.id));
  const linkedIds = orders.map(
    (order) => order.customer_id?.trim() ||
      order.tenders?.find((tender) => tender.customer_id?.trim())?.customer_id?.trim() ||
      "",
  );
  const names = await customerNames(linkedIds);

  return {
    orders: orders.map((order, index) => {
      const linkedId = linkedIds[index] || null;
      const total = order.net_amounts?.total_money ?? order.total_money;
      const lines = (order.line_items ?? []).map((line) => {
        const quantity = Number.parseFloat(line.quantity ?? "0");
        return {
          name: line.name?.trim() || "Item",
          quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 0,
          amount: money(line.total_money),
        };
      });
      return {
        id: order.id!,
        reference: order.reference_id?.trim() || order.id!.slice(-8),
        closedAt: order.closed_at || order.created_at || "",
        status: order.state === "CANCELED" ? "Cancelled" : "Completed",
        channel: isWebsiteOrder(order) ? "Website" : "Square / POS",
        customerName: linkedId ? names.get(linkedId) || "Square customer" : "Guest / Walk-in",
        customerId: linkedId,
        amount: money(total),
        currency: total?.currency || "AUD",
        items: lines,
      };
    }),
    nextCursor: result.cursor || null,
  };
}
