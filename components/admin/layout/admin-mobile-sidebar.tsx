"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { navigationGroups, type AdminSection } from "@/features/admin/config/navigation";

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


export function AdminMobileSidebar({ open, onOpenChange, adminEmail, active }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminEmail?: string;
  active: AdminSection;
}) {
  const onClose = () => onOpenChange(false);
  return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          id="admin-jobtracker-mobile-drawer"
          side="left"
          className="admin-jobtracker-mobile-drawer"
          aria-label="Admin navigation"
        >
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <SidebarContent
            active={active}
            adminEmail={adminEmail}
            onNavigate={onClose}
          />
        </SheetContent>
      </Sheet>
  );
}
