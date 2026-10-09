"use client";

import {
  BadgeDollarSign,
  ReceiptText,
  ShoppingBag,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminAnalyticsData } from "@/app/lib/admin-analytics";
import { AdminMetricCard } from "@/components/admin/shared/admin-metric-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

function moneyFormatter(currency: string) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
}

function compactMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function changeHint(change: number | null) {
  if (change === null) return "No previous-period baseline";
  const rounded = Math.abs(change) < 0.05 ? 0 : change;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(1)}% vs previous 30 days`;
}

const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--admin-analytics-accent)",
  },
} satisfies ChartConfig;

const sourceChartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--admin-analytics-accent)",
  },
} satisfies ChartConfig;

export default function AnalyticsDashboard({
  data,
}: {
  data: AdminAnalyticsData;
}) {
  if (!data.available) {
    return (
      <main className="admin-main admin-analytics-main">
        <Card className="admin-analytics-unavailable">
          <CardHeader>
            <CardTitle>Analytics unavailable</CardTitle>
            <CardDescription>
              {data.error} Customer and menu administration are unaffected.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const money = moneyFormatter(data.currency);
  const maxItemQuantity = Math.max(
    1,
    ...data.topItems.map((item) => item.quantity),
  );

  return (
    <main className="admin-main admin-analytics-main">
      <section className="admin-analytics-intro" aria-labelledby="analytics-heading">
        <div>
          <h2 id="analytics-heading">Sales overview</h2>
          <p>
            Completed Square orders across the current store location.
          </p>
        </div>
        <span className="admin-analytics-range">{data.periodLabel} · Square</span>
      </section>

      <section className="admin-summary-grid" aria-label="Analytics summary">
        <AdminMetricCard
          label="Revenue"
          value={money.format(data.metrics.revenue)}
          icon={<BadgeDollarSign size={20} />}
          hint={changeHint(data.metrics.revenueChange)}
          index={0}
        />
        <AdminMetricCard
          label="Orders"
          value={data.metrics.orders}
          icon={<ShoppingBag size={20} />}
          hint={changeHint(data.metrics.ordersChange)}
          index={1}
        />
        <AdminMetricCard
          label="Average order"
          value={money.format(data.metrics.averageOrderValue)}
          icon={<ReceiptText size={20} />}
          hint={changeHint(data.metrics.averageOrderValueChange)}
          index={2}
        />
        <AdminMetricCard
          label="Customers"
          value={data.metrics.customers}
          icon={<Users size={20} />}
          hint={`Unique identified buyers · ${changeHint(data.metrics.customersChange)}`}
          index={3}
        />
      </section>

      <section className="admin-analytics-grid" aria-label="Sales charts">
        <Card className="admin-analytics-card admin-analytics-card--trend">
          <CardHeader>
            <CardTitle>Revenue trend</CardTitle>
            <CardDescription>
              Daily completed sales for the last 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={revenueChartConfig}
              className="admin-analytics-chart h-[18rem] w-full aspect-auto"
            >
              <AreaChart
                accessibilityLayer
                data={data.dailySales}
                margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={28}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={58}
                  tickFormatter={(value) =>
                    compactMoney(Number(value), data.currency)
                  }
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Area
                  dataKey="revenue"
                  type="monotone"
                  fill="var(--color-revenue)"
                  fillOpacity={0.14}
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="admin-analytics-card">
          <CardHeader>
            <CardTitle>Sales source</CardTitle>
            <CardDescription>
              Website checkout compared with other Square / POS sales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={sourceChartConfig}
              className="admin-analytics-chart admin-analytics-chart--source h-[18rem] w-full aspect-auto"
            >
              <BarChart
                accessibilityLayer
                data={data.sourceBreakdown}
                margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="source"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={58}
                  tickFormatter={(value) =>
                    compactMoney(Number(value), data.currency)
                  }
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-revenue)"
                  radius={[6, 6, 2, 2]}
                />
              </BarChart>
            </ChartContainer>

            <div className="admin-analytics-source-summary">
              {data.sourceBreakdown.map((entry) => (
                <div key={entry.source}>
                  <span>{entry.source}</span>
                  <strong>{money.format(entry.revenue)}</strong>
                  <small>
                    {entry.orders} order{entry.orders === 1 ? "" : "s"}
                  </small>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="admin-analytics-card admin-analytics-top-items">
        <CardHeader>
          <CardTitle>Top-selling items</CardTitle>
          <CardDescription>
            Ranked by quantity sold in completed orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.topItems.length === 0 ? (
            <div className="admin-analytics-empty">
              No completed item sales in this period.
            </div>
          ) : (
            <ol>
              {data.topItems.map((item, index) => (
                <li key={item.name}>
                  <span className="admin-analytics-item-rank">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="admin-analytics-item-copy">
                    <div>
                      <strong>{item.name}</strong>
                      <span>
                        {item.quantity.toLocaleString("en-AU")} sold ·{" "}
                        {money.format(item.revenue)}
                      </span>
                    </div>
                    <div
                      className="admin-analytics-item-bar"
                      aria-hidden="true"
                    >
                      <span
                        style={{
                          width: `${Math.max(
                            4,
                            (item.quantity / maxItemQuantity) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
