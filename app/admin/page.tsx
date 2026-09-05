import Link from "next/link";
import { redirect } from "next/navigation";
import AdminOrderDashboard from "../components/admin-order-dashboard";
import { verifyAdmin } from "../lib/admin-auth";
import { getAdminNotificationConfig } from "../lib/admin-notifications";
import { loadAdminOrders } from "../lib/admin-orders";

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
            platform migration before opening Order Control.
          </p>
          <Link href="/">Return to website</Link>
        </section>
      </main>
    );
  }

  const orders = await loadAdminOrders(auth.admin);
  const notificationConfig = getAdminNotificationConfig();

  return (
    <AdminOrderDashboard
      initialOrders={orders}
      adminEmail={auth.user.email}
      notificationConfig={notificationConfig}
    />
  );
}
