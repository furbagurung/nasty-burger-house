"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { AdminDesktopSidebar } from "@/components/admin/layout/admin-desktop-sidebar";
import { AdminMobileSidebar } from "@/components/admin/layout/admin-mobile-sidebar";
import { AdminTopbar } from "@/components/admin/layout/admin-topbar";
import { resolveAdminNavigation, type AdminSection } from "@/features/admin/config/navigation";

export type { AdminSection } from "@/features/admin/config/navigation";

/** Stable admin shell controller, preserving sidebar state between routes. */
export function AdminWorkspaceHeader({ title, active, adminEmail, onEnableAlerts, alertsEnabled }: {
  title?: string;
  active?: AdminSection;
  adminEmail?: string;
  onEnableAlerts?: () => void;
  alertsEnabled?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const current = resolveAdminNavigation(pathname);
  const activeSection = active ?? current.activeSection;
  return (
    <>
      <AdminDesktopSidebar active={activeSection} adminEmail={adminEmail} />
      <AdminMobileSidebar active={activeSection} adminEmail={adminEmail} open={mobileOpen} onOpenChange={setMobileOpen} />
      <AdminTopbar pageTitle={title ?? current.pageTitle} groupLabel={current.groupLabel}
        adminEmail={adminEmail} mobileOpen={mobileOpen} onOpenMobile={() => setMobileOpen(true)}
        onEnableAlerts={onEnableAlerts} alertsEnabled={alertsEnabled} />
    </>
  );
}
