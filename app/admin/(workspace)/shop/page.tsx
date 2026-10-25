import { redirect } from "next/navigation";
import AdminShopControl from "@/app/components/admin-shop-control";
import { verifyAdmin } from "@/app/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminShopPage() {
  const auth = await verifyAdmin();
  if (!auth.ok) redirect("/admin/login?return=/admin/shop");

  return (
    <main className="admin-main admin-shop-page" aria-label="Shop settings">
      <AdminShopControl />
    </main>
  );
}
