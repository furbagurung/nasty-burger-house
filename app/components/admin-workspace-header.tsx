"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  BellRing,
  ClipboardList,
  ExternalLink,
  LogOut,
  Menu,
  MessageSquareText,
  X,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Nasty Burger House adaptation of Watermelon UI's Jobtracker dashboard
 * AppSidebar + TopNavbar. Uses our existing shadcn primitives, real admin
 * routes and server-side session/logout instead of template demo data.
 */
type AdminSection = "orders" | "customers" | "reviews";

const sections = [
  { id: "orders" as const, label: "Orders", href: "/admin", icon: ClipboardList },
  { id: "customers" as const, label: "Customers", href: "/admin/customers", icon: Users },
  { id: "reviews" as const, label: "Reviews", href: "/admin/reviews", icon: MessageSquareText },
];

function WorkspaceNavigation({
  active,
  onNavigate,
}: {
  active: AdminSection;
  onNavigate?: () => void;
}) {
  return (
    <nav className="admin-jobtracker-navigation" aria-label="Admin sections">
      <p className="admin-jobtracker-nav-label">Workspace</p>
      {sections.map(({ id, label, href, icon: Icon }) => (
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
          <span className="admin-jobtracker-brand-mark" aria-hidden="true">N<span>.</span></span>
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
          <Badge variant="secondary" className="admin-jobtracker-profile-avatar" aria-hidden="true">
            {(adminEmail || "A").charAt(0).toUpperCase()}
          </Badge>
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
  title: string;
  active: AdminSection;
  adminEmail?: string;
  onEnableAlerts?: () => void;
  alertsEnabled?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }

      // Keep keyboard focus within the open mobile navigation drawer.
      if (event.key === "Tab") {
        const drawer = document.getElementById("admin-jobtracker-mobile-drawer");
        if (!drawer) return;
        const focusable = Array.from(
          drawer.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeydown);
      menuButtonRef.current?.focus();
    };
  }, [mobileOpen]);

  return (
    <>
      <aside className="admin-jobtracker-sidebar" aria-label="Admin workspace sidebar">
        <SidebarContent active={active} adminEmail={adminEmail} />
      </aside>

      {mobileOpen && (
        <div className="admin-jobtracker-drawer-root">
          <button
            type="button"
            className="admin-jobtracker-drawer-backdrop"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            tabIndex={-1}
          />
          <aside
            id="admin-jobtracker-mobile-drawer"
            className="admin-jobtracker-mobile-drawer"
            role="dialog"
            aria-label="Admin navigation"
            aria-modal="true"
          >
            <Button
              ref={closeButtonRef}
              type="button"
              variant="ghost"
              className="admin-jobtracker-drawer-close"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            >
              <X size={19} aria-hidden="true" />
            </Button>
            <SidebarContent
              active={active}
              adminEmail={adminEmail}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <motion.header
        className="admin-modern-header admin-jobtracker-topbar"
        initial={reduceMotion ? false : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <div className="admin-jobtracker-topbar-inner">
          <div className="admin-jobtracker-topbar-title">
            <Button
              ref={menuButtonRef}
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
              <p>Workspace <span aria-hidden="true">/</span> {title}</p>
              <h1>{title}</h1>
            </div>
          </div>

          <div className="admin-jobtracker-topbar-tools">
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
              <Badge variant="secondary" className="admin-jobtracker-profile-avatar" aria-hidden="true">
                {(adminEmail || "A").charAt(0).toUpperCase()}
              </Badge>
              <span>{adminEmail || "Admin"}</span>
            </div>
          </div>
        </div>
      </motion.header>
    </>
  );
}
