import Link from "next/link";
import { redirect } from "next/navigation";
import AdminCustomerDashboard from "../../components/admin-customer-dashboard";
import { verifyAdmin } from "../../lib/admin-auth";
import { loadAdminCustomers } from "../../lib/admin-customers";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const auth = await verifyAdmin();

  if (!auth.ok) {
    if (auth.reason === "unauthenticated" || auth.reason === "forbidden") {
      redirect("/admin/login?return=/admin/customers");
    }

    return (
      <main className="admin-access-page">
        <section>
          <p>Nasty Burger House</p>
          <h1>Customer portal setup required.</h1>
          <p>
            Add the Supabase admin environment variables before opening the
            customer account portal.
          </p>
          <Link href="/">Return to website</Link>
        </section>
      </main>
    );
  }

  const portal = await loadAdminCustomers(auth.admin);

  return (
    <AdminCustomerDashboard
      customers={portal.customers}
      squareStatus={portal.square}
      adminEmail={auth.user.email}
    />
  );
}
