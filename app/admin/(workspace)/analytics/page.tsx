import { redirect } from "next/navigation";
import TrafficAnalyticsSection from "@/features/admin/analytics/components/traffic-analytics-section";
import { verifyAdmin } from "@/app/lib/admin-auth";
import { loadAdminTrafficAnalytics } from "@/app/lib/admin-traffic-analytics";
import { resolveReportPeriod } from "@/app/lib/admin-report-period";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    redirect("/admin/login?return=/admin/analytics");
  }

  const params = await searchParams;
  const period = resolveReportPeriod(
    typeof params.range === "string" ? params.range : undefined,
  );
  const traffic = await loadAdminTrafficAnalytics(period);

  return (
    <main className="admin-main admin-analytics-main admin-traffic-main">
      <TrafficAnalyticsSection data={traffic} period={period} />
    </main>
  );
}
