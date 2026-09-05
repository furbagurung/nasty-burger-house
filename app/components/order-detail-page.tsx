"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  readCustomerOrders,
  readCustomerReviews,
  type CustomerOrder,
  type CustomerReview,
} from "../lib/customer-store";
import MobileBottomNav from "./mobile-bottom-nav";

const money = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [review, setReview] = useState<CustomerReview | null>(null);
  const [ready, setReady] = useState(false);
  const [justPlaced, setJustPlaced] = useState(false);

  useEffect(() => {
    const orderId = decodeURIComponent(String(params.orderId ?? ""));
    setOrder(readCustomerOrders().find((entry) => entry.orderId === orderId) ?? null);
    setReview(readCustomerReviews().find((entry) => entry.orderId === orderId) ?? null);
    setJustPlaced(new URLSearchParams(window.location.search).get("new") === "1");
    setReady(true);
  }, [params.orderId]);

  if (!ready) {
    return <div className="standalone-page"><main className="standalone-main"><div className="cart-page-loading">Loading order…</div></main></div>;
  }

  if (!order) {
    return (
      <div className="standalone-page account-page">
        <main className="standalone-main account-empty-main">
          <section className="account-empty-card">
            <p className="standalone-eyebrow">Order not found</p>
            <h1>We can&apos;t find that order on this device.</h1>
            <Link className="standalone-primary-button" href="/account/orders">Order history</Link>
          </section>
        </main>
        <MobileBottomNav active="more" />
      </div>
    );
  }

  return (
    <div className="standalone-page account-page">
      <main className="standalone-main order-detail-main">
        {justPlaced && (
          <div className="order-success-banner">
            <strong>Order received.</strong>
            <span>Your pickup order has been accepted. Pay when you collect.</span>
          </div>
        )}

        <header className="order-detail-heading">
          <div>
            <p className="standalone-eyebrow">Order receipt</p>
            <h1>{order.orderId}</h1>
            <p>{formatDate(order.submittedAt)} · {order.pickupLabel}</p>
          </div>
          <span className={`order-status order-status--${order.status}`}>{order.status}</span>
        </header>

        <div className="order-detail-layout">
          <section className="account-card order-detail-items">
            <div className="account-section-heading"><div><p className="standalone-eyebrow">Your order</p><h2>Items</h2></div><strong>{money.format(order.subtotal)}</strong></div>
            <div className="order-detail-lines">
              {order.lines.map((line, index) => (
                <article key={`${line.itemId}-${index}`}>
                  <span className="order-detail-line__media">
                    <Image src={line.image ?? "/logo.webp"} alt="" width={100} height={100} />
                  </span>
                  <div>
                    <h3>{line.quantity}× {line.name}</h3>
                    {line.details.map((detail) => <p key={detail}>{detail}</p>)}
                  </div>
                  <strong>{money.format(line.lineTotal)}</strong>
                </article>
              ))}
            </div>
            <div className="order-detail-total"><span>Subtotal</span><strong>{money.format(order.subtotal)}</strong></div>
          </section>

          <aside className="order-detail-side">
            <section className="account-card order-detail-info-card">
              <p className="standalone-eyebrow">Pickup</p>
              <h2>{order.customerName}</h2>
              <span>{order.customerEmail}</span>
              <span>{order.customerPhone}</span>
              <span>{order.pickupLabel}</span>
            </section>

            <section className="account-card order-detail-points-card">
              <Image src="/images/drip-points/drip-coin.png" alt="" width={60} height={60} />
              <div><span>Drip Points earned</span><strong>+{order.earnedDripPoints}</strong></div>
              {order.earnedDripPoints === 0 && <small>Create/sign in to an account before checkout to earn points.</small>}
            </section>

            <section className="account-card order-detail-notification">
              <p className="standalone-eyebrow">Admin notification</p>
              <h2>{order.adminNotification === "sent" ? "Sent to the order system" : order.adminNotification === "failed" ? "Delivery failed" : "Webhook setup pending"}</h2>
              <p>{order.adminNotification === "sent" ? "The configured kitchen/admin webhook accepted this order." : "The order was accepted by the development fallback, but the production notification destination still needs configuration."}</p>
            </section>

            <section className="account-card order-detail-review-card">
              <p className="standalone-eyebrow">Your feedback</p>
              {review ? (
                <><h2>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</h2><p>{review.message || "Thanks for rating your order."}</p><Link href={`/reviews?order=${encodeURIComponent(order.orderId)}`}>Edit review</Link></>
              ) : (
                <><h2>How was it?</h2><p>Rate this order and leave a short review.</p><Link className="standalone-primary-button" href={`/reviews?order=${encodeURIComponent(order.orderId)}`}>Leave a review</Link></>
              )}
            </section>
          </aside>
        </div>

        <div className="order-detail-footer-actions">
          <Link className="standalone-secondary-link" href="/account/orders">← All orders</Link>
          <Link className="standalone-primary-button" href="/menu/burgers">Order again</Link>
        </div>
      </main>
      <MobileBottomNav active="more" />
    </div>
  );
}
