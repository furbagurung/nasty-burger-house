import { redirect } from "next/navigation";
import AnalyticsDashboard from "@/features/admin/analytics/components/analytics-dashboard";
import { verifyAdmin } from "../../../lib/admin-auth";
import { loadAdminAnalytics } from "../../../lib/admin-analytics";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const auth = await verifyAdmin();

  if (!auth.ok) {
    redirect(
      `/admin/login?return=${encodeURIComponent("/admin/analytics")}`,
    );
  }

  const analytics = await loadAdminAnalytics();

  return <AnalyticsDashboard data={analytics} />;
}
