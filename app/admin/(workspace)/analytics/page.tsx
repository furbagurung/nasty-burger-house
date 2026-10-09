import { redirect } from "next/navigation";
import TrafficAnalyticsSection from "@/features/admin/analytics/components/traffic-analytics-section";
import { verifyAdmin } from "@/app/lib/admin-auth";
import { loadAdminTrafficAnalytics } from "@/app/lib/admin-traffic-analytics";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    redirect("/admin/login?return=/admin/analytics");
  }

  const traffic = await loadAdminTrafficAnalytics();

  return (
    <main className="admin-main admin-analytics-main">
      <TrafficAnalyticsSection data={traffic} />
    </main>
  );
}
