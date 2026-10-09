import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/** Minimal footer for authenticated admin workspaces only. */
export default function AdminWorkspaceFooter() {
  return (
    <footer className="admin-workspace-footer" aria-label="Admin workspace footer">
      <span>© {new Date().getFullYear()} Nasty Burger House</span>
      <div className="admin-workspace-footer__meta">
        <span>Admin workspace · Australia/Sydney</span>
        <Link href="/" target="_blank" rel="noopener noreferrer">
          View website <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </footer>
  );
}
