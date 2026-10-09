import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyAdmin } from "@/app/lib/admin-auth";
import { loadDripOverview } from "@/features/admin/drip-points/server";
import { AdminDripOverview } from "@/features/admin/drip-points/components/drip-overview";

export const dynamic = "force-dynamic";

export default async function AdminDripPointsPage() {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    if (auth.reason === "unauthenticated" || auth.reason === "forbidden") {
      redirect("/admin/login?return=/admin/drip-points");
    }
    return (
      <main className="admin-access-page">
        <section>
          <h1>Admin backend setup required.</h1>
          <p>Configure Supabase admin access before viewing Drip Points.</p>
          <Link href="/">Return to website</Link>
        </section>
      </main>
    );
  }

  const overview = await loadDripOverview();
  return (
    <main className="admin-main" aria-label="Drip Points overview">
      <AdminDripOverview data={overview} />
    </main>
  );
}
