"use client";

import type { Column, RowData } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CustomerTableFeatures } from "./customer-data-table-features";

interface CustomerDataTableColumnHeaderProps<
  TData extends RowData,
  TValue,
> {
  column: Column<CustomerTableFeatures, TData, TValue>;
  title: string;
}

export function CustomerDataTableColumnHeader<
  TData extends RowData,
  TValue,
>({
  column,
  title,
}: CustomerDataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <span>{title}</span>;
  }

  const sorted = column.getIsSorted();
  const SortIcon =
    sorted === "asc"
      ? ArrowUp
      : sorted === "desc"
        ? ArrowDown
        : ArrowUpDown;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="admin-customer-sort-header"
      data-sorted={sorted ? "true" : "false"}
      onClick={column.getToggleSortingHandler()}
    >
      <span>{title}</span>
      <SortIcon aria-hidden="true" />
    </Button>
  );
}
