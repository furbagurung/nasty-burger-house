import { LayoutDashboard, BarChart3, Users, MessageSquareText, UtensilsCrossed, Coins, Megaphone, FileText, Settings, ShieldCheck } from "lucide-react";

export type AdminSection =
  | "dashboard"
  | "analytics"
  | "customers"
  | "reviews"
  | "menu"
  | "drip-points"
  | "promotions"
  | "reports"
  | "settings"
  | "team-access"
  | "orders";

export const navigationGroups = [
  {
    label: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { id: "analytics", label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { id: "customers", label: "Customers", href: "/admin/customers", icon: Users },
      { id: "reviews", label: "Reviews", href: "/admin/reviews", icon: MessageSquareText },
    ],
  },
  {
    label: "Business",
    items: [
      { id: "menu", label: "Menu", href: "/admin/menu", icon: UtensilsCrossed },
      { id: "drip-points", label: "Drip Points", href: "/admin/drip-points", icon: Coins },
      { id: "promotions", label: "Promotions", href: "/admin/promotions", icon: Megaphone },
    ],
  },
  {
    label: "Management",
    items: [
      { id: "reports", label: "Reports", href: "/admin/reports", icon: FileText },
      { id: "settings", label: "Settings", href: "/admin/settings", icon: Settings },
      { id: "team-access", label: "Team & Access", href: "/admin/team-access", icon: ShieldCheck },
    ],
  },
] as const;

export const sections = navigationGroups.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.label })),
);


export function resolveAdminNavigation(pathname: string) {
  const matched = sections.find((item) => item.href === pathname);
  const activeSection: AdminSection = matched?.id ?? "dashboard";
  const pageTitle = matched?.label ?? "Dashboard";
  const groupLabel = navigationGroups.find((group) => group.items.some((item) => item.id === activeSection))?.label ?? "Overview";
  return { activeSection, pageTitle, groupLabel };
}
