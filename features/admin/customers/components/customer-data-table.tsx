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

export default function CustomerDataTable({
  data,
}: {
  data: AdminCustomer[];
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useTable({
    features: customerTableFeatures,
    data,
    columns: customerColumns,
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <Card
      className="admin-customer-table-wrap py-0"
      aria-label="Customer directory"
    >
      <Table className="admin-customer-table">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder ? null : (
                    <table.FlexRender header={header} />
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
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
  );
}
