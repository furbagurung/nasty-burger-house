"use client";

import { Eye, Layers3, Smartphone, UsersRound } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminTrafficAnalyticsData } from "@/app/lib/admin-traffic-analytics";
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

const trafficChartConfig = {
  pageviews: {
    label: "Page views",
    color: "var(--admin-analytics-accent)",
  },
} satisfies ChartConfig;

const deviceChartConfig = {
  mobile: {
    label: "Mobile",
    color: "var(--admin-analytics-accent)",
  },
  desktop: {
    label: "Desktop",
    color: "var(--admin-analytics-neutral)",
  },
  other: {
    label: "Other",
    color: "var(--muted-foreground)",
  },
} satisfies ChartConfig;

const regionNames =
  typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames(["en-AU"], { type: "region" })
    : null;

function countryLabel(code: string) {
  if (!code || code === "Unknown") return "Unknown";
  return regionNames?.of(code) ?? code;
}

function deviceLabel(value: string) {
  if (!value) return "Other";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("en-AU", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function RankedList({
  items,
  valueLabel,
}: {
  items: Array<{
    label: string;
    visitors: number;
    pageviews: number;
  }>;
  valueLabel?: "visitors" | "pageviews";
}) {
  const metric = valueLabel ?? "pageviews";
  const maxValue = Math.max(1, ...items.map((item) => item[metric]));

  if (items.length === 0) {
    return <div className="admin-analytics-empty">No traffic data yet.</div>;
  }

  return (
    <ol className="admin-traffic-ranked-list">
      {items.map((item, index) => (
        <li key={item.label + "-" + index}>
          <span className="admin-analytics-item-rank">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="admin-traffic-ranked-copy">
            <div>
              <strong title={item.label}>{item.label}</strong>
              <span>
                {item.visitors.toLocaleString("en-AU")} visitors ·{" "}
                {item.pageviews.toLocaleString("en-AU")} views
              </span>
            </div>
            <div className="admin-analytics-item-bar" aria-hidden="true">
              <span
                style={{
                  width:
                    Math.max(4, (item[metric] / maxValue) * 100) + "%",
                }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function TrafficAnalyticsSection({
  data,
}: {
  data: AdminTrafficAnalyticsData;
}) {
  return (
    <section
      className="admin-traffic-section"
      aria-labelledby="website-traffic-heading"
    >
      <div className="admin-analytics-intro admin-traffic-intro">
        <div>
          <h2 id="website-traffic-heading">Website traffic</h2>
          <p>
            Production website visits from Vercel Web Analytics. Admin routes
            are excluded.
          </p>
        </div>
        <span className="admin-analytics-range">
          {data.available ? data.periodLabel : "Vercel Web Analytics"}
        </span>
      </div>

      {!data.available ? (
        <Card className="admin-analytics-unavailable">
          <CardHeader>
            <CardTitle>Traffic analytics unavailable</CardTitle>
            <CardDescription>{data.error}</CardDescription>
          </CardHeader>
          {data.needsToken && (
            <CardContent>
              <p className="admin-traffic-setup-note">
                The page is ready. Add a server-only Vercel Analytics API token
                to this environment to display the live traffic data here.
              </p>
            </CardContent>
          )}
        </Card>
      ) : (
        <>
          <section
            className="admin-summary-grid admin-traffic-metrics"
            aria-label="Website traffic summary"
          >
            <AdminMetricCard
              label="Visitors"
              value={data.metrics.visitors}
              icon={<UsersRound size={20} />}
              hint="Unique website visitors"
              index={0}
            />
            <AdminMetricCard
              label="Page views"
              value={data.metrics.pageviews}
              icon={<Eye size={20} />}
              hint="Pages viewed across the site"
              index={1}
            />
            <AdminMetricCard
              label="Views / visitor"
              value={data.metrics.viewsPerVisitor.toFixed(1)}
              icon={<Layers3 size={20} />}
              hint="Average depth per visitor"
              index={2}
            />
            <AdminMetricCard
              label="Mobile share"
              value={data.metrics.mobileShare.toFixed(1) + "%"}
              icon={<Smartphone size={20} />}
              hint="Share of website page views"
              index={3}
            />
          </section>

          <section className="admin-analytics-grid" aria-label="Website traffic charts">
            <Card className="admin-analytics-card admin-analytics-card--trend">
              <CardHeader>
                <CardTitle>Traffic trend</CardTitle>
                <CardDescription>
                  Daily production page views for the last 30 days.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={trafficChartConfig}
                  className="admin-analytics-chart h-[16.5rem] w-full aspect-auto"
                >
                  <AreaChart
                    accessibilityLayer
                    data={data.dailyTraffic}
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
                      width={44}
                      tickFormatter={(value) => compactNumber(Number(value))}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    <Area
                      dataKey="pageviews"
                      type="monotone"
                      fill="var(--color-pageviews)"
                      fillOpacity={0.14}
                      stroke="var(--color-pageviews)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="admin-analytics-card admin-traffic-device-card">
              <CardHeader>
                <CardTitle>Devices</CardTitle>
                <CardDescription>
                  Page-view share by device type.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="admin-analytics-donut-wrap admin-traffic-donut-wrap">
                  <ChartContainer
                    config={deviceChartConfig}
                    className="admin-analytics-chart admin-traffic-device-chart h-[12.5rem] w-full aspect-auto"
                  >
                    <PieChart accessibilityLayer>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel nameKey="key" />}
                      />
                      <Pie
                        data={data.devices.map((entry) => {
                          const key = ["mobile", "desktop"].includes(
                            entry.device.toLowerCase(),
                          )
                            ? entry.device.toLowerCase()
                            : "other";

                          return {
                            ...entry,
                            key,
                            fill: "var(--color-" + key + ")",
                          };
                        })}
                        dataKey="pageviews"
                        nameKey="key"
                        innerRadius={58}
                        outerRadius={82}
                        paddingAngle={3}
                        strokeWidth={0}
                      />
                    </PieChart>
                  </ChartContainer>
                  <div className="admin-analytics-donut-center" aria-hidden="true">
                    <span>Page views</span>
                    <strong>
                      {compactNumber(
                        data.devices.reduce((total, row) => total + row.pageviews, 0),
                      )}
                    </strong>
                    <small>30 days</small>
                  </div>
                </div>

                <div className="admin-traffic-device-legend">
                  {data.devices.map((entry) => {
                    const key = ["mobile", "desktop"].includes(
                      entry.device.toLowerCase(),
                    )
                      ? entry.device.toLowerCase()
                      : "other";


                    return (
                      <div key={entry.device}>
                        <span
                          className={
                            "admin-analytics-source-dot is-traffic-" + key
                          }
                          aria-hidden="true"
                        />
                        <span>{deviceLabel(entry.device)}</span>
                        <strong>{entry.sharePercent.toFixed(1)}%</strong>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="admin-traffic-lists" aria-label="Website traffic breakdowns">
            <Card className="admin-analytics-card admin-traffic-list-card admin-traffic-list-card--pages">
              <CardHeader>
                <CardTitle>Top pages</CardTitle>
                <CardDescription>
                  Most-viewed website pages in this period.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RankedList
                  items={data.topPages.map((entry) => ({
                    label: entry.path,
                    visitors: entry.visitors,
                    pageviews: entry.pageviews,
                  }))}
                />
              </CardContent>
            </Card>

            <Card className="admin-analytics-card admin-traffic-list-card">
              <CardHeader>
                <CardTitle>Traffic sources</CardTitle>
                <CardDescription>
                  Referring sites that sent visitors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RankedList
                  valueLabel="visitors"
                  items={data.referrers.map((entry) => ({
                    label: entry.label,
                    visitors: entry.visitors,
                    pageviews: entry.pageviews,
                  }))}
                />
              </CardContent>
            </Card>

            <Card className="admin-analytics-card admin-traffic-list-card">
              <CardHeader>
                <CardTitle>Countries</CardTitle>
                <CardDescription>
                  Top visitor locations reported by Vercel.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RankedList
                  valueLabel="visitors"
                  items={data.countries.map((entry) => ({
                    label: countryLabel(entry.code),
                    visitors: entry.visitors,
                    pageviews: entry.pageviews,
                  }))}
                />
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </section>
  );
}
