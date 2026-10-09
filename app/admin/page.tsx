import Link from "next/link";
import { redirect } from "next/navigation";
import AdminWorkspaceFooter from "../components/admin-workspace-footer";
import { AdminWorkspaceHeader } from "../components/admin-workspace-header";
import { verifyAdmin } from "../lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const auth = await verifyAdmin();

  if (!auth.ok) {
    if (auth.reason === "unauthenticated" || auth.reason === "forbidden") {
      redirect("/admin/login?return=/admin");
    }

    return (
      <main className="admin-access-page">
        <section>
          <p>Nasty Burger House</p>
          <h1>Admin backend setup required.</h1>
          <p>
            Add the Supabase environment variables and apply the customer
            platform migration before using the admin workspace.
          </p>
          <Link href="/">Return to website</Link>
        </section>
      </main>
    );
  }

  return (
    <div className="admin-shell admin-modern">
      <AdminWorkspaceHeader title="Dashboard" active="dashboard" adminEmail={auth.user.email} />
      <main className="admin-main" aria-label="Admin dashboard" />
      <AdminWorkspaceFooter />
    </div>
  );
}
