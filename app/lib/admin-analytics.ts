import "server-only";

import { unstable_cache } from "next/cache";
import { getSquareConfig, squareRequest } from "./square/api";
import { addSalesDays, sydneyMidnightUtc, sydneyToday, type SalesRange } from "./admin-sales-range";

const STORE_TIME_ZONE = "Australia/Sydney";

type SquareMoney = {
  amount?: number;
  currency?: string;
};

type SquareOrderLine = {
  name?: string;
  quantity?: string;
  total_money?: SquareMoney;
};

type SquareOrder = {
  id?: string;
  reference_id?: string;
  customer_id?: string;
  metadata?: Record<string, string>;
  state?: string;
  created_at?: string;
  closed_at?: string;
  total_money?: SquareMoney;
  net_amounts?: {
    total_money?: SquareMoney;
  };
  line_items?: SquareOrderLine[];
};

type SearchOrdersResponse = {
  orders?: SquareOrder[];
  cursor?: string;
};

export type AdminAnalyticsData =
  | {
      available: true;
      currency: string;
      periodLabel: string;
      periodDays: number;
      metrics: {
        revenue: number;
        orders: number;
        averageOrderValue: number;
        customers: number;
        revenueChange: number | null;
        ordersChange: number | null;
        averageOrderValueChange: number | null;
        customersChange: number | null;
      };
      dailySales: Array<{
        date: string;
        label: string;
        revenue: number;
        orders: number;
      }>;
      sourceBreakdown: Array<{
        source: "Website" | "Square / POS";
        revenue: number;
        orders: number;
      }>;
      topItems: Array<{
        name: string;
        quantity: number;
        revenue: number;
      }>;
      generatedAt: string;
    }
  | {
      available: false;
      error: string;
    };

const storeDateLabelFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  timeZone: STORE_TIME_ZONE,
});

function moneyAmount(value: SquareMoney | undefined) {
  const amount = value?.amount;
  return typeof amount === "number" && Number.isFinite(amount) ? amount / 100 : 0;
}

function orderRevenue(order: SquareOrder) {
  return moneyAmount(order.net_amounts?.total_money ?? order.total_money);
}

function orderClosedAt(order: SquareOrder) {
  return order.closed_at ?? order.created_at ?? "";
}

function isWebsiteOrder(order: SquareOrder) {
  return Boolean(
    order.metadata?.nbh_customer_id?.trim() ||
      order.metadata?.nbh_loyalty_id?.trim(),
  );
}

