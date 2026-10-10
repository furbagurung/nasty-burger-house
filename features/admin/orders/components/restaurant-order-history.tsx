"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";
import type {
  RestaurantOrder,
  RestaurantOrderPage,
} from "@/app/lib/admin-square-order-history";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AdminTablePagination, DEFAULT_ADMIN_PAGE_SIZE,
  type AdminPageSize,
} from "@/components/admin/shared/admin-table-pagination";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type Channel = "all" | "website" | "square";
type Status = "all" | "Completed" | "Cancelled";

function filterOrders(
  orders: RestaurantOrder[], term: string, channel: Channel, status: Status,
) {
  const search = term.trim().toLowerCase();
  return orders.filter((order) =>
    (channel === "all" ||
      (channel === "website" ? order.channel === "Website" : order.channel === "Square / POS")) &&
    (status === "all" || order.status === status) &&
    (!search || [
      order.id, order.reference, order.customerName,
      order.channel, ...order.items.map((item) => item.name),
    ].some((value) => value.toLowerCase().includes(search))),
  );
}

function dateTime(value: string) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "—";
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit",
  }).format(new Date(time));
}

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency", currency, maximumFractionDigits: 2,
  }).format(amount);
}

function OrderItems({ order }: { order: RestaurantOrder }) {
  const quantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <details className="admin-history-items">
      <summary>{quantity ? `${quantity} items` : "View items"}</summary>
      {order.items.length === 0 ? (
        <p>Item details unavailable.</p>
      ) : (
        <ul>
          {order.items.map((item, i) => (
            <li key={i}>
              <span>{item.quantity} × {item.name}</span>
              <span>{money(item.amount, order.currency)}</span>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}

function StatusTag({ order }: { order: RestaurantOrder }) {
  return (
    <Badge
      variant="secondary"
      className={order.status === "Completed"
        ? "admin-history-status is-completed" : "admin-history-status is-cancelled"}
    >
      {order.status}
    </Badge>
  );
}

export default function RestaurantOrderHistory({
  initial,
  customerId,
}: {
  initial: RestaurantOrderPage;
  customerId?: string;
}) {
  const [orders, setOrders] = useState(initial.orders);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<Channel>("all");
  const [status, setStatus] = useState<Status>("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState<AdminPageSize>(DEFAULT_ADMIN_PAGE_SIZE);
  const fetchBusy = useRef(false);

  const visible = useMemo(
    () => filterOrders(orders, search, channel, status),
    [orders, search, channel, status],
  );
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const pageOrders = visible.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  async function goToPage(nextPage: number) {
    if (nextPage < 0 || loading) return;
    if (nextPage * pageSize < visible.length) {
      setPageIndex(nextPage);
      return;
    }
    if (!cursor || fetchBusy.current) return;

    fetchBusy.current = true;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ cursor });
      if (customerId) params.set("customer", customerId);
      const response = await fetch(`/api/admin/order-history?${params.toString()}`, {
        cache: "no-store",
      });
      const body = (await response.json()) as {
        ok?: boolean;
        orders?: RestaurantOrder[];
        nextCursor?: string | null;
        error?: string;
      };
      if (!response.ok || !body.ok || !Array.isArray(body.orders)) {
        throw new Error(body.error || "Could not load more orders.");
      }

      const ids = new Set(orders.map((order) => order.id));
      const combined = [...orders, ...body.orders.filter((order) => !ids.has(order.id))];
      const matching = filterOrders(combined, search, channel, status);
      setOrders(combined);
      setCursor(body.nextCursor ?? null);
      if (nextPage * pageSize < matching.length) {
        setPageIndex(nextPage);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load more orders.");
    } finally {
      fetchBusy.current = false;
      setLoading(false);
    }
  }


  return (
    <main className="admin-main admin-history-main">
      <section className="admin-history-heading">
        <div>
          <h2>Order history</h2>
          <p>Website and Square/POS transactions.</p>
        </div>
        {customerId && (
          <Button variant="outline" render={<Link href="/admin/orders" />}>
            All orders
          </Button>
        )}
      </section>

      {customerId && (
        <p className="admin-history-customer-note">
          Square-linked purchases only. Some sales have no customer ID.
        </p>
      )}

      <section className="admin-history-toolbar" aria-label="Order history filters">
        <label className="admin-history-search">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Search loaded orders</span>
          <Input
            type="search"
            placeholder="Search orders"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPageIndex(0); }}
            autoComplete="off"
          />
        </label>
        <Select value={channel} onValueChange={(value) => {
          if (value === "all" || value === "website" || value === "square") {
            setChannel(value);
            setPageIndex(0);
          }
        }}>
<SelectTrigger aria-label="Filter by sales channel"><SelectValue>{channel === "all" ? "All channels" : channel === "website" ? "Website" : "Square / POS"}</SelectValue></SelectTrigger>
          <SelectContent side="bottom" alignItemWithTrigger={false}>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="square">Square / POS</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(value) => {
          if (value === "all" || value === "Completed" || value === "Cancelled") {
            setStatus(value);
            setPageIndex(0);
          }
        }}>
          <SelectTrigger aria-label="Filter by status"><SelectValue>{status === "all" ? "All statuses" : status}</SelectValue></SelectTrigger>
          <SelectContent side="bottom" alignItemWithTrigger={false}>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </section>

      <div className="admin-history-count" role="status">
        {visible.length} matching · {orders.length} loaded{cursor ? " · Older orders available" : ""}
      </div>

      {visible.length === 0 ? (
        <Card className="admin-history-empty">
          <ShoppingBag size={24} aria-hidden="true" />
          <p>{orders.length ? "No orders match these filters." : "No orders found."}</p>
        </Card>
      ) : (
        <>
          <Card className="admin-history-table-card">
            <Table className="admin-history-table">
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Date</TableHead>
                  <TableHead scope="col">Customer</TableHead>
                  <TableHead scope="col">Channel</TableHead>
                  <TableHead scope="col">Order</TableHead>
                  <TableHead scope="col">Items</TableHead>
                  <TableHead scope="col">Total</TableHead>
                  <TableHead scope="col">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{dateTime(order.closedAt)}</TableCell>
                    <TableCell><strong>{order.customerName}</strong></TableCell>
                    <TableCell>{order.channel}</TableCell>
                    <TableCell><span className="admin-history-reference" title={order.id}>{order.reference}</span></TableCell>
                    <TableCell><OrderItems order={order} /></TableCell>
                    <TableCell className="admin-history-total">{money(order.amount, order.currency)}</TableCell>
                    <TableCell><StatusTag order={order} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <div className="admin-history-mobile">
            {pageOrders.map((order) => (
              <Card className="admin-history-mobile-card" key={order.id}>
                <div className="admin-history-mobile-top">
                  <div><strong>{order.customerName}</strong><span>{dateTime(order.closedAt)}</span></div>
                  <strong className="admin-history-total">{money(order.amount, order.currency)}</strong>
                </div>
                <div className="admin-history-mobile-meta">
                  <span>{order.channel}</span>
                  <StatusTag order={order} />
                </div>
                <div className="admin-history-mobile-bottom">
                  <span title={order.id}>{order.reference}</span>
                  <OrderItems order={order} />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <AdminTablePagination
        pageIndex={currentPage}
        pageSize={pageSize}
        total={visible.length}
        hasMore={Boolean(cursor)}
        loading={loading}
        onPageChange={(next) => { void goToPage(next); }}
        onPageSizeChange={(next) => { setPageSize(next); setPageIndex(0); }}
      />
      {error && <p className="admin-history-error" role="alert">{error}</p>}
      <p className="admin-history-footnote">
        Read-only Square history. Guest sales may not identify the buyer.
        Search and filters cover loaded orders; Next loads older records.
      </p>
    </main>
  );
}
