"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  readCustomerOrders,
  readSignedInCustomerProfile,
  type CustomerOrder,
} from "../lib/customer-store";
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

  useEffect(() => {
    setSignedIn(Boolean(readSignedInCustomerProfile()));
    setOrders(readCustomerOrders());
    setReady(true);
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
          <p>Track what you ordered, how many Drip Points you earned and leave feedback.</p>
        </div>

        {!signedIn && (
          <div className="account-inline-notice">
            <span>This device has order history, but you&apos;re not signed in.</span>
            <Link href="/account/sign-in">Sign in</Link>
          </div>
        )}

        {orders.length === 0 ? (
          <section className="account-empty-card account-empty-card--orders">
            <p className="standalone-eyebrow">No orders yet</p>
            <h2>Your first Nasty order will show here.</h2>
            <p>Order from the menu and your receipt, points and review link will be saved to this device.</p>
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
                  {order.lines.slice(0, 3).map((line) => (
                    <span key={`${order.orderId}-${line.itemId}-${line.name}`}>{line.quantity}× {line.name}</span>
                  ))}
                  {order.lines.length > 3 && <span>+{order.lines.length - 3} more</span>}
                </div>
                <div className="order-history-card__bottom">
                  <span>{order.pickupLabel}</span>
                  <strong>{order.earnedDripPoints > 0 ? `+${order.earnedDripPoints} Drip Points` : "View order"}</strong>
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
