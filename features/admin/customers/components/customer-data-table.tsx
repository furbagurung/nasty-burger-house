"use client";

import { useTable } from "@tanstack/react-table";
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
import { customerColumns, customerTableFeatures } from "./customer-columns";

export default function CustomerDataTable({
  data,
}: {
  data: AdminCustomer[];
}) {
  const table = useTable({
    features: customerTableFeatures,
    data,
    columns: customerColumns,
    getRowId: (row) => row.id,
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
                <TableHead key={header.id}>
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
