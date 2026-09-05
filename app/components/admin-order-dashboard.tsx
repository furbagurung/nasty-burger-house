"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AdminOrder } from "../lib/admin-orders";

const money = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

const statusLabels: Record<AdminOrder["status"], string> = {
  received: "Received",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

const filters: Array<{ value: "active" | AdminOrder["status"] | "all"; label: string }> = [
  { value: "active", label: "Active" },
  { value: "received", label: "Received" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All" },
];

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function nextPrimaryStatus(status: AdminOrder["status"]) {
  if (status === "received") return "preparing" as const;
  if (status === "preparing") return "ready" as const;
  if (status === "ready") return "completed" as const;
  return null;
}

export default function AdminOrderDashboard({
  initialOrders,
  adminEmail,
}: {
  initialOrders: AdminOrder[];
  adminEmail?: string;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("active");
  const [busyOrderId, setBusyOrderId] = useState("");
  const [error, setError] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const seenOrderIds = useRef(new Set(initialOrders.map((order) => order.id)));

  const visibleOrders = useMemo(() => {
    if (filter === "all") return orders;
    if (filter === "active") {
      return orders.filter((order) =>
        ["received", "preparing", "ready"].includes(order.status),
      );
    }
    return orders.filter((order) => order.status === filter);
  }, [filter, orders]);

  const activeCount = orders.filter((order) =>
    ["received", "preparing", "ready"].includes(order.status),
  ).length;

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const response = await fetch("/api/admin/orders", { cache: "no-store" });
        if (!response.ok) return;
        const result = (await response.json()) as { ok?: boolean; orders?: AdminOrder[] };
        if (!active || !result.ok || !result.orders) return;

        const newOrders = result.orders.filter(
          (order) => !seenOrderIds.current.has(order.id),
        );
        result.orders.forEach((order) => seenOrderIds.current.add(order.id));
        setOrders(result.orders);

        if (
          newOrders.length > 0 &&
          notificationsEnabled &&
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"
        ) {
          newOrders.slice(0, 3).forEach((order) => {
            new Notification("New Nasty Burger pickup order", {
              body: `${order.id} · ${order.customerName} · ${money.format(order.subtotal)}`,
              tag: order.id,
            });
          });
        }
      } catch {
        // The next poll can recover. Keep the dashboard usable offline.
      }
    }

    const interval = window.setInterval(() => void refresh(), 10_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [notificationsEnabled]);

  async function enableNotifications() {
    if (typeof Notification === "undefined") {
      setError("Browser notifications are not supported on this device.");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
    if (permission !== "granted") {
      setError("Browser notification permission was not granted.");
    } else {
      setError("");
    }
  }

  async function updateStatus(orderId: string, status: AdminOrder["status"]) {
    setBusyOrderId(orderId);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderId)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setError(result.error ?? "Could not update the order.");
        return;
      }
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        ),
      );
    } catch {
      setError("Could not reach the order service.");
    } finally {
      setBusyOrderId("");
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p>Nasty Burger House</p>
          <h1>Order Control</h1>
        </div>
        <div className="admin-header__actions">
          <span>{adminEmail ?? "Admin"}</span>
          <button type="button" onClick={() => void enableNotifications()}>
            {notificationsEnabled ? "Alerts on" : "Enable order alerts"}
          </button>
          <Link href="/">View site</Link>
        </div>
      </header>

      <main className="admin-main">
        <section className="admin-summary-grid">
          <article><span>Active orders</span><strong>{activeCount}</strong></article>
          <article><span>Waiting to start</span><strong>{orders.filter((order) => order.status === "received").length}</strong></article>
          <article><span>Ready for pickup</span><strong>{orders.filter((order) => order.status === "ready").length}</strong></article>
          <article><span>Completed today</span><strong>{orders.filter((order) => order.status === "completed" && new Date(order.submittedAt).toDateString() === new Date().toDateString()).length}</strong></article>
        </section>

        <div className="admin-filter-bar" role="tablist" aria-label="Order filters">
          {filters.map((entry) => (
            <button
              className={filter === entry.value ? "is-active" : ""}
              type="button"
              key={entry.value}
              onClick={() => setFilter(entry.value)}
            >
              {entry.label}
            </button>
          ))}
        </div>

        {error && <div className="admin-error" role="alert">{error}</div>}

        <section className="admin-order-list" aria-label="Orders">
          {visibleOrders.length === 0 ? (
            <div className="admin-empty-state">
              <strong>No orders in this view.</strong>
              <span>New pickup orders will appear automatically.</span>
            </div>
          ) : (
            visibleOrders.map((order) => {
              const nextStatus = nextPrimaryStatus(order.status);
              return (
                <article className={`admin-order-card admin-order-card--${order.status}`} key={order.id}>
                  <div className="admin-order-card__top">
                    <div>
                      <span className={`admin-status admin-status--${order.status}`}>{statusLabels[order.status]}</span>
                      <h2>{order.id}</h2>
                      <p>{formatTime(order.submittedAt)} · {order.pickupLabel}</p>
                    </div>
                    <strong>{money.format(order.subtotal)}</strong>
                  </div>

                  <div className="admin-order-card__body">
                    <div className="admin-order-items">
                      {order.lines.map((line, index) => (
                        <div key={`${order.id}-${line.itemId}-${index}`}>
                          <strong>{line.quantity}× {line.itemName}</strong>
                          {line.details.map((detail) => <span key={detail}>{detail}</span>)}
                        </div>
                      ))}
                    </div>

                    <aside className="admin-order-customer">
                      <strong>{order.customerName}</strong>
                      <a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a>
                      <a href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a>
                      {order.notes && <p><b>Note:</b> {order.notes}</p>}
                      <small>Notification: {order.adminNotificationStatus}</small>
                    </aside>
                  </div>

                  <div className="admin-order-card__actions">
                    {nextStatus && (
                      <button
                        className="admin-primary-action"
                        type="button"
                        disabled={busyOrderId === order.id}
                        onClick={() => void updateStatus(order.id, nextStatus)}
                      >
                        {busyOrderId === order.id
                          ? "Updating…"
                          : nextStatus === "preparing"
                            ? "Start preparing"
                            : nextStatus === "ready"
                              ? "Mark ready"
                              : "Complete pickup"}
                      </button>
                    )}
                    {!["completed", "cancelled"].includes(order.status) && (
                      <button
                        className="admin-secondary-action"
                        type="button"
                        disabled={busyOrderId === order.id}
                        onClick={() => void updateStatus(order.id, "cancelled")}
                      >
                        Cancel order
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}
