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
import AccountDashboardSkeleton from "./account-dashboard-skeleton";
import MobileBottomNav from "./mobile-bottom-nav";
import ReviewStories from "./review-stories";
import ButtonWithIcon from "@/components/ui/button-witn-icon";

type PublicReview = {
  id: string;
  rating: number;
  message: string;
  displayName: string;
  createdAt: string;
  verifiedPurchase: boolean;
};

type PublicReviewSummary = {
  count: number;
  average: number;
};

const statusLabels: Record<CustomerReview["status"], string> = {
  pending: "Pending approval",
  published: "Published",
  hidden: "Hidden",
  flagged: "Flagged",
};

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function starText(rating: number) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export default function ReviewsPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [publicReviews, setPublicReviews] = useState<PublicReview[]>([]);
  const [summary, setSummary] = useState<PublicReviewSummary>({
    count: 0,
    average: 0,
  });
  const [orderId, setOrderId] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);
  const [publicReady, setPublicReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [publicError, setPublicError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPublicReviews() {
      try {
        const response = await fetch("/api/reviews", { cache: "no-store" });
        const result = (await response.json()) as {
          ok?: boolean;
          error?: string;
          reviews?: PublicReview[];
          summary?: PublicReviewSummary;
        };

        if (!active) return;
        if (!response.ok || !result.ok) {
          setPublicError(result.error ?? "Customer reviews could not be loaded.");
          return;
        }

        setPublicReviews(result.reviews ?? []);
        setSummary(result.summary ?? { count: 0, average: 0 });
      } catch {
        if (active) setPublicError("Customer reviews could not be loaded.");
      } finally {
        if (active) setPublicReady(true);
      }
    }

    async function loadAccountReviews() {
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
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your review history.",
        );
      } finally {
        if (active) setReady(true);
      }
    }

    void loadPublicReviews();
    void loadAccountReviews();

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
    setSubmitError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!orderId || submitting) return;

    setSubmitting(true);
    setSubmitError("");
    setSaved(false);

    try {
      const review = await saveReview({ orderId, rating, message });
      if (!review) {
        throw new Error("Your review could not be saved. Please try again.");
      }

      // Use the confirmed API result immediately. A later history refresh
      // must not turn an already-saved review into a false submission failure.
      setReviews((current) => [
        review,
        ...current.filter((item) => item.orderId !== review.orderId),
      ]);
      setSaved(true);
    } catch (saveError) {
      setSubmitError(
        saveError instanceof Error
          ? saveError.message
          : "Could not submit your review.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return <AccountDashboardSkeleton variant="reviews" />;
  }

  const averageLabel = summary.count > 0 ? summary.average.toFixed(1) : "—";
  const averageRounded =
    summary.count > 0 ? Math.max(1, Math.min(5, Math.round(summary.average))) : 0;

  return (
    <div className="standalone-page account-page customer-reviews-page">
      <main className="standalone-main reviews-main">
        <section className="reviews-hero" aria-labelledby="reviews-title">
          <div className="reviews-hero__copy">
            <p className="standalone-eyebrow">Customer reviews</p>
            <h1 id="reviews-title">Real orders. Real feedback.</h1>
            <p>
              Every review submitted here is connected to a completed Nasty
              Burger House order. Reviews are checked before they appear publicly.
            </p>
          </div>

          <div className="reviews-score-card" aria-label="Customer review rating">
            <strong>{averageLabel}</strong>
            <div className="reviews-stars" aria-hidden="true">
              {averageRounded > 0 ? starText(averageRounded) : "☆☆☆☆☆"}
            </div>
            <span>
              {summary.count === 0
                ? "No published reviews yet"
                : summary.count +
                  " verified review" +
                  (summary.count === 1 ? "" : "s")}
            </span>
          </div>
        </section>

        <section className="public-reviews-section" aria-labelledby="published-reviews-title">
          <div className="reviews-section-heading">
            <div>
              <p className="standalone-eyebrow">Verified customers</p>
              <h2 id="published-reviews-title">What people are saying</h2>
            </div>
            <a className="reviews-jump-link" href="#leave-review">
              Leave a review
            </a>
          </div>

          {!publicReady ? (
            <div className="reviews-loading-grid" aria-label="Loading reviews">
              {[0, 1, 2].map((item) => (
                <div className="review-card review-card--loading" key={item} />
              ))}
            </div>
          ) : publicError ? (
            <div className="reviews-public-notice" role="status">
              {publicError}
            </div>
          ) : publicReviews.length === 0 ? (
            <div className="reviews-empty-public">
              <strong>Be the first published reviewer.</strong>
              <p>
                Completed-order customers can submit a 1–5 star rating below.
              </p>
            </div>
          ) : (
            <div className="public-reviews-grid">
              {publicReviews.map((review) => (
                <article className="review-card" key={review.id}>
                  <div className="review-card__top">
                    <div>
                      <strong>{review.displayName}</strong>
                      {review.verifiedPurchase && (
                        <span className="verified-review-badge">Verified order</span>
                      )}
                    </div>
                    <time dateTime={review.createdAt}>
                      {formatReviewDate(review.createdAt)}
                    </time>
                  </div>
                  <div
                    className="review-card__stars"
                    aria-label={review.rating + " out of 5 stars"}
                  >
                    {starText(review.rating)}
                  </div>
                  <p>
                    {review.message ||
                      "This customer left a rating without a written comment."}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <ReviewStories />

        <section className="leave-review-section" id="leave-review">
          <div className="reviews-section-heading">
            <div>
              <p className="standalone-eyebrow">Your turn</p>
              <h2>Rate your Nasty order</h2>
              <p>
                Choose 1–5 stars. New reviews and edits are sent for approval
                before appearing publicly.
              </p>
            </div>
          </div>

          {!signedIn && (
            <div className="account-inline-notice reviews-signin-notice">
              <span>Sign in to leave a verified order review.</span>
              <Link href="/account/sign-in?return=/reviews">Sign in</Link>
            </div>
          )}

          {error && (
            <div className="account-inline-notice" role="alert">
              <span>{error}</span>
            </div>
          )}

          {orders.length === 0 ? (
            <section className="account-empty-card review-locked-card">
              <p className="standalone-eyebrow">
                {signedIn ? "No completed order to review" : "Verified reviews only"}
              </p>
              <h2>
                {signedIn
                  ? "Your review form unlocks after pickup."
                  : "Sign in after a completed order to review it."}
              </h2>
              <p>
                This keeps ratings connected to real Nasty Burger House customers.
              </p>
              <ButtonWithIcon
                tone="red"
                href={signedIn ? "/account/orders" : "/account/sign-in?return=/reviews"}
              >
                {signedIn ? "View order history" : "Sign in"}
              </ButtonWithIcon>
            </section>
          ) : (
            <div className="reviews-layout">
              <form className="account-card review-form" onSubmit={submit}>
                <div className="account-section-heading">
                  <div>
                    <p className="standalone-eyebrow">Verified order</p>
                    <h2>How was it?</h2>
                  </div>
                  {saved && <span className="review-saved-state">Pending approval</span>}
                </div>

                <label>
                  Completed order
                  <select
                    value={orderId}
                    onChange={(event) => chooseOrder(event.target.value)}
                  >
                    {orders.map((order) => (
                      <option key={order.orderId} value={order.orderId}>
                        {order.orderId} ·{" "}
                        {order.lines
                          .map((line) => line.name)
                          .slice(0, 2)
                          .join(", ")}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedOrder && (
                  <p className="review-order-meta">
                    {selectedOrder.pickupLabel} ·{" "}
                    {new Date(selectedOrder.submittedAt).toLocaleDateString("en-AU")}
                  </p>
                )}

                <fieldset className="review-rating-field">
                  <legend>Your rating</legend>
                  <div>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        className={value <= rating ? "is-active" : ""}
                        type="button"
                        key={value}
                        onClick={() => setRating(value)}
                        aria-label={
                          value + " star" + (value === 1 ? "" : "s")
                        }
                        aria-pressed={rating === value}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <strong>{rating}/5</strong>
                </fieldset>

                <label>
                  Tell us more <small>Optional</small>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={6}
                    maxLength={1000}
                    placeholder="What did you love? What should we improve?"
                  />
                </label>

                <div className="review-form__footer">
                  <span>{message.length}/1000</span>
                  <ButtonWithIcon
                    tone="red"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting…" : "Submit review"}
                  </ButtonWithIcon>
                </div>

                {submitError && (
                  <p className="account-form-error review-submit-error" role="alert">
                    {submitError}
                  </p>
                )}

                {saved && (
                  <p className="review-submit-success" role="status">
                    Thanks. Your review is saved and pending approval.
                  </p>
                )}
              </form>

              <aside className="reviews-history">
                <p className="standalone-eyebrow">Your reviews</p>
                <h2>Past feedback</h2>
                {reviews.length === 0 ? (
                  <p>No reviews submitted yet.</p>
                ) : (
                  reviews.map((review) => {
                    const status = review.status ?? "pending";
                    return (
                      <article className="review-history-card" key={review.id}>
                        <div>
                          <strong>{starText(review.rating)}</strong>
                          <span>{review.orderId}</span>
                        </div>
                        <span
                          className={
                            "review-status review-status--" + status
                          }
                        >
                          {statusLabels[status]}
                        </span>
                        <p>{review.message || "Rating only"}</p>
                        <button
                          type="button"
                          onClick={() => chooseOrder(review.orderId)}
                        >
                          Edit review
                        </button>
                      </article>
                    );
                  })
                )}
              </aside>
            </div>
          )}
        </section>
      </main>
      <MobileBottomNav active="more" />
    </div>
  );
}
