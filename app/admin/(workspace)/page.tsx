import { redirect } from "next/navigation";
import SalesOverview from "@/features/admin/dashboard/components/sales-overview";
import { verifyAdmin } from "@/app/lib/admin-auth";
import { loadAdminAnalytics } from "@/app/lib/admin-analytics";
import { resolveSalesRange } from "@/app/lib/admin-sales-range";
import { resolveCustomDays, resolveReportPeriod } from "@/app/lib/admin-report-period";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[]; days?: string | string[] }>;
}) {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    redirect("/admin/login?return=/admin");
  }

  const params = await searchParams;
  const first = (value: string | string[] | undefined) =>
    typeof value === "string" ? value : undefined;
  const selection = resolveSalesRange(resolveReportPeriod(first(params.range)), new Date(), resolveCustomDays(first(params.days)));
  const sales = await loadAdminAnalytics(selection);
  return <SalesOverview data={sales} selection={selection} />;
}
