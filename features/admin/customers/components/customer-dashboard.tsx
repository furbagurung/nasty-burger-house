"use client";

import { useMemo, useState } from "react";
import { CircleCheck, ClipboardList, Link2, Search, Users } from "lucide-react";
import type { AdminCustomer } from "@/app/lib/admin-customers";
import { AdminMetricCard } from "@/components/admin/shared/admin-metric-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CustomerDataTable from "./customer-data-table";

type Filter = "all" | "website" | "square" | "both";

export default function AdminCustomerDashboard({
  customers,
}: {
  customers: AdminCustomer[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const websiteCount = customers.filter(
    (customer) => customer.websiteAccount,
  ).length;
  const squareCount = customers.filter((customer) =>
    Boolean(customer.squareCustomerId),
  ).length;
  const bothCount = customers.filter(
    (customer) => customer.source === "both",
  ).length;

  const visibleCustomers = useMemo(() => {
    const search = query.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "website" && customer.websiteAccount) ||
        (filter === "square" && Boolean(customer.squareCustomerId)) ||
        (filter === "both" && customer.source === "both");

      if (!matchesFilter) return false;
      if (!search) return true;

      return [
        customer.name,
        customer.email,
        customer.phone,
        customer.squareCustomerId ?? "",
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search));
    });
  }, [customers, filter, query]);

  return (
    <main className="admin-main admin-customer-main">
      <section className="admin-summary-grid" aria-label="Customer summary">
        <AdminMetricCard
          label="Total customers"
          value={customers.length}
          icon={<Users size={20} />}
          hint="Website and Square records"
          index={0}
        />
        <AdminMetricCard
          label="Website accounts"
          value={websiteCount}
          icon={<ClipboardList size={20} />}
          hint="Signed up on the website"
          index={1}
        />
        <AdminMetricCard
          label="Square customers"
          value={squareCount}
          icon={<CircleCheck size={20} />}
          hint="Available in Square"
          index={2}
        />
        <AdminMetricCard
          label="Linked accounts"
          value={bothCount}
          icon={<Link2 size={20} />}
          hint="Matched across both"
          index={3}
        />
      </section>

      <section
        className="admin-customer-toolbar"
        aria-label="Customer directory controls"
      >
        <div className="admin-customer-toolbar__intro">
          <h2>Customer directory</h2>
          <p>Search and review customer records from the website and Square.</p>
        </div>
        <Label className="admin-customer-search" htmlFor="admin-customer-search">
          <span className="sr-only">Search customers</span>
          <Search size={18} aria-hidden="true" />
          <Input
            id="admin-customer-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email or phone"
            autoComplete="off"
          />
        </Label>
      </section>

      <div className="admin-filter-bar" role="group" aria-label="Customer filters">
        {([
          ["all", `All (${customers.length})`],
          ["website", `Website (${websiteCount})`],
          ["square", `Square (${squareCount})`],
          ["both", `Linked (${bothCount})`],
        ] as Array<[Filter, string]>).map(([value, label]) => (
          <Button
            variant={filter === value ? "default" : "outline"}
            className={filter === value ? "is-active" : ""}
            type="button"
            key={value}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      <CustomerDataTable data={visibleCustomers} />
    </main>
  );
}
