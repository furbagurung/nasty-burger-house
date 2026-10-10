"use client";

import * as React from "react";
import {
  useTable,
  type SortingState,
} from "@tanstack/react-table";
import type { AdminCustomer } from "@/app/lib/admin-customers";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { customerColumns } from "./customer-columns";
import { customerTableFeatures } from "./customer-data-table-features";
import {
  AdminTablePagination, DEFAULT_ADMIN_PAGE_SIZE,
  type AdminPageSize,
} from "@/components/admin/shared/admin-table-pagination";

export default function CustomerDataTable({
  data,
}: {
  data: AdminCustomer[];
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState<AdminPageSize>(DEFAULT_ADMIN_PAGE_SIZE);

  const table = useTable({
    features: customerTableFeatures,
    data,
    columns: customerColumns,
    getRowId: (row) => row.id,
    onSortingChange: (update) => {
      setSorting(update);
      setPageIndex(0);
    },
    state: {
      sorting,
    },
  });

  const rows = table.getRowModel().rows;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const pageRows = rows.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <div className="admin-customer-table-section">
      <Card
      className="admin-customer-table-wrap py-0"
      aria-label="Customer directory"
    >
      <Table className="admin-customer-table">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sorted = header.column.getIsSorted();

                return (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    scope="col"
                    aria-sort={
                      sorted === "asc"
                        ? "ascending"
                        : sorted === "desc"
                          ? "descending"
                          : "none"
                    }
                    data-sorted={sorted ? "true" : "false"}
                  >
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {pageRows.length > 0 ? (
            pageRows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id} data-column={cell.column.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                className="admin-customer-table-empty"
                colSpan={customerColumns.length}
              >
                <strong>No customers match this view.</strong>
                <span>Try another search or filter.</span>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </Card>
      <AdminTablePagination
        pageIndex={currentPage}
        pageSize={pageSize}
        total={rows.length}
        onPageChange={setPageIndex}
        onPageSizeChange={(next) => {
          setPageSize(next);
          setPageIndex(0);
        }}
      />
    </div>
  );
}
