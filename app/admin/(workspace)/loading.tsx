import { Skeleton } from "@/components/ui/skeleton";

/** The shared layout stays visible while only the new page content streams. */
export default function Loading() {
  return (
    <main className="admin-main admin-loading-main" aria-busy="true" aria-label="Loading admin page">
      <span className="sr-only">Loading admin page</span>
      <div className="admin-loading-content" aria-hidden="true">
        <Skeleton className="admin-loading-content-title" />
        <Skeleton className="admin-loading-content-line" />
        <Skeleton className="admin-loading-content-line admin-loading-content-line--short" />
        <div className="admin-loading-list">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="admin-loading-list-row" />
          ))}
        </div>
      </div>
    </main>
  );
}
