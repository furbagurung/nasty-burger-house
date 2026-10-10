import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyAdmin } from "@/app/lib/admin-auth";
import { readMenuAvailability } from "@/app/lib/menu-availability";
import { AdminMenuManagement } from "@/features/admin/menu/components/menu-management";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    if (auth.reason === "unauthenticated" || auth.reason === "forbidden") {
      redirect("/admin/login?return=/admin/menu");
    }
    return (
      <main className="admin-access-page">
        <section>
          <h1>Admin backend setup required.</h1>
          <p>Configure Supabase admin access to manage sold-out items.</p>
          <Link href="/">Return to website</Link>
        </section>
      </main>
    );
  }

  const availability = await readMenuAvailability();
  return (
    <main className="admin-main admin-menu-main" aria-label="Menu availability management">
      <AdminMenuManagement
        initialSoldOutIds={availability.soldOutIds}
        ready={availability.ok}
        reason={availability.reason}
      />
    </main>
  );
}