function identifiedCustomerId(order: SquareOrder) {
  return (
    order.metadata?.nbh_customer_id?.trim() ||
    order.customer_id?.trim() ||
    null
  );
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function summarisePeriod(orders: SquareOrder[]) {
  const revenue = orders.reduce((total, order) => total + orderRevenue(order), 0);
  const customers = new Set(
    orders
      .map(identifiedCustomerId)
      .filter((value): value is string => Boolean(value)),
  ).size;

  return {
    revenue,
    orders: orders.length,
    averageOrderValue: orders.length > 0 ? revenue / orders.length : 0,
    customers,
  };
}

async function searchCompletedOrders(startAt: Date, endAt: Date) {
  const config = getSquareConfig();
  if (!config.locationId) {
    throw new Error("Square location ID is not configured.");
  }

  const orders: SquareOrder[] = [];
  let cursor: string | undefined;
  let pages = 0;

  const query = {
    filter: {
      date_time_filter: {
        closed_at: {
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
        },
      },
      state_filter: {
        states: ["COMPLETED"],
      },
    },
    sort: {
      sort_field: "CLOSED_AT",
      sort_order: "ASC",
    },
  };

  do {
    const result = await squareRequest<SearchOrdersResponse>(
      "/v2/orders/search",
      {
        method: "POST",
        body: JSON.stringify({
          location_ids: [config.locationId],
          return_entries: false,
          limit: 1000,
          query,
          ...(cursor ? { cursor } : {}),
        }),
      },
    );

    orders.push(...(result.orders ?? []));
    cursor = result.cursor || undefined;
    pages += 1;
  } while (cursor && pages < 20);

  if (cursor) throw new Error("Square returned more order pages than the reporting limit.");
  return orders;
}

async function buildAdminAnalytics(
  from: string,
  to: string,
  periodLabel: string,
  periodDays: number,
): Promise<AdminAnalyticsData> {
  const now = new Date();
  const currentStart = sydneyMidnightUtc(from);
  const endExclusive = sydneyMidnightUtc(addSalesDays(to, 1));
  const currentEnd = new Date(Math.min(now.getTime(), endExclusive.getTime()));
  const previousStart = sydneyMidnightUtc(addSalesDays(from, -periodDays));

  const orders = await searchCompletedOrders(previousStart, currentEnd);

  const currentOrders = orders.filter((order) => {
    const timestamp = Date.parse(orderClosedAt(order));
    return Number.isFinite(timestamp) && timestamp >= currentStart.getTime() && timestamp < currentEnd.getTime();
  });

  const previousOrders = orders.filter((order) => {
    const timestamp = Date.parse(orderClosedAt(order));
    return (
      Number.isFinite(timestamp) &&
      timestamp >= previousStart.getTime() &&
      timestamp < currentStart.getTime()
    );
  });

  const current = summarisePeriod(currentOrders);
  const previous = summarisePeriod(previousOrders);

  const currency =
    currentOrders
      .map(
        (order) =>
          order.net_amounts?.total_money?.currency ??
          order.total_money?.currency,
      )
      .find(Boolean) ?? "AUD";

  const dailyMap = new Map<
    string,
    { date: string; label: string; revenue: number; orders: number }
  >();

  for (let index = 0; index < periodDays; index += 1) {
    const key = addSalesDays(from, index);
    const point = sydneyMidnightUtc(key);
    dailyMap.set(key, {
      date: key,
      label: storeDateLabelFormatter.format(point.getTime() + 12 * 60 * 60 * 1000),
      revenue: 0,
      orders: 0,
    });
  }

  for (const order of currentOrders) {
    const timestamp = orderClosedAt(order);
    if (!timestamp) continue;
    const key = sydneyToday(new Date(timestamp));
    const day = dailyMap.get(key);
    if (!day) continue;
    day.revenue += orderRevenue(order);
    day.orders += 1;
  }

  const sourceTotals = {
    website: { source: "Website" as const, revenue: 0, orders: 0 },
    square: { source: "Square / POS" as const, revenue: 0, orders: 0 },
  };

  const itemTotals = new Map<
    string,
    { name: string; quantity: number; revenue: number }
  >();

  for (const order of currentOrders) {
    const bucket = isWebsiteOrder(order)
      ? sourceTotals.website
      : sourceTotals.square;
    bucket.revenue += orderRevenue(order);
    bucket.orders += 1;

    for (const line of order.line_items ?? []) {
      const name = line.name?.trim() || "Unnamed item";
      const quantityValue = Number.parseFloat(line.quantity ?? "0");
      const quantity =
        Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 0;
      const existing = itemTotals.get(name) ?? {
        name,
        quantity: 0,
        revenue: 0,
      };

      existing.quantity += quantity;
      existing.revenue += moneyAmount(line.total_money);
      itemTotals.set(name, existing);
    }
  }

  return {
    available: true,
    currency,
    periodLabel,
    periodDays,
    metrics: {
      revenue: current.revenue,
      orders: current.orders,
      averageOrderValue: current.averageOrderValue,
      customers: current.customers,
      revenueChange: percentChange(current.revenue, previous.revenue),
      ordersChange: percentChange(current.orders, previous.orders),
      averageOrderValueChange: percentChange(
        current.averageOrderValue,
        previous.averageOrderValue,
      ),
      customersChange: percentChange(current.customers, previous.customers),
    },
    dailySales: [...dailyMap.values()],
    sourceBreakdown: [sourceTotals.website, sourceTotals.square],
    topItems: [...itemTotals.values()]
      .sort(
        (a, b) =>
          b.quantity - a.quantity ||
          b.revenue - a.revenue ||
          a.name.localeCompare(b.name),
      )
      .slice(0, 5),
    generatedAt: now.toISOString(),
  };
}

const loadCachedAdminAnalytics = unstable_cache(
  buildAdminAnalytics,
  ["nbh-admin-analytics-square-v2"],
  {
    revalidate: 300,
    tags: ["nbh-admin-analytics-square"],
  },
);

export async function loadAdminAnalytics(range: SalesRange): Promise<AdminAnalyticsData> {
  try {
    return await loadCachedAdminAnalytics(range.from, range.to, range.label, range.days);
  } catch (error) {
    console.error("[NBH admin analytics Square load failed]", error);
    return {
      available: false,
      error: "Square analytics could not be loaded right now.",
    };
  }
}
