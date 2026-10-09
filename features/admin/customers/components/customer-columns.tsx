"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { AdminCustomer } from "@/app/lib/admin-customers";
import { Badge } from "@/components/ui/badge";
import { CustomerDataTableColumnHeader } from "./customer-data-table-column-header";
import type { CustomerTableFeatures } from "./customer-data-table-features";

const STORE_TIME_ZONE = "Australia/Sydney";

function formatDateTime(value: string | null) {
  if (!value) return "Never";

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: STORE_TIME_ZONE,
  }).format(new Date(value));
}

function sourceLabel(customer: AdminCustomer) {
  if (customer.source === "both") return "Website + Square";
  if (customer.source === "square") return "Square";
  return "Website";
}

function sourceClass(customer: AdminCustomer) {
  if (customer.source === "both") return "is-both";
  if (customer.source === "square") return "is-square";
  return "is-website";
}

function customerDripPoints(customer: AdminCustomer) {
  return (
    customer.squareDripPoints ??
    (customer.websiteAccount ? customer.websiteDripPoints : null)
  );
}

function customerLastActivity(customer: AdminCustomer) {
  return customer.websiteAccount
    ? customer.lastSignInAt
    : customer.updatedAt;
}

export const customerColumns: ColumnDef<
  CustomerTableFeatures,
  AdminCustomer
>[] = [
  {
    accessorKey: "name",
    sortFn: "text",
    header: ({ column }) => (
      <CustomerDataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <strong className="admin-customer-name">{row.original.name}</strong>
    ),
  },
  {
    accessorKey: "email",
    sortFn: "text",
    header: ({ column }) => (
      <CustomerDataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) =>
      row.original.email ? (
        <a
          className="admin-customer-contact-link"
          href={`mailto:${row.original.email}`}
        >
          {row.original.email}
        </a>
      ) : (
        <span className="admin-customer-muted">—</span>
      ),
  },
  {
    accessorKey: "phone",
    sortFn: "alphanumeric",
    header: ({ column }) => (
      <CustomerDataTableColumnHeader column={column} title="Phone" />
    ),
    cell: ({ row }) =>
      row.original.phone ? (
        <a
          className="admin-customer-contact-link"
          href={`tel:${row.original.phone}`}
        >
          {row.original.phone}
        </a>
      ) : (
        <span className="admin-customer-muted">—</span>
      ),
  },
  {
    id: "lastActivity",
    accessorFn: (customer) => {
      const value = customerLastActivity(customer);
      return value ? Date.parse(value) : 0;
    },
    sortFn: "basic",
    header: ({ column }) => (
      <CustomerDataTableColumnHeader column={column} title="Last activity" />
    ),
    cell: ({ row }) => {
      const customer = row.original;
      const lastActivity = customerLastActivity(customer);

      return (
        <div className="admin-customer-table-stack">
          <strong>{formatDateTime(lastActivity)}</strong>
          <span>
            {customer.websiteAccount ? "Website sign in" : "Square activity"}
          </span>
        </div>
      );
    },
  },
  {
    id: "dripPoints",
    accessorFn: (customer) => customerDripPoints(customer) ?? -1,
    sortFn: "basic",
    header: ({ column }) => (
      <CustomerDataTableColumnHeader column={column} title="Drip Points" />
    ),
    cell: ({ row }) => {
      const points = customerDripPoints(row.original);

      return (
        <strong className="admin-customer-points">
          {points === null ? "—" : points.toLocaleString("en-AU")}
        </strong>
      );
    },
  },
  {
    id: "source",
    accessorFn: sourceLabel,
    sortFn: "text",
    header: ({ column }) => (
      <CustomerDataTableColumnHeader column={column} title="Source" />
    ),
    cell: ({ row }) => (
      <Badge
        variant="secondary"
        className={`admin-customer-source ${sourceClass(row.original)}`}
      >
        {sourceLabel(row.original)}
      </Badge>
    ),
  },
];
