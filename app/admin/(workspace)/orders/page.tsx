import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyAdmin } from "@/app/lib/admin-auth";
import { loadRestaurantOrderPage } from "@/app/lib/admin-square-order-history";
import RestaurantOrderHistory from "@/features/admin/orders/components/restaurant-order-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminOrderHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string | string[] }>;
}) {
  const auth = await verifyAdmin();
  if (!auth.ok) redirect("/admin/login?return=/admin/orders");

  const params = await searchParams;
  const requestedCustomer =
    typeof params.customer === "string" ? params.customer : "";
  const customerId = /^[A-Za-z0-9_-]{1,128}$/.test(requestedCustomer)
    ? requestedCustomer
    : undefined;

  try {
    const initial = await loadRestaurantOrderPage({ customerId });
    return (
      <RestaurantOrderHistory
        key={customerId || "all"}
        initial={initial}
        customerId={customerId}
      />
    );
  } catch (error) {
    console.error("[NBH admin Square order history failed]", error);
    return (
      <main className="admin-main admin-history-main">
        <Card>
          <CardHeader>
            <CardTitle>Order history unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Could not load Square orders. Check the Square connection and try again.</p>
            <Link href="/admin">Back to dashboard</Link>
          </CardContent>
        </Card>
      </main>
    );
  }
}
