"use client";

import { Eye, Layers3, Smartphone, UsersRound } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminTrafficAnalyticsData } from "@/app/lib/admin-traffic-analytics";
import type { ReportPeriod } from "@/app/lib/admin-report-period";
import { reportPeriodLabel } from "@/app/lib/admin-report-period";
import { AdminPeriodFilter } from "@/components/admin/shared/admin-period-filter";
import { AdminMetricCard } from "@/components/admin/shared/admin-metric-card";
import { CountryFlagIcon, ReferrerFavicon } from "./traffic-rank-icon";
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
    color: "var(--admin-traffic-accent)",
  },
  visitors: {
    label: "Visitors",
    color: "var(--admin-traffic-visitor)",
  },
} satisfies ChartConfig;

const deviceChartConfig = {
  mobile: {
    label: "Mobile",
    color: "var(--admin-traffic-accent)",
  },
  desktop: {
    label: "Desktop",
    color: "var(--admin-traffic-visitor)",
  },
  other: {
    label: "Other",
    color: "var(--admin-traffic-neutral)",
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
  iconType,
}: {
  items: Array<{
    label: string;
    visitors: number;
    pageviews: number;
    countryCode?: string;
  }>;
  valueLabel?: "visitors" | "pageviews";
  iconType?: "referrer" | "country";
}) {
  const metric = valueLabel ?? "pageviews";
  const maxValue = Math.max(1, ...items.map((item) => item[metric]));

  if (items.length === 0) {
    return <div className="admin-analytics-empty">No data yet.</div>;
  }

  return (
    <ul className="admin-traffic-ranked-list">
      {items.map((item, index) => (
        <li key={item.label + "-" + index}>
          <div className="admin-traffic-ranked-copy">
            <div>
              <div className="admin-traffic-ranked-heading">
                {iconType === "referrer" && <ReferrerFavicon source={item.label} />}
                {iconType === "country" && (
                  <CountryFlagIcon countryCode={item.countryCode ?? ""} />
                )}
                <strong title={item.label}>{item.label}</strong>
              </div>
              <span>
                {item.visitors.toLocaleString("en-AU")} visitors ·{" "}
                {item.pageviews.toLocaleString("en-AU")} views
              </span>
            </div>
            <div className="admin-traffic-item-bar" aria-hidden="true">
              <span
                style={{
                  width: (item[metric] > 0 ? (item[metric] / maxValue) * 100 : 0) + "%",
                }}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function TrafficAnalyticsSection({
  data,
  period,
}: {
  data: AdminTrafficAnalyticsData;
  period: ReportPeriod;
}) {
  return (
    <section
      className="admin-traffic-section admin-traffic-dashboard"
      aria-labelledby="website-traffic-heading"
    >
      <div className="admin-analytics-intro admin-traffic-intro">
        <div>
          <h2 id="website-traffic-heading">Website traffic</h2>
          <p>Website visits, excluding admin pages.</p>
        </div>
        <AdminPeriodFilter pathname="/admin/analytics" period={period} />
      </div>

      {!data.available ? (
        <Card className="admin-analytics-unavailable">
          <CardHeader>
            <CardTitle>Traffic unavailable</CardTitle>
            <CardDescription>{data.error}</CardDescription>
          </CardHeader>
          {data.needsToken && (
            <CardContent>
              <p className="admin-traffic-setup-note">
                Add a server-only Vercel API token to view traffic.
              </p>
            </CardContent>
          )}
        </Card>
      ) : (
        <>
          <section
            className="admin-summary-grid admin-traffic-metrics admin-kpi-grid"
            aria-label="Website traffic summary"
          >
            <AdminMetricCard
              label="Unique visitors"
              value={data.metrics.visitors}
              icon={<UsersRound size={20} />}
              tone="brand"
              index={0}
            />
            <AdminMetricCard
              label="Page views"
              tone="comparison"
              value={data.metrics.pageviews}
              icon={<Eye size={20} />}
              index={1}
            />
            <AdminMetricCard
              label="Views / visitor"
              value={data.metrics.viewsPerVisitor.toFixed(1)}
              icon={<Layers3 size={20} />}
              index={2}
            />
            <AdminMetricCard
              label="Mobile share"
              value={data.metrics.mobileShare.toFixed(1) + "%"}
              icon={<Smartphone size={20} />}
              hint="Of page views"
              index={3}
            />
          </section>

          <section className="admin-analytics-grid" aria-label="Website traffic charts">
            <Card className="admin-analytics-card admin-traffic-trend-card">
              <CardHeader>
                <div className="admin-traffic-card-heading">
                  <div>
                    <CardTitle>Traffic trend</CardTitle>
                    <CardDescription>{period === "24h" ? "Hourly views and visitors" : "Daily views and visitors"}</CardDescription>
                  </div>
                  <span className="admin-traffic-card-period">{reportPeriodLabel(period)}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="admin-traffic-chart-legend" aria-label="Line chart series">
                  <span>
                    <i className="admin-traffic-line-key is-pageviews" aria-hidden="true" />
                    Page views
                  </span>
                  <span>
                    <i className="admin-traffic-line-key is-visitors" aria-hidden="true" />
                    Visitors
                  </span>
                </div>
                <ChartContainer
                  config={trafficChartConfig}
                  className="admin-traffic-line-chart h-[16rem] w-full aspect-auto"
                >
                  <LineChart
                    accessibilityLayer
                    data={data.dailyTraffic}
                    margin={{ left: 0, right: 10, top: 14, bottom: 0 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="var(--border)"
                      strokeOpacity={0.65}
                    />
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
                      width={44}
                      allowDecimals={false}
                      tickFormatter={(value) => compactNumber(Number(value))}
                    />
                    <ChartTooltip
                      cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    <Line
                      dataKey="pageviews"
                      type="monotone"
                      stroke="var(--color-pageviews)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{
                        r: 4,
                        fill: "var(--color-pageviews)",
                        stroke: "var(--card)",
                        strokeWidth: 2,
                      }}
                    />
                    <Line
                      dataKey="visitors"
                      type="linear"
                      stroke="var(--color-visitors)"
                      strokeWidth={2.1}
                      strokeDasharray="6 4"
                      dot={false}
                      activeDot={{
                        r: 4,
                        fill: "var(--color-visitors)",
                        stroke: "var(--card)",
                        strokeWidth: 2,
                      }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="admin-analytics-card admin-traffic-device-card">
              <CardHeader>
                <CardTitle>Devices</CardTitle>
                <CardDescription>
                  Share of page views
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
                        <small>{entry.pageviews.toLocaleString("en-AU")} views</small>
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
                  By page views
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

            <Card className="admin-analytics-card admin-traffic-list-card admin-traffic-list-card--sources">
              <CardHeader>
                <CardTitle>Traffic sources</CardTitle>
                <CardDescription>
                  Referrers and direct visits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RankedList
                  iconType="referrer"
                  valueLabel="visitors"
                  items={data.referrers.map((entry) => ({
                    label: entry.label,
                    visitors: entry.visitors,
                    pageviews: entry.pageviews,
                  }))}
                />
              </CardContent>
            </Card>

            <Card className="admin-analytics-card admin-traffic-list-card admin-traffic-list-card--countries">
              <CardHeader>
                <CardTitle>Countries</CardTitle>
                <CardDescription>
                  Visitor locations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RankedList
                  iconType="country"
                  valueLabel="visitors"
                  items={data.countries.map((entry) => ({
                    label: countryLabel(entry.code),
                    countryCode: entry.code,
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
