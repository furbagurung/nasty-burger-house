"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
  if (customer.source === "square") return "Square only";
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
    error: string | null;
  };
}) {
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
    <div className="admin-shell admin-customer-shell">
      <header className="admin-header">
        <div>
          <p>Nasty Burger House</p>
          <h1>Customer Portal</h1>
        </div>
        <div className="admin-header__actions">
          <span>{adminEmail ?? "Admin"}</span>
          <Link href="/admin">Orders</Link>
          <Link href="/">View site</Link>
          <form action="/admin/logout" method="post">
            <button type="submit">Log out</button>
          </form>
        </div>
      </header>

      <main className="admin-main admin-customer-main">
        <section className="admin-summary-grid" aria-label="Customer summary">
          <article>
            <span>Total customers</span>
            <strong>{customers.length}</strong>
          </article>
          <article>
            <span>Website accounts</span>
            <strong>{websiteCount}</strong>
          </article>
          <article>
            <span>Square enrolled</span>
            <strong>{squareCount}</strong>
          </article>
          <article>
            <span>Square only</span>
            <strong>{squareOnlyCount}</strong>
          </article>
        </section>

        <section className="admin-customer-toolbar">
          <div>
            <p>Customer directory</p>
            <h2>Website accounts + Square loyalty</h2>
            <span>
              Website customers are matched with Square loyalty customers by phone first,
              then email. Square-only customers have enrolled in the POS loyalty program but
              have not created a website account yet.
            </span>
          </div>
          <label className="admin-customer-search">
            <span>Search</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, email or phone"
              autoComplete="off"
            />
          </label>
        </section>

        <section
          className={`admin-square-sync ${squareStatus.connected ? "is-connected" : "is-warning"}`}
          aria-label="Square customer sync status"
        >
          <div>
            <span className="admin-square-sync__dot" aria-hidden="true" />
            <div>
              <strong>
                {squareStatus.connected
                  ? `Square connected · ${squareStatus.loyaltyCount} loyalty accounts loaded`
                  : "Square loyalty data unavailable"}
              </strong>
              <span>
                {squareStatus.connected
                  ? `${bothCount} matched to website accounts · ${squareOnlyCount} Square-only`
                  : "Website accounts are still shown. Check that the Square token has LOYALTY_READ and CUSTOMERS_READ permissions."}
              </span>
            </div>
          </div>
          {!squareStatus.connected && squareStatus.error && (
            <small>{squareStatus.error}</small>
          )}
        </section>

        <div className="admin-filter-bar" role="tablist" aria-label="Customer filters">
          {([
            ["all", `All customers (${customers.length})`],
            ["website", `Website accounts (${websiteCount})`],
            ["square-only", `Square only (${squareOnlyCount})`],
            ["both", `Website + Square (${bothCount})`],
          ] as Array<[Filter, string]>).map(([value, label]) => (
            <button
              className={filter === value ? "is-active" : ""}
              type="button"
              key={value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <section className="admin-customer-table-wrap" aria-label="Customer directory">
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
              {visibleCustomers.map((customer) => {
                const points = customer.squareDripPoints ?? customer.websiteDripPoints;
                const joinedAt =
                  customer.source === "square"
                    ? customer.squareEnrolledAt || customer.createdAt
                    : customer.createdAt;
                const lastActivity = customer.websiteAccount
                  ? customer.lastSignInAt
                  : customer.updatedAt;

                return (
                  <article className="admin-customer-row" key={customer.id}>
                    <div className="admin-customer-identity">
                      <span className="admin-customer-avatar" aria-hidden="true">
                        {customer.name.trim().charAt(0).toUpperCase() || "C"}
                      </span>
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
                      <span className={`admin-customer-source ${sourceClass(customer)}`}>
                        {sourceLabel(customer)}
                      </span>
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
                      <strong>{points.toLocaleString("en-AU")}</strong>
                      <span>
                        {customer.squareDripPoints !== null
                          ? `Square${
                              customer.squareLifetimePoints !== null
                                ? ` · ${customer.squareLifetimePoints.toLocaleString("en-AU")} lifetime`
                                : ""
                            }`
                          : "Website ledger"}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
