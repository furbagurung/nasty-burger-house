"use client";

import { BadgeDollarSign, CalendarDays, ReceiptText, ShoppingBag, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { AdminAnalyticsData } from "@/app/lib/admin-analytics";
import { AdminMetricCard } from "@/components/admin/shared/admin-metric-card";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--admin-sales-accent)",
  },
} satisfies ChartConfig;

function formatCurrency(value: number, currency: string, compact = false) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    maximumFractionDigits: compact ? 1 : 0,
    ...(compact ? { notation: "compact" as const } : {}),
  }).format(value);
}

export default function SalesOverview({ data }: { data: AdminAnalyticsData }) {
  if (!data.available) {
    return (
      <main className="admin-main admin-analytics-main admin-sales-main">
        <section className="admin-analytics-intro" aria-labelledby="business-overview-heading">
          <div>
            <h2 id="business-overview-heading">Business overview</h2>
            <p>Completed Square orders.</p>
          </div>
        </section>
        <Card className="admin-analytics-unavailable">
          <CardHeader>
            <CardTitle>Sales analytics unavailable</CardTitle>
            <CardDescription>{data.error}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const currency = data.currency;
  const totalChannelRevenue = data.sourceBreakdown.reduce(
    (sum, channel) => sum + channel.revenue,
    0,
  );
  const channels = data.sourceBreakdown.map((entry) => ({
    ...entry,
    key: entry.source === "Website" ? "website" : "square",
    share: totalChannelRevenue > 0 ? (entry.revenue / totalChannelRevenue) * 100 : 0,
  }));
  const websiteShare = channels.find((entry) => entry.key === "website")?.share ?? 0;
  const squareShare = channels.find((entry) => entry.key === "square")?.share ?? 0;
  const maxQuantity = Math.max(1, ...data.topItems.map((item) => item.quantity));

  return (
    <main className="admin-main admin-analytics-main admin-sales-main">
      <section className="admin-analytics-intro" aria-labelledby="business-overview-heading">
        <div>
          <h2 id="business-overview-heading">Business overview</h2>
          <p>Completed Square orders.</p>
        </div>
        <Badge variant="outline" className="admin-sales-period">
          <CalendarDays aria-hidden="true" />
          {data.periodLabel} · Square
        </Badge>
      </section>

      <section className="admin-summary-grid admin-sales-metrics admin-kpi-grid" aria-label="Sales summary">
        <AdminMetricCard
          label="Revenue"
          value={formatCurrency(data.metrics.revenue, currency)}
          icon={<BadgeDollarSign size={20} />}
          trend={data.metrics.revenueChange}
          tone="brand"
          index={0}
        />
        <AdminMetricCard
          label="Orders"
          tone="comparison"
          value={data.metrics.orders}
          icon={<ShoppingBag size={20} />}
          trend={data.metrics.ordersChange}
          index={1}
        />
        <AdminMetricCard
          label="Average order"
          value={formatCurrency(data.metrics.averageOrderValue, currency)}
          icon={<ReceiptText size={20} />}
          trend={data.metrics.averageOrderValueChange}
          index={2}
        />
        <AdminMetricCard
          label="Customers"
          value={data.metrics.customers}
          icon={<Users size={20} />}
          trend={data.metrics.customersChange}
          hint="Identified buyers"
          index={3}
        />
      </section>

      <section className="admin-sales-charts" aria-label="Sales performance">
        <Card className="admin-analytics-card admin-sales-revenue-card">
          <CardHeader>
            <div className="admin-sales-card-heading">
              <div>
                <CardTitle>Revenue performance</CardTitle>
                <CardDescription>Daily sales</CardDescription>
              </div>
              <span className="admin-sales-card-period">30 days</span>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={revenueChartConfig}
              className="admin-sales-revenue-chart h-[18rem] w-full aspect-auto"
            >
              <AreaChart
                accessibilityLayer
                data={data.dailySales}
                margin={{ left: 0, right: 12, top: 14, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="admin-sales-revenue-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0.015} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.65} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  minTickGap={26}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={58}
                  tickFormatter={(value) => formatCurrency(Number(value), currency, true)}
                />
                <ChartTooltip
                  cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      formatter={(value) => (
                        <span className="font-semibold tabular-nums text-foreground">
                          {formatCurrency(Number(value), currency)}
                        </span>
                      )}
                    />
                  }
                />
                <Area
                  dataKey="revenue"
                  type="monotone"
                  fill="url(#admin-sales-revenue-fill)"
                  stroke="var(--color-revenue)"
                  strokeWidth={2.5}
                  activeDot={{ r: 4, fill: "var(--color-revenue)", stroke: "var(--card)", strokeWidth: 2 }}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="admin-analytics-card admin-sales-channels-card">
          <CardHeader>
            <CardTitle>Sales channels</CardTitle>
            <CardDescription>Website vs Square / POS</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="admin-sales-channel-total">
              <span>Channel revenue</span>
              <strong>{formatCurrency(totalChannelRevenue, currency)}</strong>
            </div>

            <div
              className="admin-sales-channel-track"
              role="img"
              aria-label={`Website ${websiteShare.toFixed(1)} percent, Square / POS ${squareShare.toFixed(1)} percent of revenue`}
            >
              <span
                className="admin-sales-channel-fill"
                style={{ width: `${websiteShare}%` }}
              />
            </div>

            <div className="admin-sales-channel-list">
              {channels.map((entry) => (
                <div key={entry.key} className="admin-sales-channel-row">
                  <div className="admin-sales-channel-identity">
                    <span
                      className={`admin-sales-channel-dot is-${entry.key}`}
                      aria-hidden="true"
                    />
                    <span>{entry.source}</span>
                    <small>{entry.orders.toLocaleString("en-AU")} orders</small>
                  </div>
                  <div className="admin-sales-channel-amount">
                    <strong>{formatCurrency(entry.revenue, currency)}</strong>
                    <span>{entry.share.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="admin-analytics-card admin-sales-products-card">
        <CardHeader>
          <div className="admin-sales-card-heading">
            <div>
              <CardTitle>Top items</CardTitle>
              <CardDescription>By units sold</CardDescription>
            </div>
            <span className="admin-sales-card-period">{data.periodLabel}</span>
          </div>
        </CardHeader>
        <CardContent>
          {data.topItems.length === 0 ? (
            <div className="admin-analytics-empty">
              No item sales this period.
            </div>
          ) : (
            <Table className="admin-sales-products-table" aria-label="Top-selling items">
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Item</TableHead>
                  <TableHead scope="col" className="admin-sales-numeric">Units</TableHead>
                  <TableHead scope="col" className="admin-sales-numeric">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topItems.map((item, index) => (
                  <TableRow key={item.name}>
                    <TableCell>
                      <div className="admin-sales-product-identity">
                        <span className="admin-sales-product-rank">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="admin-sales-product-details">
                          <strong title={item.name}>{item.name}</strong>
                          <div className="admin-sales-product-track" aria-hidden="true">
                            <span
                              style={{ width: `${(item.quantity / maxQuantity) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="admin-sales-numeric admin-sales-units">
                      {item.quantity.toLocaleString("en-AU")}
                    </TableCell>
                    <TableCell className="admin-sales-numeric admin-sales-item-revenue">
                      {formatCurrency(item.revenue, currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
