"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, BellRing, ClipboardList, ExternalLink, LogOut, MessageSquareText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AdminWorkspaceHeader({
  title, active, adminEmail, onEnableAlerts, alertsEnabled,
}: {
  title: string;
  active: "orders" | "customers" | "reviews";
  adminEmail?: string;
  onEnableAlerts?: () => void;
  alertsEnabled?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.header
      className="admin-modern-header"
      initial={reduceMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <div className="admin-modern-header-inner">
        <div className="admin-modern-brand">
          <div className="admin-modern-brand-mark" aria-hidden="true">N<span>.</span></div>
          <div className="min-w-0">
            <p className="admin-modern-eyebrow">Nasty Burger House <ArrowUpRight size={12} aria-hidden /></p>
            <h1>{title}</h1>
          </div>
        </div>

        <nav className="admin-modern-navigation" aria-label="Admin sections">
          <Link href="/admin" className={active === "orders" ? "is-current" : ""} aria-current={active === "orders" ? "page" : undefined}>
            <ClipboardList size={17} aria-hidden /> Orders
          </Link>
          <Link href="/admin/customers" className={active === "customers" ? "is-current" : ""} aria-current={active === "customers" ? "page" : undefined}>
            <Users size={17} aria-hidden /> Customers
          </Link>
          <Link href="/admin/reviews" className={active === "reviews" ? "is-current" : ""} aria-current={active === "reviews" ? "page" : undefined}>
            <MessageSquareText size={17} aria-hidden /> Reviews
          </Link>
        </nav>

        <div className="admin-modern-header-tools">
          {onEnableAlerts && (
            <Button type="button" size="sm" variant="outline" className="admin-modern-alert-button" onClick={onEnableAlerts}>
              <BellRing size={15} aria-hidden /> {alertsEnabled ? "Alerts on" : "Enable alerts"}
            </Button>
          )}
          <a href="/" className="admin-modern-site-link" target="_blank" rel="noopener noreferrer" aria-label="Open public website in a new tab">
            <ExternalLink size={17} aria-hidden />
          </a>
          <div className="admin-modern-user">
            <Badge variant="secondary" className="admin-modern-user-icon" aria-hidden>{(adminEmail || "A").charAt(0).toUpperCase()}</Badge>
            <span title={adminEmail}>{adminEmail || "Admin"}</span>
          </div>
          <form action="/admin/logout" method="post">
            <Button type="submit" variant="outline" size="sm" className="admin-modern-logout">
              <LogOut size={16} aria-hidden /> <span>Log out</span>
            </Button>
          </form>
        </div>
      </div>
    </motion.header>
  );
}
