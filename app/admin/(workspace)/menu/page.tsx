import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyAdmin } from "@/app/lib/admin-auth";
import { loadMenuManagement } from "@/features/admin/menu/server";
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
          <p>Configure Supabase admin access to manage menu drafts.</p>
          <Link href="/">Return to website</Link>
        </section>
      </main>
    );
  }

  const catalogue = await loadMenuManagement(auth.admin);
  return (
    <main className="admin-main" aria-label="Menu management">
      <AdminMenuManagement initialProducts={catalogue.products} storage={catalogue.storage} />
    </main>
  );
}
