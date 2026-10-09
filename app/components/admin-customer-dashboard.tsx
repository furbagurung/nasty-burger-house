"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CircleCheck, ClipboardList, Crown, Search, Users } from "lucide-react";
import { AdminWorkspaceHeader } from "./admin-workspace-header";
import AdminWorkspaceFooter from "./admin-workspace-footer";
import { AdminMetricCard } from "./admin-metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { AdminCustomer } from "../lib/admin-customers";

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

type Filter = "all" | "website" | "square-only" | "both";

function sourceLabel(customer: AdminCustomer) {
  if (customer.source === "both") return "Website + Square";
  if (customer.source === "square") {
    return customer.squareEnrolled ? "Square only" : "Square directory";
  }
  return "Website only";
}

function sourceClass(customer: AdminCustomer) {
  if (customer.source === "both") return "is-both";
  if (customer.source === "square") return "is-square";
  return "is-website";
}

export default function AdminCustomerDashboard({
  customers,
  adminEmail,
  squareStatus,
}: {
  customers: AdminCustomer[];
  adminEmail?: string;
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

  const visibleCustomers = useMemo(() => {
    const search = query.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "website" && customer.websiteAccount) ||
        (filter === "square-only" && customer.source === "square") ||
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

  const websiteCount = customers.filter((customer) => customer.websiteAccount).length;
  const squareCount = customers.filter((customer) => customer.squareEnrolled).length;
  const squareOnlyCount = customers.filter((customer) => customer.source === "square").length;
  const bothCount = customers.filter((customer) => customer.source === "both").length;

  return (
    <div className="admin-shell admin-modern admin-customer-shell">
      <AdminWorkspaceHeader title="Customers" active="customers" adminEmail={adminEmail} />

      <main className="admin-main admin-customer-main">
        <section className="admin-summary-grid" aria-label="Customer summary">
          <AdminMetricCard label="Total customers" value={customers.length} icon={<Users size={20} />} hint="Across website and Square" index={0} />
          <AdminMetricCard label="Website accounts" value={websiteCount} icon={<ClipboardList size={20} />} hint="Registered website members" index={1} />
          <AdminMetricCard label="Square enrolled" value={squareCount} icon={<Crown size={20} />} hint="Enrolled in Drip Points" index={2} />
          <AdminMetricCard label="Square only" value={squareOnlyCount} icon={<CircleCheck size={20} />} hint="No website account yet" index={3} />
        </section>

        <section className="admin-customer-toolbar" aria-label="Customer directory controls">
          <div className="admin-customer-toolbar__intro">
            <h2>Customer directory</h2>
            <p>Website accounts and Square loyalty members.</p>
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
          className={`admin-square-sync ${squareStatus.connected ? "is-connected" : "is-warning"}`}
          aria-label="Square customer sync status"
        >
          <div>
            <span className="admin-square-sync__dot" aria-hidden="true" />
            <div>
              <strong>
                {squareStatus.connected
                  ? "Square connected"
                  : "Square unavailable"}
              </strong>
              <span>
                {squareStatus.connected
                  ? `${squareStatus.loyaltyCount} loyalty accounts · ${squareStatus.directoryCount === null ? "Directory unavailable" : `${squareStatus.directoryCount} in directory`} · ${bothCount} matched`
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
            ["square-only", `Square only (${squareOnlyCount})`],
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
            <span>Drip Points</span>
          </div>

          {visibleCustomers.length === 0 ? (
            <div className="admin-empty-state">
              <strong>No customers match this view.</strong>
              <span>Try another search or filter.</span>
            </div>
          ) : (
            <div className="admin-customer-list">
              {visibleCustomers.map((customer, index) => {
                const points = customer.squareDripPoints ?? customer.websiteDripPoints;
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
                    initial={reducedMotion || index > 12 ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: Math.min(index, 12) * 0.018 }}
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
                      <Badge variant="secondary" className={`admin-customer-source ${sourceClass(customer)}`}>
                        {sourceLabel(customer)}
                      </Badge>
                      {customer.websiteAccount && (
                        <span>
                          {customer.emailConfirmedAt ? "Email verified" : "Email pending"}
                        </span>
                      )}
                    </div>

                    <div className="admin-customer-cell" data-label="Joined">
                      <strong>{formatDate(joinedAt)}</strong>
                      {customer.squareEnrolledAt && customer.websiteAccount && (
                        <span>Square {formatDate(customer.squareEnrolledAt)}</span>
                      )}
                    </div>

                    <div className="admin-customer-cell" data-label="Last activity">
                      <strong>{formatDateTime(lastActivity)}</strong>
                      {customer.websiteAccount ? (
                        <span>Website sign in</span>
                      ) : (
                        <span>Square activity</span>
                      )}
                    </div>

                    <div className="admin-customer-cell" data-label="Orders">
                      <strong>{customer.orderCount}</strong>
                      {customer.lastOrderAt ? (
                        <span>Last {formatDate(customer.lastOrderAt)}</span>
                      ) : (
                        <span>{customer.websiteAccount ? "Website orders" : "Website only"}</span>
                      )}
                    </div>

                    <div className="admin-customer-cell" data-label="Drip Points">
                      <strong>
                        {customer.squareDripPoints !== null || customer.websiteAccount
                          ? points.toLocaleString("en-AU")
                          : "—"}
                      </strong>
                      <span>
                        {customer.squareDripPoints !== null
                          ? `Square${
                              customer.squareLifetimePoints !== null
                                ? ` · ${customer.squareLifetimePoints.toLocaleString("en-AU")} lifetime`
                                : ""
                            }`
                          : customer.squareCustomerId
                            ? customer.websiteAccount
                              ? "Website ledger · Square loyalty not enrolled"
                              : "Square loyalty not enrolled"
                            : "Website ledger"}
                      </span>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </Card>
      </main>
      <AdminWorkspaceFooter />
    </div>
  );
}
