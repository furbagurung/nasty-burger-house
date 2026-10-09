"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, BellRing, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ThemeToggle from "@/app/components/theme-toggle";

export function AdminTopbar({ pageTitle, groupLabel, adminEmail, mobileOpen, onOpenMobile, onEnableAlerts, alertsEnabled }: {
  pageTitle: string;
  groupLabel: string;
  adminEmail?: string;
  mobileOpen: boolean;
  onOpenMobile: () => void;
  onEnableAlerts?: () => void;
  alertsEnabled?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  return (
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
              onClick={onOpenMobile}
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
  );
}
