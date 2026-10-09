import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminWorkspaceFooter from "../../components/admin-workspace-footer";
import { AdminWorkspaceHeader } from "../../components/admin-workspace-header";
import { verifyAdmin } from "../../lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminWorkspaceLayout({ children }: { children: ReactNode }) {
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
          <p>Configure Supabase admin access before opening the workspace.</p>
          <Link href="/">Return to website</Link>
        </section>
      </main>
    );
  }

  return (
    <div className="admin-shell admin-modern">
      <AdminWorkspaceHeader adminEmail={auth.user.email} />
      {children}
      <AdminWorkspaceFooter />
    </div>
  );
}
