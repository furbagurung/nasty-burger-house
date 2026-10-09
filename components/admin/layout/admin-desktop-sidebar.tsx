"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MacOSSidebar } from "@/components/macos-sidebar";
import { sections, type AdminSection } from "@/features/admin/config/navigation";

export function AdminDesktopSidebar({ active, adminEmail }: { active: AdminSection; adminEmail?: string }) {
  return (
      <MacOSSidebar
        className="admin-jobtracker-sidebar"
        navigationItems={sections.map(({ label, href, group, icon: Icon }) => ({
          label,
          href,
          group,
          icon: <Icon size={19} aria-hidden="true" />,
        }))}
        activeHref={sections.find((section) => section.id === active)?.href}
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
  );
}
