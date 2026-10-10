"use client";

import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export type AdminPageSize = 10 | 25 | 50;
export const DEFAULT_ADMIN_PAGE_SIZE: AdminPageSize = 25;

export function AdminTablePagination({
  pageIndex,
  pageSize,
  total,
  hasMore = false,
  loading = false,
  onPageChange,
  onPageSizeChange,
}: {
  pageIndex: number;
  pageSize: AdminPageSize;
  total: number;
  hasMore?: boolean;
  loading?: boolean;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: AdminPageSize) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(pageIndex, pageCount - 1);
  const from = total === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min(total, (safePage + 1) * pageSize);
  const nextAvailable = safePage + 1 < pageCount || hasMore;
  const firstPage = Math.max(0, Math.min(safePage - 2, pageCount - 5));
  const pageNumbers = Array.from(
    { length: Math.min(5, pageCount) },
    (_, index) => firstPage + index,
  );

  return (
    <nav className="admin-table-pagination" aria-label="Table pagination">
      <span className="admin-table-pagination-summary" aria-live="polite">
        {total === 0 ? "No results" : `${from}–${to} of ${total}${hasMore ? " loaded" : ""}`}
      </span>
      <div className="admin-table-pagination-controls">
        <span className="admin-table-pagination-size-label">Rows</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => {
            if (value === "10" || value === "25" || value === "50") {
              onPageSizeChange(Number(value) as AdminPageSize);
            }
          }}
          disabled={loading}
        >
          <SelectTrigger className="admin-table-pagination-size" aria-label="Rows per page">
            <SelectValue>{String(pageSize)}</SelectValue>
          </SelectTrigger>
          <SelectContent side="bottom" align="end" alignItemWithTrigger={false}>
            <SelectItem value="10">10 rows</SelectItem>
            <SelectItem value="25">25 rows</SelectItem>
            <SelectItem value="50">50 rows</SelectItem>
          </SelectContent>
        </Select>
        <span className="admin-table-pagination-page">
          Page {safePage + 1}{hasMore ? "" : ` of ${pageCount}`}
        </span>
        <Pagination className="admin-table-pagination-links">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={loading || safePage <= 0}
                tabIndex={loading || safePage <= 0 ? -1 : 0}
                onClick={(event) => {
                  event.preventDefault();
                  if (!loading && safePage > 0) onPageChange(safePage - 1);
                }}
              />
            </PaginationItem>
            {pageNumbers.map((index) => (
              <PaginationItem key={index} className="admin-table-pagination-number">
                <PaginationLink
                  href="#"
                  isActive={index === safePage}
                  aria-label={`Go to page ${index + 1}`}
                  onClick={(event) => {
                    event.preventDefault();
                    if (!loading) onPageChange(index);
                  }}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={loading || !nextAvailable}
                tabIndex={loading || !nextAvailable ? -1 : 0}
                onClick={(event) => {
                  event.preventDefault();
                  if (!loading && nextAvailable) onPageChange(safePage + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </nav>
  );
}
