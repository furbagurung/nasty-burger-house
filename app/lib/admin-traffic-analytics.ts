import "server-only";

import { unstable_cache } from "next/cache";

const DAY_MS = 24 * 60 * 60 * 1000;
const PERIOD_DAYS = 30;
const VERCEL_ANALYTICS_BASE =
  "https://api.vercel.com/v1/query/web-analytics/visits";
const PROJECT_ID_FALLBACK = "prj_RF19kTzJ95hpVLJKrWpJ5HZHrw1k";
const TEAM_ID_FALLBACK = "team_aMZq96a6NQQHJlEAmiYhx6HG";
const WEBSITE_FILTER = "not startswith(requestPath, '/admin')";

type TrafficCount = {
  visitors?: number;
  pageviews?: number;
};

type TrafficAggregateRow = {
  timestamp?: string;
  requestPath?: string;
  referrerHostname?: string;
  country?: string;
  deviceType?: string;
  visitors?: number;
  pageviews?: number;
};

type VercelAnalyticsResponse<T> = {
  data?: T;
};

export type AdminTrafficAnalyticsData =
  | {
      available: true;
      periodLabel: string;
      metrics: {
        visitors: number;
        pageviews: number;
        viewsPerVisitor: number;
        mobileShare: number;
      };
      dailyTraffic: Array<{
        date: string;
        label: string;
        visitors: number;
        pageviews: number;
      }>;
      topPages: Array<{
        path: string;
        visitors: number;
        pageviews: number;
      }>;
      referrers: Array<{
        label: string;
        visitors: number;
        pageviews: number;
      }>;
      countries: Array<{
        code: string;
        visitors: number;
        pageviews: number;
      }>;
      devices: Array<{
        device: string;
        visitors: number;
        pageviews: number;
      }>;
      generatedAt: string;
    }
  | {
      available: false;
      error: string;
      needsToken: boolean;
    };

const dayLabelFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
});

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function analyticsToken() {
  return (
    process.env.VERCEL_WEB_ANALYTICS_TOKEN?.trim() ||
    process.env.VERCEL_TOKEN?.trim() ||
    process.env.VERCEL_OIDC_TOKEN?.trim() ||
    ""
  );
}

function analyticsProjectId() {
  return process.env.VERCEL_PROJECT_ID?.trim() || PROJECT_ID_FALLBACK;
}

function analyticsTeamId() {
  return (
    process.env.VERCEL_TEAM_ID?.trim() ||
    process.env.VERCEL_ORG_ID?.trim() ||
    TEAM_ID_FALLBACK
  );
}

