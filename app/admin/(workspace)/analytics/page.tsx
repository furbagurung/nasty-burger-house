import { redirect } from "next/navigation";
import TrafficAnalyticsSection from "@/features/admin/analytics/components/traffic-analytics-section";
import { verifyAdmin } from "@/app/lib/admin-auth";
import { loadAdminTrafficAnalytics } from "@/app/lib/admin-traffic-analytics";
import { resolveCustomDays, resolveReportPeriod } from "@/app/lib/admin-report-period";
import { resolveSalesRange } from "@/app/lib/admin-sales-range";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[]; days?: string | string[] }>;
}) {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    redirect("/admin/login?return=/admin/analytics");
  }

  const params = await searchParams;
  const selection = resolveSalesRange(
    resolveReportPeriod(typeof params.range === "string" ? params.range : undefined),
    new Date(),
    resolveCustomDays(typeof params.days === "string" ? params.days : undefined),
  );
  const traffic = await loadAdminTrafficAnalytics(selection);

  return (
    <main className="admin-main admin-analytics-main admin-traffic-main">
      <TrafficAnalyticsSection data={traffic} selection={selection} />
    </main>
  );
}
