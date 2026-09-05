"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  loadCurrentCustomer,
  loadCustomerOrders,
} from "../lib/customer-backend";
import type { CustomerOrder } from "../lib/customer-store";
import MobileBottomNav from "./mobile-bottom-nav";

const money = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [customer, customerOrders] = await Promise.all([
          loadCurrentCustomer(),
          loadCustomerOrders(),
        ]);
        if (!active) return;
        setSignedIn(Boolean(customer));
        setOrders(customerOrders);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Could not load order history.");
      } finally {
        if (active) setReady(true);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return <div className="standalone-page"><main className="standalone-main"><div className="cart-page-loading">Loading order history…</div></main></div>;
  }

  return (
    <div className="standalone-page account-page">
      <main className="standalone-main order-history-main">
        <div className="standalone-page-heading">
          <p className="standalone-eyebrow">Nasty account</p>
          <div><h1>Order history</h1><span>{orders.length} order{orders.length === 1 ? "" : "s"}</span></div>
          <p>Track your order status, receipts, Drip Points and completed-order reviews.</p>
        </div>

        {!signedIn && (
          <div className="account-inline-notice">
            <span>Sign in to sync your order history across devices.</span>
            <Link href="/account/sign-in?return=/account/orders">Sign in</Link>
          </div>
        )}

        {error && <div className="account-inline-notice"><span>{error}</span></div>}

        {orders.length === 0 ? (
          <section className="account-empty-card account-empty-card--orders">
            <p className="standalone-eyebrow">No orders yet</p>
            <h2>Your first Nasty order will show here.</h2>
            <p>Place an order while signed in and its live status, receipt and points will stay attached to your account.</p>
            <Link className="standalone-primary-button" href="/menu/burgers">Start an order</Link>
          </section>
        ) : (
          <section className="order-history-list" aria-label="Past orders">
            {orders.map((order) => (
              <Link className="order-history-card" href={`/account/orders/${encodeURIComponent(order.orderId)}`} key={order.orderId}>
                <div className="order-history-card__top">
                  <div>
                    <span className={`order-status order-status--${order.status}`}>{order.status}</span>
                    <h2>{order.orderId}</h2>
                    <p>{formatDate(order.submittedAt)}</p>
                  </div>
                  <strong>{money.format(order.subtotal)}</strong>
                </div>
                <div className="order-history-card__items">
                  {order.lines.slice(0, 3).map((line, index) => (
                    <span key={`${order.orderId}-${line.itemId}-${index}`}>{line.quantity}× {line.name}</span>
                  ))}
                  {order.lines.length > 3 && <span>+{order.lines.length - 3} more</span>}
                </div>
                <div className="order-history-card__bottom">
                  <span>{order.pickupLabel}</span>
                  <strong>
                    {order.earnedDripPoints > 0
                      ? `${order.dripPointsStatus === "pending" ? "Pending " : "+"}${order.earnedDripPoints} Drip Points`
                      : "View order"}
                  </strong>
                </div>
              </Link>
            ))}
          </section>
        )}
      </main>
      <MobileBottomNav active="more" />
    </div>
  );
}
