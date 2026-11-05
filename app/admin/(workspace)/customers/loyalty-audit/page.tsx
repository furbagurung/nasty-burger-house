import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyAdmin } from "../../../../lib/admin-auth";
import { loadAdminLoyaltyAudit } from "../../../../lib/admin-loyalty-reconciliation";
import LoyaltyReconciliationView from "@/features/admin/customers/components/loyalty-reconciliation-view";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LoyaltyAuditPage() {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    if (auth.reason === "unauthenticated" || auth.reason === "forbidden") {
      redirect("/admin/login?return=/admin/customers/loyalty-audit");
    }
    return (
      <main className="admin-main p-4">
        <h1>Customer loyalty report unavailable</h1>
        <p>Configure your Supabase admin environment before accessing this report.</p>
        <Link href="/admin/customers">Customers</Link>
      </main>
    );
  }

  const audit = await loadAdminLoyaltyAudit(auth.admin);
  return <LoyaltyReconciliationView audit={audit} />;
}
