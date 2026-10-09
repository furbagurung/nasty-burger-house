"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CircleCheck, ClipboardList, Link2, Search, Users } from "lucide-react";
import type { AdminCustomer } from "@/app/lib/admin-customers";
import { AdminMetricCard } from "@/components/admin/shared/admin-metric-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STORE_TIME_ZONE = "Australia/Sydney";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: STORE_TIME_ZONE,
  }).format(new Date(value));
}

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

type Filter = "all" | "website" | "square" | "both";

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

export default function AdminCustomerDashboard({
  customers,
  squareStatus,
}: {
  customers: AdminCustomer[];
  squareStatus: {
    connected: boolean;
    loyaltyCount: number;
    directoryCount: number | null;
    directoryError: string | null;
    error: string | null;
  };
}) {
  const reducedMotion = useReducedMotion();
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

      <Card
        className={`admin-square-sync ${
          squareStatus.connected ? "is-connected" : "is-warning"
        }`}
        aria-label="Square customer sync status"
      >
        <div>
          <span className="admin-square-sync__dot" aria-hidden="true" />
          <div>
            <strong>
              {squareStatus.connected ? "Square connected" : "Square unavailable"}
            </strong>
            <span>
              {squareStatus.connected
                ? `${squareCount} customer${squareCount === 1 ? "" : "s"} available from Square${bothCount ? ` · ${bothCount} linked to website` : ""}`
                : "Website accounts remain available. Check Square API permissions."}
            </span>
          </div>
        </div>
        {!squareStatus.connected && squareStatus.error && (
          <small>{squareStatus.error}</small>
        )}
        {squareStatus.directoryError && (
          <small>{squareStatus.directoryError}</small>
        )}
      </Card>

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

      <Card className="admin-customer-table-wrap" aria-label="Customer directory">
        <div className="admin-customer-table-head" aria-hidden="true">
          <span>Customer</span>
          <span>Source</span>
          <span>Joined</span>
          <span>Last activity</span>
          <span>Orders</span>
        </div>

        {visibleCustomers.length === 0 ? (
          <div className="admin-empty-state">
            <strong>No customers match this view.</strong>
            <span>Try another search or filter.</span>
          </div>
        ) : (
          <div className="admin-customer-list">
            {visibleCustomers.map((customer, index) => {
              const joinedAt =
                customer.source === "square"
                  ? customer.squareEnrolledAt || customer.createdAt
                  : customer.createdAt;
              const lastActivity = customer.websiteAccount
                ? customer.lastSignInAt
                : customer.updatedAt;

              return (
                <motion.article
                  className="admin-customer-row"
                  key={customer.id}
                  initial={
                    reducedMotion || index > 12 ? false : { opacity: 0, y: 6 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.22,
                    delay: Math.min(index, 12) * 0.018,
                  }}
                >
                  <div className="admin-customer-identity">
                    <Avatar className="admin-customer-avatar" aria-hidden="true">
                      <AvatarFallback>
                        {customer.name.trim().charAt(0).toUpperCase() || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <strong>{customer.name}</strong>
                      {customer.email ? (
                        <a href={`mailto:${customer.email}`}>{customer.email}</a>
                      ) : (
                        <span>No email</span>
                      )}
                      {customer.phone ? (
                        <a href={`tel:${customer.phone}`}>{customer.phone}</a>
                      ) : (
                        <span>No phone</span>
                      )}
                    </div>
                  </div>

                  <div className="admin-customer-cell" data-label="Source">
                    <Badge
                      variant="secondary"
                      className={`admin-customer-source ${sourceClass(customer)}`}
                    >
                      {sourceLabel(customer)}
                    </Badge>
                    {customer.websiteAccount && (
                      <span>
                        {customer.emailConfirmedAt
                          ? "Email verified"
                          : "Email pending"}
                      </span>
                    )}
                  </div>

                  <div className="admin-customer-cell" data-label="Joined">
                    <strong>{formatDate(joinedAt)}</strong>
                  </div>

                  <div className="admin-customer-cell" data-label="Last activity">
                    <strong>{formatDateTime(lastActivity)}</strong>
                    <span>
                      {customer.websiteAccount
                        ? "Website sign in"
                        : "Square activity"}
                    </span>
                  </div>

                  <div className="admin-customer-cell" data-label="Orders">
                    {customer.websiteAccount ? (
                      <>
                        <strong>{customer.orderCount}</strong>
                        {customer.lastOrderAt ? (
                          <span>Last {formatDate(customer.lastOrderAt)}</span>
                        ) : (
                          <span>No website orders</span>
                        )}
                      </>
                    ) : (
                      <>
                        <strong>—</strong>
                        <span>Managed in Square</span>
                      </>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </Card>
    </main>
  );
}
