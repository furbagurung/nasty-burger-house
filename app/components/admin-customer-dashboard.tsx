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

type Filter = "all" | "verified" | "unverified" | "signed-in";

export default function AdminCustomerDashboard({
  customers,
  adminEmail,
}: {
  customers: AdminCustomer[];
  adminEmail?: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const visibleCustomers = useMemo(() => {
    const search = query.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "verified" && Boolean(customer.emailConfirmedAt)) ||
        (filter === "unverified" && !customer.emailConfirmedAt) ||
        (filter === "signed-in" && Boolean(customer.lastSignInAt));

      if (!matchesFilter) return false;
      if (!search) return true;

      return [customer.name, customer.email, customer.phone]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search));
    });
  }, [customers, filter, query]);

  const verifiedCount = customers.filter((customer) => customer.emailConfirmedAt).length;
  const signedInCount = customers.filter((customer) => customer.lastSignInAt).length;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const newThisMonth = customers.filter(
    (customer) => new Date(customer.createdAt).getTime() >= monthStart,
  ).length;

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
          <article><span>Website accounts</span><strong>{customers.length}</strong></article>
          <article><span>Email verified</span><strong>{verifiedCount}</strong></article>
          <article><span>Signed in before</span><strong>{signedInCount}</strong></article>
          <article><span>New this month</span><strong>{newThisMonth}</strong></article>
        </section>

        <section className="admin-customer-toolbar">
          <div>
            <p>Website customers</p>
            <h2>People who created an account</h2>
            <span>
              This list comes from your website login system, not from Square loyalty enrolments.
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

        <div className="admin-filter-bar" role="tablist" aria-label="Customer filters">
          {([
            ["all", "All accounts"],
            ["verified", "Email verified"],
            ["unverified", "Needs verification"],
            ["signed-in", "Has signed in"],
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

        <section className="admin-customer-table-wrap" aria-label="Website customer accounts">
          <div className="admin-customer-table-head" aria-hidden="true">
            <span>Customer</span>
            <span>Account</span>
            <span>Joined</span>
            <span>Last sign in</span>
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
              {visibleCustomers.map((customer) => (
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

                  <div className="admin-customer-cell" data-label="Account">
                    <span
                      className={`admin-account-status ${
                        customer.emailConfirmedAt ? "is-verified" : "is-pending"
                      }`}
                    >
                      {customer.emailConfirmedAt ? "Verified" : "Email pending"}
                    </span>
                  </div>

                  <div className="admin-customer-cell" data-label="Joined">
                    <strong>{formatDate(customer.createdAt)}</strong>
                  </div>

                  <div className="admin-customer-cell" data-label="Last sign in">
                    <strong>{formatDateTime(customer.lastSignInAt)}</strong>
                  </div>

                  <div className="admin-customer-cell" data-label="Orders">
                    <strong>{customer.orderCount}</strong>
                    {customer.lastOrderAt && <span>Last {formatDate(customer.lastOrderAt)}</span>}
                  </div>

                  <div className="admin-customer-cell" data-label="Drip Points">
                    <strong>{customer.dripPoints.toLocaleString("en-AU")}</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