async function vercelAnalyticsRequest<T>(
  endpoint: "count" | "aggregate",
  options: {
    since: string;
    until: string;
    by?: string;
    limit?: number;
  },
) {
  const token = analyticsToken();
  if (!token) {
    throw new Error("VERCEL_ANALYTICS_TOKEN_MISSING");
  }

  const url = new URL(VERCEL_ANALYTICS_BASE + "/" + endpoint);
  url.searchParams.set("projectId", analyticsProjectId());
  url.searchParams.set("teamId", analyticsTeamId());
  url.searchParams.set("since", options.since);
  url.searchParams.set("until", options.until);
  url.searchParams.set("filter", WEBSITE_FILTER);

  if (options.by) url.searchParams.append("by", options.by);
  if (options.limit) url.searchParams.set("limit", String(options.limit));

  const response = await fetch(url, {
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error("VERCEL_ANALYTICS_REQUEST_" + response.status);
  }

  const payload = (await response.json()) as VercelAnalyticsResponse<T>;
  if (payload.data === undefined) {
    throw new Error("VERCEL_ANALYTICS_INVALID_RESPONSE");
  }

  return payload.data;
}

async function buildAdminTrafficAnalytics(): Promise<AdminTrafficAnalyticsData> {
  const now = new Date();
  const since = new Date(now.getTime() - PERIOD_DAYS * DAY_MS);

  const query = {
    since: since.toISOString(),
    until: now.toISOString(),
  };

  const [count, daily, pages, referrers, countries, devices] =
    await Promise.all([
      vercelAnalyticsRequest<TrafficCount>("count", query),
      vercelAnalyticsRequest<TrafficAggregateRow[]>("aggregate", {
        ...query,
        by: "day",
        limit: 100,
      }),
      vercelAnalyticsRequest<TrafficAggregateRow[]>("aggregate", {
        ...query,
        by: "requestPath",
        limit: 12,
      }),
      vercelAnalyticsRequest<TrafficAggregateRow[]>("aggregate", {
        ...query,
        by: "referrerHostname",
        limit: 10,
      }),
      vercelAnalyticsRequest<TrafficAggregateRow[]>("aggregate", {
        ...query,
        by: "country",
        limit: 10,
      }),
      vercelAnalyticsRequest<TrafficAggregateRow[]>("aggregate", {
        ...query,
        by: "deviceType",
        limit: 8,
      }),
    ]);

  const visitors = numberValue(count.visitors);
  const pageviews = numberValue(count.pageviews);

  const deviceRows = (devices ?? []).map((row) => ({
    device: row.deviceType?.trim() || "other",
    visitors: numberValue(row.visitors),
    pageviews: numberValue(row.pageviews),
  }));

  const mobileVisitors =
    deviceRows.find((row) => row.device.toLowerCase() === "mobile")?.visitors ??
    0;

  return {
    available: true,
    periodLabel: "Last 30 days",
    metrics: {
      visitors,
      pageviews,
      viewsPerVisitor: visitors > 0 ? pageviews / visitors : 0,
      mobileShare: visitors > 0 ? (mobileVisitors / visitors) * 100 : 0,
    },
    dailyTraffic: (daily ?? []).map((row) => {
      const timestamp = row.timestamp ?? "";
      const date = timestamp ? new Date(timestamp) : new Date();

      return {
        date: timestamp,
        label: dayLabelFormatter.format(date),
        visitors: numberValue(row.visitors),
        pageviews: numberValue(row.pageviews),
      };
    }),
    topPages: (pages ?? [])
      .filter(
        (row) =>
          Boolean(row.requestPath) &&
          row.requestPath !== "Others" &&
          !row.requestPath?.startsWith("/admin"),
      )
      .slice(0, 6)
      .map((row) => ({
        path: row.requestPath || "/",
        visitors: numberValue(row.visitors),
        pageviews: numberValue(row.pageviews),
      })),
    referrers: (referrers ?? [])
      .filter((row) => row.referrerHostname !== "Others")
      .slice(0, 6)
      .map((row) => ({
        label: row.referrerHostname?.trim() || "Direct / none",
        visitors: numberValue(row.visitors),
        pageviews: numberValue(row.pageviews),
      })),
    countries: (countries ?? [])
      .filter((row) => row.country !== "Others")
      .slice(0, 6)
      .map((row) => ({
        code: row.country?.trim() || "Unknown",
        visitors: numberValue(row.visitors),
        pageviews: numberValue(row.pageviews),
      })),
    devices: deviceRows,
    generatedAt: now.toISOString(),
  };
}

const loadCachedAdminTrafficAnalytics = unstable_cache(
  buildAdminTrafficAnalytics,
  ["nbh-admin-traffic-vercel-v1"],
  {
    revalidate: 300,
    tags: ["nbh-admin-traffic-vercel"],
  },
);

export async function loadAdminTrafficAnalytics(): Promise<AdminTrafficAnalyticsData> {
  try {
    return await loadCachedAdminTrafficAnalytics();
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    const needsToken =
      detail === "VERCEL_ANALYTICS_TOKEN_MISSING" ||
      detail.includes("REQUEST_401") ||
      detail.includes("REQUEST_403");

    console.error("[NBH admin Vercel traffic analytics load failed]", error);

    return {
      available: false,
      needsToken,
      error: needsToken
        ? "Vercel Web Analytics is collecting traffic, but this environment cannot read the Analytics API yet."
        : "Website traffic analytics could not be loaded right now.",
    };
  }
}
