"use client";

import { tableFeatures } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { AdminCustomer } from "@/app/lib/admin-customers";
import { Badge } from "@/components/ui/badge";

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

export const customerTableFeatures = tableFeatures({});

export const customerColumns: ColumnDef<
  typeof customerTableFeatures,
  AdminCustomer
>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <strong className="admin-customer-name">{row.original.name}</strong>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
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
    header: "Phone",
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
    header: "Last activity",
    cell: ({ row }) => {
      const customer = row.original;
      const lastActivity = customer.websiteAccount
        ? customer.lastSignInAt
        : customer.updatedAt;

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
    header: "Drip Points",
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
    header: "Source",
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
