"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  BellRing,
  ExternalLink,
  LogOut,
  Menu,
  MessageSquareText,
  Users,
  LayoutDashboard,
  BarChart3,
  UtensilsCrossed,
  Coins,
  Megaphone,
  FileText,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { MacOSSidebar } from "@/components/macos-sidebar";
import ThemeToggle from "./theme-toggle";

/**
 * Nasty Burger House adaptation of Watermelon UI's Jobtracker dashboard
 * AppSidebar + TopNavbar. Uses our existing shadcn primitives, real admin
 * routes and server-side session/logout instead of template demo data.
 */
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

const navigationGroups = [
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

const sections = navigationGroups.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.label })),
);

function WorkspaceNavigation({
  active,
  onNavigate,
}: {
  active: AdminSection;
  onNavigate?: () => void;
}) {
  return (
    <nav className="admin-jobtracker-navigation" aria-label="Admin sections">
      {navigationGroups.map((group) => (
        <div className="admin-jobtracker-nav-group" key={group.label}>
          <p className="admin-jobtracker-nav-label">{group.label}</p>
          {group.items.map(({ id, label, href, icon: Icon }) => (
            <Link
              key={id}
              href={href}
              onClick={onNavigate}
              className={`admin-jobtracker-nav-link${active === id ? " is-current" : ""}`}
              aria-current={active === id ? "page" : undefined}
            >
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
              {active === id && <span className="admin-jobtracker-nav-indicator" aria-hidden="true" />}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

function SidebarContent({
  active,
  adminEmail,
  onNavigate,
}: {
  active: AdminSection;
  adminEmail?: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="admin-jobtracker-sidebar-brand">
        <Link href="/admin" className="admin-jobtracker-brand-link" onClick={onNavigate}>
          <span className="admin-jobtracker-brand-mark" aria-hidden="true"><Image src="/logo.webp" alt="" width={72} height={72} className="admin-jobtracker-brand-logo" /></span>
          <span className="admin-jobtracker-brand-copy">
            <strong>NASTY BURGER HOUSE</strong>
            <small>Admin workspace</small>
          </span>
        </Link>
      </div>

      <WorkspaceNavigation active={active} onNavigate={onNavigate} />

      <div className="admin-jobtracker-sidebar-bottom">
        <p className="admin-jobtracker-nav-label">Quick links</p>
        <a className="admin-jobtracker-nav-link" href="/" target="_blank" rel="noopener noreferrer">
          <ExternalLink size={18} aria-hidden="true" /> <span>View website</span>
        </a>
        <form action="/admin/logout" method="post">
          <Button className="admin-jobtracker-nav-logout" variant="ghost" type="submit">
            <LogOut size={18} aria-hidden="true" /> Log out
          </Button>
        </form>
        <div className="admin-jobtracker-sidebar-profile">
          <Avatar className="admin-jobtracker-profile-avatar" aria-hidden="true">
            <AvatarFallback>{(adminEmail || "A").charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span title={adminEmail}>
            <strong>Administrator</strong>
            <small>{adminEmail || "Admin"}</small>
          </span>
        </div>
      </div>
    </>
  );
}

export function AdminWorkspaceHeader({
  title,
  active,
  adminEmail,
  onEnableAlerts,
  alertsEnabled,
}: {
  title?: string;
  active?: AdminSection;
  adminEmail?: string;
  onEnableAlerts?: () => void;
  alertsEnabled?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const matched = sections.find((section) => section.href === pathname);
  const activeSection: AdminSection = active ?? matched?.id ?? "dashboard";
  const pageTitle = title ?? matched?.label ?? "Dashboard";
  const groupLabel = navigationGroups.find((group) =>
    group.items.some((item) => item.id === activeSection),
  )?.label ?? "Overview";
  return (
    <>
      <MacOSSidebar
        className="admin-jobtracker-sidebar"
        navigationItems={sections.map(({ label, href, group, icon: Icon }) => ({
          label,
          href,
          group,
          icon: <Icon size={19} aria-hidden="true" />,
        }))}
        activeHref={sections.find((section) => section.id === activeSection)?.href}
        header={
          <div className="admin-jobtracker-sidebar-brand">
            <Link href="/admin" className="admin-jobtracker-brand-link" title="Nasty Burger House admin home">
              <span className="admin-jobtracker-brand-mark" aria-hidden="true"><Image src="/logo.webp" alt="" width={72} height={72} className="admin-jobtracker-brand-logo" /></span>
              <span className="admin-jobtracker-brand-copy">
                <strong>NASTY BURGER HOUSE</strong>
                <small>Admin workspace</small>
              </span>
            </Link>
          </div>
        }
        footer={
          <div className="admin-jobtracker-sidebar-bottom">
            <p className="admin-jobtracker-nav-label">Quick links</p>
            <a className="admin-jobtracker-nav-link" href="/" target="_blank" rel="noopener noreferrer" title="View website" aria-label="View website">
              <ExternalLink size={18} aria-hidden="true" />
              <span>View website</span>
            </a>
            <form action="/admin/logout" method="post">
              <Button className="admin-jobtracker-nav-logout" variant="ghost" type="submit" title="Log out" aria-label="Log out">
                <LogOut size={18} aria-hidden="true" />
                <span>Log out</span>
              </Button>
            </form>
            <div className="admin-jobtracker-sidebar-profile">
              <Avatar className="admin-jobtracker-profile-avatar" aria-hidden="true">
                <AvatarFallback>{(adminEmail || "A").charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span title={adminEmail}>
                <strong>Administrator</strong>
                <small>{adminEmail || "Admin"}</small>
              </span>
            </div>
          </div>
        }
      />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          id="admin-jobtracker-mobile-drawer"
          side="left"
          className="admin-jobtracker-mobile-drawer"
          aria-label="Admin navigation"
        >
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <SidebarContent
            active={activeSection}
            adminEmail={adminEmail}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <motion.header
        className="admin-modern-header admin-jobtracker-topbar"
        initial={reduceMotion ? false : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <div className="admin-jobtracker-topbar-inner">
          <div className="admin-jobtracker-topbar-title">
            <Button
              type="button"
              variant="ghost"
              className="admin-jobtracker-menu-button"
              aria-label="Open admin navigation"
              aria-controls="admin-jobtracker-mobile-drawer"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={21} aria-hidden="true" />
            </Button>
            <div className="admin-jobtracker-page-identity">
              <p>{groupLabel} <span aria-hidden="true">/</span> {pageTitle}</p>
              <h1>{pageTitle}</h1>
            </div>
          </div>

          <div className="admin-jobtracker-topbar-tools">
            <ThemeToggle className="nb-theme-toggle--admin" />
            {onEnableAlerts && (
              <Button
                type="button"
                variant="outline"
                className="admin-jobtracker-alert-button"
                onClick={onEnableAlerts}
              >
                <BellRing size={17} aria-hidden="true" />
                <span>{alertsEnabled ? "Alerts on" : "Enable alerts"}</span>
              </Button>
            )}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-jobtracker-site-button"
              aria-label="Open public website in a new tab"
            >
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <div className="admin-jobtracker-topbar-user" title={adminEmail || "Admin"}>
              <Avatar className="admin-jobtracker-profile-avatar" aria-hidden="true">
                <AvatarFallback>{(adminEmail || "A").charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span>{adminEmail || "Admin"}</span>
            </div>
          </div>
        </div>
      </motion.header>
    </>
  );
}
