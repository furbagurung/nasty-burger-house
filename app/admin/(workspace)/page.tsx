import { redirect } from "next/navigation";
import SalesOverview from "@/features/admin/dashboard/components/sales-overview";
import { verifyAdmin } from "@/app/lib/admin-auth";
import { loadAdminAnalytics } from "@/app/lib/admin-analytics";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    redirect("/admin/login?return=/admin");
  }

  const sales = await loadAdminAnalytics();
  return <SalesOverview data={sales} />;
}
