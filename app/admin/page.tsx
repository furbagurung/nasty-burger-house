import Link from "next/link";
import { redirect } from "next/navigation";
import AdminOrderDashboard from "../components/admin-order-dashboard";
import { verifyAdmin } from "../lib/admin-auth";
import { loadAdminOrders } from "../lib/admin-orders";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const auth = await verifyAdmin();

  if (!auth.ok) {
    if (auth.reason === "unauthenticated") {
      redirect("/account/sign-in?return=/admin");
    }

    if (auth.reason === "not-configured") {
      return (
        <main className="admin-access-page">
          <section>
            <p>Nasty Burger House</p>
            <h1>Admin backend setup required.</h1>
            <p>
              Add the Supabase environment variables and apply the customer
              platform migration before opening the order dashboard.
            </p>
            <Link href="/">Return to website</Link>
          </section>
        </main>
      );
    }

    return (
      <main className="admin-access-page">
        <section>
          <p>Nasty Burger House</p>
          <h1>Admin access only.</h1>
          <p>
            This signed-in account is not in the Nasty Burger House admin list.
          </p>
          <div>
            <Link href="/account">Customer account</Link>
            <Link href="/">Return to website</Link>
          </div>
        </section>
      </main>
    );
  }

  const orders = await loadAdminOrders(auth.admin);

  return (
    <AdminOrderDashboard
      initialOrders={orders}
      adminEmail={auth.user.email}
    />
  );
}
