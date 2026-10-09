import Link from "next/link";
import { redirect } from "next/navigation";
import AdminReviewDashboard from "@/features/admin/reviews/components/review-dashboard";
import { verifyAdmin } from "../../../lib/admin-auth";
import { loadAdminReviews } from "../../../lib/admin-reviews";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const auth = await verifyAdmin();

  if (!auth.ok) {
    if (auth.reason === "unauthenticated" || auth.reason === "forbidden") {
      redirect("/admin/login?return=/admin/reviews");
    }

    return (
      <main className="admin-access-page">
        <section>
          <p>Nasty Burger House</p>
          <h1>Review moderation setup required.</h1>
          <p>
            Add the Supabase admin environment variables before opening review
            moderation.
          </p>
          <Link href="/">Return to website</Link>
        </section>
      </main>
    );
  }

  const reviews = await loadAdminReviews(auth.admin);

  return (
    <AdminReviewDashboard
      initialReviews={reviews}
    />
  );
}
