import { redirect } from "next/navigation";
import AdminLoginPage from "../../components/admin-login-page";
import { verifyAdmin } from "../../lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  const auth = await verifyAdmin();
  if (auth.ok) redirect("/admin");

  return <AdminLoginPage />;
}
