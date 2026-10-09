import { notFound, redirect } from "next/navigation";
import { verifyAdmin } from "../../../lib/admin-auth";

export const dynamic = "force-dynamic";

/** Real modules can replace these content-only routes without remounting
 * the persistent admin sidebar, header or footer. */
const plannedModules: Record<string, { title: string; description: string; phase: string }> = {
  analytics: {
    title: "Analytics",
    description: "Traffic, orders and customer insights will appear here when verified reporting sources are connected.",
    phase: "Overview",
  },
  menu: {
    title: "Menu",
    description: "Menu items, categories, pricing and item availability management are planned for this section.",
    phase: "Business",
  },
  "drip-points": {
    title: "Drip Points",
    description: "Loyalty balances, earning rules and adjustments will be available after secure permissions and data validation are ready.",
    phase: "Business",
  },
  promotions: {
    title: "Promotions",
    description: "Promotional offers, campaign scheduling and featured banners are planned for this section.",
    phase: "Business",
  },
  reports: {
    title: "Reports",
    description: "Verified operational reports and export tools will be added when the underlying data is ready.",
    phase: "Management",
  },
  settings: {
    title: "Settings",
    description: "Business settings and integration controls will be added here with appropriate access checks.",
    phase: "Management",
  },
  "team-access": {
    title: "Team & Access",
    description: "Team invitations, role controls and audit history are planned. No staff accounts can be managed from this page yet.",
    phase: "Management",
  },
};


export default async function PlannedAdminSection({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const module = Object.hasOwn(plannedModules, section) ? plannedModules[section] : undefined;
  if (!module) notFound();

  const auth = await verifyAdmin();
  if (!auth.ok) {
    redirect(`/admin/login?return=${encodeURIComponent(`/admin/${section}`)}`);
  }

  return (
    <main className="admin-main admin-planned-page" aria-label={`${module.title} management`}>
      <section className="admin-planned-page__body" aria-labelledby="admin-planned-heading">
        <p className="admin-planned-page__eyebrow">{module.phase} / Planned module</p>
        <h2 id="admin-planned-heading">{module.title}</h2>
        <p>{module.description}</p>
        <p className="admin-planned-page__note">
          This page is reserved for future development. No data or actions are currently available.
        </p>
      </section>
    </main>
  );
}
