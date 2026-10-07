import { menuItems } from "../../data/menu";
import {
  getSquareConfig,
  squareConfigurationState,
  squareRequest,
} from "../../lib/square/api";

type SquarePayment = {
  status?: string;
  order_id?: string;
};

type ListPaymentsResponse = {
  payments?: SquarePayment[];
};

type SquareOrder = {
  id?: string;
  line_items?: Array<{
    name?: string;
    quantity?: string;
  }>;
};

type BatchRetrieveOrdersResponse = {
  orders?: SquareOrder[];
};

type RankedPick = {
  id: string;
  quantity: number;
  orderCount: number;
};

const LOOKBACK_DAYS = 90;
const MAX_PICKS = 4;
const FALLBACK_IDS = ["og-nasty", "peri-beast", "nasty-fries", "bbq-beast"];

function normalizeName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function fallbackResponse() {
  return Response.json(
    {
      source: "fallback",
      windowDays: LOOKBACK_DAYS,
      picks: FALLBACK_IDS.map((id) => ({
        id,
        quantity: 0,
        orderCount: 0,
      })),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
      },
    },
  );
}

export async function GET() {
  const state = squareConfigurationState();
  if (!state.configured) return fallbackResponse();

  try {
    const config = getSquareConfig();
    const beginTime = new Date(
      Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    const params = new URLSearchParams({
      begin_time: beginTime,
      location_id: config.locationId,
      sort_order: "DESC",
      limit: "100",
    });

    const payments = await squareRequest<ListPaymentsResponse>(
      `/v2/payments?${params.toString()}`,
      { method: "GET" },
    );

    const orderIds = Array.from(
      new Set(
        (payments.payments ?? [])
          .filter(
            (payment) =>
              payment.status === "COMPLETED" && Boolean(payment.order_id),
          )
          .map((payment) => payment.order_id!)
          .slice(0, 100),
      ),
    );

    if (orderIds.length === 0) return fallbackResponse();

    const result = await squareRequest<BatchRetrieveOrdersResponse>(
      "/v2/orders/batch-retrieve",
      {
        method: "POST",
        body: JSON.stringify({
          location_id: config.locationId,
          order_ids: orderIds,
        }),
      },
    );

    const itemByName = new Map(
      menuItems
        .filter((item) => item.category !== "drinks")
        .map((item) => [normalizeName(item.name), item]),
    );

    const quantityByItem = new Map<string, number>();
    const ordersByItem = new Map<string, Set<string>>();

    for (const order of result.orders ?? []) {
      if (!order.id) continue;

      for (const line of order.line_items ?? []) {
        if (!line.name) continue;

        const item = itemByName.get(normalizeName(line.name));
        if (!item) continue;

        const quantity = Math.max(0, Number(line.quantity ?? "0"));
        if (!Number.isFinite(quantity) || quantity <= 0) continue;

        quantityByItem.set(
          item.id,
          (quantityByItem.get(item.id) ?? 0) + quantity,
        );

        const orderSet = ordersByItem.get(item.id) ?? new Set<string>();
        orderSet.add(order.id);
        ordersByItem.set(item.id, orderSet);
      }
    }

    const picks: RankedPick[] = Array.from(quantityByItem.entries())
      .map(([id, quantity]) => ({
        id,
        quantity,
        orderCount: ordersByItem.get(id)?.size ?? 0,
      }))
      .sort(
        (a, b) =>
          b.quantity - a.quantity ||
          b.orderCount - a.orderCount ||
          a.id.localeCompare(b.id),
      )
      .slice(0, MAX_PICKS);

    if (picks.length === 0) return fallbackResponse();

    return Response.json(
      {
        source: "square",
        windowDays: LOOKBACK_DAYS,
        picks,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
        },
      },
    );
  } catch (error) {
    console.warn("[NBH popular picks] Falling back to curated picks.", error);
    return fallbackResponse();
  }
}
