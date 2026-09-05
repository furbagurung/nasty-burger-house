"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  loadCurrentCustomer,
  loadCustomerOrders,
  loadCustomerReviews,
  saveReview,
} from "../lib/customer-backend";
import type { CustomerOrder, CustomerReview } from "../lib/customer-store";
import MobileBottomNav from "./mobile-bottom-nav";

export default function ReviewsPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [orderId, setOrderId] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [customer, storedOrders, storedReviews] = await Promise.all([
          loadCurrentCustomer(),
          loadCustomerOrders(),
          loadCustomerReviews(),
        ]);
        if (!active) return;

        const reviewableOrders = storedOrders.filter(
          (order) => order.status === "completed",
        );
        const requested =
          new URLSearchParams(window.location.search).get("order") ?? "";
        const initialOrder = reviewableOrders.some(
          (order) => order.orderId === requested,
        )
          ? requested
          : reviewableOrders[0]?.orderId ?? "";
        const existing = storedReviews.find(
          (review) => review.orderId === initialOrder,
        );

        setSignedIn(Boolean(customer));
        setOrders(reviewableOrders);
        setReviews(storedReviews);
        setOrderId(initialOrder);
        if (existing) {
          setRating(existing.rating);
          setMessage(existing.message);
        }
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Could not load reviews.");
      } finally {
        if (active) setReady(true);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.orderId === orderId) ?? null,
    [orderId, orders],
  );

  function chooseOrder(value: string) {
    setOrderId(value);
    const existing = reviews.find((review) => review.orderId === value);
    setRating(existing?.rating ?? 5);
    setMessage(existing?.message ?? "");
    setSaved(false);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!orderId) return;
    setError("");
    try {
      await saveReview({ orderId, rating, message });
      setReviews(await loadCustomerReviews());
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save your review.");
    }
  }

  if (!ready) {
    return <div className="standalone-page"><main className="standalone-main"><div className="cart-page-loading">Loading reviews…</div></main></div>;
  }

  return (
    <div className="standalone-page account-page">
      <main className="standalone-main reviews-main">
        <div className="standalone-page-heading">
          <p className="standalone-eyebrow">Customer feedback</p>
          <div><h1>Reviews</h1><span>{reviews.length} saved</span></div>
          <p>Reviews unlock after an order is completed, so every rating is tied to a real purchase.</p>
        </div>

        {!signedIn && (
          <div className="account-inline-notice">
            <span>Sign in to leave a verified order review.</span>
            <Link href="/account/sign-in?return=/reviews">Sign in</Link>
          </div>
        )}

        {error && <div className="account-inline-notice"><span>{error}</span></div>}

        {orders.length === 0 ? (
          <section className="account-empty-card">
            <p className="standalone-eyebrow">No completed order to review</p>
            <h2>Your review form unlocks after pickup.</h2>
            <p>When an order is marked completed by the team, it becomes eligible for a 1–5 star review.</p>
            <Link className="standalone-primary-button" href="/account/orders">View order history</Link>
          </section>
        ) : (
          <div className="reviews-layout">
            <form className="account-card review-form" onSubmit={submit}>
              <div className="account-section-heading">
                <div><p className="standalone-eyebrow">Leave a review</p><h2>How was your order?</h2></div>
                {saved && <span>Saved</span>}
              </div>

              <label>
                Completed order
                <select value={orderId} onChange={(event) => chooseOrder(event.target.value)}>
                  {orders.map((order) => <option key={order.orderId} value={order.orderId}>{order.orderId} · {order.lines.map((line) => line.name).slice(0, 2).join(", ")}</option>)}
                </select>
              </label>

              {selectedOrder && <p className="review-order-meta">{selectedOrder.pickupLabel} · {new Date(selectedOrder.submittedAt).toLocaleDateString("en-AU")}</p>}

              <fieldset className="review-rating-field">
                <legend>Your rating</legend>
                <div>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button className={value <= rating ? "is-active" : ""} type="button" key={value} onClick={() => setRating(value)} aria-label={`${value} star${value === 1 ? "" : "s"}`} aria-pressed={rating === value}>★</button>
                  ))}
                </div>
                <strong>{rating}/5</strong>
              </fieldset>

              <label>
                Tell us more <small>Optional</small>
                <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={6} maxLength={1000} placeholder="What did you love? What should we improve?" />
              </label>
              <button className="standalone-primary-button" type="submit">Save review</button>
            </form>

            <aside className="reviews-history">
              <p className="standalone-eyebrow">Your reviews</p>
              <h2>Past feedback</h2>
              {reviews.length === 0 ? <p>No reviews saved yet.</p> : reviews.map((review) => (
                <article className="review-history-card" key={review.id}>
                  <div><strong>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</strong><span>{review.orderId}</span></div>
                  <p>{review.message || "Rating only"}</p>
                  <button type="button" onClick={() => chooseOrder(review.orderId)}>Edit</button>
                </article>
              ))}
            </aside>
          </div>
        )}
      </main>
      <MobileBottomNav active="more" />
    </div>
  );
}
