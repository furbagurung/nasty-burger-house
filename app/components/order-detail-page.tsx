"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  customerBackendMode,
  loadCustomerOrder,
  loadCustomerReviews,
} from "../lib/customer-backend";
import type { CustomerOrder, CustomerReview } from "../lib/customer-store";
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
  const backendMode = customerBackendMode();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [review, setReview] = useState<CustomerReview | null>(null);
  const [ready, setReady] = useState(false);
  const [justPlaced, setJustPlaced] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const orderId = decodeURIComponent(String(params.orderId ?? ""));
    setJustPlaced(new URLSearchParams(window.location.search).get("new") === "1");

    async function load() {
      try {
        const [nextOrder, reviews] = await Promise.all([
          loadCustomerOrder(orderId),
          loadCustomerReviews(),
        ]);
        if (!active) return;
        setOrder(nextOrder);
        setReview(reviews.find((entry) => entry.orderId === orderId) ?? null);
        setError("");
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Could not load this order.");
      } finally {
        if (active) setReady(true);
      }
    }

    void load();
    const interval =
      backendMode === "supabase"
        ? window.setInterval(() => void load(), 12_000)
        : 0;

    return () => {
      active = false;
      if (interval) window.clearInterval(interval);
    };
  }, [backendMode, params.orderId]);

  if (!ready) {
    return <div className="standalone-page"><main className="standalone-main"><div className="cart-page-loading">Loading order…</div></main></div>;
  }

  if (!order) {
    return (
      <div className="standalone-page account-page">
        <main className="standalone-main account-empty-main">
          <section className="account-empty-card">
            <p className="standalone-eyebrow">Order not found</p>
            <h1>We can&apos;t find that order in your account.</h1>
            {error && <p className="account-form-error" role="alert">{error}</p>}
            <Link className="standalone-primary-button" href="/account/orders">Order history</Link>
          </section>
        </main>
        <MobileBottomNav active="more" />
      </div>
    );
  }

  const canReview = order.status === "completed";

  return (
    <div className="standalone-page account-page">
      <main className="standalone-main order-detail-main">
        {justPlaced && (
          <div className="order-success-banner">
            <strong>Order received.</strong>
            <span>Your pickup order is in the system. Pay when you collect.</span>
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

        {backendMode === "supabase" && order.status !== "completed" && order.status !== "cancelled" && (
          <div className="account-inline-notice">
            <span>Live order status refreshes automatically while this page is open.</span>
          </div>
        )}

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
              <div>
                <span>
                  {order.dripPointsStatus === "pending"
                    ? "Drip Points pending"
                    : order.dripPointsStatus === "void"
                      ? "Drip Points voided"
                      : "Drip Points earned"}
                </span>
                <strong>{order.earnedDripPoints > 0 ? `+${order.earnedDripPoints}` : "0"}</strong>
              </div>
              {order.dripPointsStatus === "pending" && <small>Points become available when the order is completed.</small>}
              {order.earnedDripPoints === 0 && <small>Sign in before checkout to earn Drip Points.</small>}
            </section>

            <section className="account-card order-detail-review-card">
              <p className="standalone-eyebrow">Your feedback</p>
              {review ? (
                <><h2>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</h2><p>{review.message || "Thanks for rating your order."}</p><Link href={`/reviews?order=${encodeURIComponent(order.orderId)}`}>Edit review</Link></>
              ) : canReview ? (
                <><h2>How was it?</h2><p>Rate this completed order and leave a short review.</p><Link className="standalone-primary-button" href={`/reviews?order=${encodeURIComponent(order.orderId)}`}>Leave a review</Link></>
              ) : (
                <><h2>Review after pickup.</h2><p>The review form unlocks when this order is marked completed.</p></>
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
