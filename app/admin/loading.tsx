import AdminWorkspaceFooter from "../components/admin-workspace-footer";
import { Skeleton } from "@/components/ui/skeleton";

/** Lightweight route-level skeleton during server-side auth/data loading.
 * Uses existing shadcn skeleton primitives; no dummy figures or API calls. */
export default function Loading() {
  return (
    <div className="admin-shell admin-modern admin-loading-shell" aria-busy="true">
      <aside className="admin-jobtracker-sidebar admin-loading-sidebar" aria-hidden="true">
        <div className="admin-loading-sidebar__brand">
          <Skeleton className="admin-loading-logo" />
          <div>
            <Skeleton className="admin-loading-brand-title" />
            <Skeleton className="admin-loading-brand-subtitle" />
          </div>
        </div>
        <div className="admin-loading-sidebar__links">
          <Skeleton className="admin-loading-label" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="admin-loading-nav-row" />
          ))}
          <Skeleton className="admin-loading-label" />
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="admin-loading-nav-row" />
          ))}
          <Skeleton className="admin-loading-label" />
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="admin-loading-nav-row" />
          ))}
        </div>
      </aside>
      <div className="admin-modern-header admin-jobtracker-topbar admin-loading-header" aria-hidden="true">
        <div className="admin-jobtracker-topbar-inner">
          <Skeleton className="admin-loading-heading" />
          <Skeleton className="admin-loading-toolbar" />
        </div>
      </div>
      <main className="admin-main admin-loading-main" aria-label="Loading admin workspace">
        <span className="sr-only">Loading admin workspace</span>
        <div className="admin-loading-content" aria-hidden="true">
          <Skeleton className="admin-loading-content-title" />
          <Skeleton className="admin-loading-content-line" />
          <Skeleton className="admin-loading-content-line admin-loading-content-line--short" />
          <div className="admin-loading-list">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="admin-loading-list-row" />
            ))}
          </div>
        </div>
      </main>
      <AdminWorkspaceFooter />
    </div>
  );
}
