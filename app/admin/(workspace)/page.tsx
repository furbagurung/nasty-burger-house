import { redirect } from "next/navigation";
import SalesOverview from "@/features/admin/dashboard/components/sales-overview";
import { verifyAdmin } from "@/app/lib/admin-auth";
import { loadAdminAnalytics } from "@/app/lib/admin-analytics";
import { resolveSalesRange } from "@/app/lib/admin-sales-range";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string | string[];
    from?: string | string[];
    to?: string | string[];
  }>;
}) {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    redirect("/admin/login?return=/admin");
  }

  const params = await searchParams;
  const first = (value: string | string[] | undefined) =>
    typeof value === "string" ? value : undefined;
  const selection = resolveSalesRange({
    range: first(params.range),
    from: first(params.from),
    to: first(params.to),
  });
  const sales = await loadAdminAnalytics(selection);
  return <SalesOverview data={sales} selection={selection} />;
}
