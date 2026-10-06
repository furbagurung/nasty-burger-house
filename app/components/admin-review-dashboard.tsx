"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AdminReview, AdminReviewStatus } from "../lib/admin-reviews";

const STORE_TIME_ZONE = "Australia/Sydney";

const filters: Array<{ value: "all" | AdminReviewStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "published", label: "Published" },
  { value: "hidden", label: "Hidden" },
  { value: "flagged", label: "Flagged" },
  { value: "all", label: "All" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: STORE_TIME_ZONE,
  }).format(new Date(value));
}

function starText(rating: number) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export default function AdminReviewDashboard({
  initialReviews,
  adminEmail,
}: {
  initialReviews: AdminReview[];
  adminEmail?: string;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState<"all" | AdminReviewStatus>("pending");
  const [busyReviewId, setBusyReviewId] = useState("");
  const [error, setError] = useState("");

  const visibleReviews = useMemo(
    () =>
      filter === "all"
        ? reviews
        : reviews.filter((review) => review.status === filter),
    [filter, reviews],
  );

  const pendingCount = reviews.filter(
    (review) => review.status === "pending",
  ).length;
  const publishedReviews = reviews.filter(
    (review) => review.status === "published",
  );
  const averagePublished =
    publishedReviews.length === 0
      ? 0
      : publishedReviews.reduce((total, review) => total + review.rating, 0) /
        publishedReviews.length;

  async function updateStatus(reviewId: string, status: AdminReviewStatus) {
    setBusyReviewId(reviewId);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/reviews/" + encodeURIComponent(reviewId) + "/status",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );

      const result = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !result?.ok) {
        setError(result?.error ?? "Could not update the review.");
        return;
      }

      setReviews((current) =>
        current.map((review) =>
          review.id === reviewId ? { ...review, status } : review,
        ),
      );
    } catch {
      setError("Could not reach the review service.");
    } finally {
      setBusyReviewId("");
    }
  }

  return (
    <div className="admin-shell admin-review-shell">
      <header className="admin-header">
        <div>
          <p>Nasty Burger House</p>
          <h1>Review Moderation</h1>
        </div>
        <div className="admin-header__actions">
          <span>{adminEmail ?? "Admin"}</span>
          <Link href="/admin">Orders</Link>
          <Link href="/admin/customers">Customers</Link>
          <Link href="/reviews">Public reviews</Link>
          <Link href="/">View site</Link>
          <form action="/admin/logout" method="post">
            <button type="submit">Log out</button>
          </form>
        </div>
      </header>

      <main className="admin-main admin-review-main">
        <section className="admin-summary-grid" aria-label="Review summary">
          <article>
            <span>Pending approval</span>
            <strong>{pendingCount}</strong>
          </article>
          <article>
            <span>Published</span>
            <strong>{publishedReviews.length}</strong>
          </article>
          <article>
            <span>Published rating</span>
            <strong>
              {publishedReviews.length === 0
                ? "—"
                : averagePublished.toFixed(1) + "/5"}
            </strong>
          </article>
          <article>
            <span>Total reviews</span>
            <strong>{reviews.length}</strong>
          </article>
        </section>

        <section className="admin-review-guidance">
          <div>
            <p>Moderation</p>
            <strong>Only publish genuine customer feedback.</strong>
          </div>
          <span>
            Reviews are already tied to completed customer orders. Check the
            wording for spam, abuse or private information before publishing.
          </span>
        </section>

        <div
          className="admin-filter-bar"
          role="tablist"
          aria-label="Review filters"
        >
          {filters.map((entry) => (
            <button
              className={filter === entry.value ? "is-active" : ""}
              type="button"
              key={entry.value}
              onClick={() => setFilter(entry.value)}
            >
              {entry.label}
              {entry.value === "pending" && pendingCount > 0
                ? " (" + pendingCount + ")"
                : ""}
            </button>
          ))}
        </div>

        {error && (
          <div className="admin-error" role="alert">
            {error}
          </div>
        )}

        <section className="admin-review-list" aria-label="Customer reviews">
          {visibleReviews.length === 0 ? (
            <div className="admin-empty-state">
              <strong>No reviews in this view.</strong>
              <span>New verified reviews will appear here for moderation.</span>
            </div>
          ) : (
            visibleReviews.map((review) => (
              <article
                className={
                  "admin-review-card admin-review-card--" + review.status
                }
                key={review.id}
              >
                <div className="admin-review-card__header">
                  <div>
                    <div className="admin-review-card__badges">
                      <span
                        className={
                          "admin-review-status admin-review-status--" +
                          review.status
                        }
                      >
                        {review.status}
                      </span>
                      <span className="admin-review-verified">
                        Verified order
                      </span>
                    </div>
                    <h2>{review.customerName}</h2>
                    <p>
                      {review.customerEmail || "Customer"} · {review.orderId}
                    </p>
                  </div>
                  <time dateTime={review.createdAt}>
                    {formatDate(review.createdAt)}
                  </time>
                </div>

                <div
                  className="admin-review-card__rating"
                  aria-label={review.rating + " out of 5 stars"}
                >
                  <strong>{starText(review.rating)}</strong>
                  <span>{review.rating}/5</span>
                </div>

                <p className="admin-review-card__message">
                  {review.message || "Rating only — no written comment."}
                </p>

                <div className="admin-review-card__actions">
                  {review.status !== "published" && (
                    <button
                      className="admin-primary-action"
                      type="button"
                      disabled={busyReviewId === review.id}
                      onClick={() => void updateStatus(review.id, "published")}
                    >
                      {busyReviewId === review.id ? "Updating…" : "Publish"}
                    </button>
                  )}

                  {review.status !== "hidden" && (
                    <button
                      className="admin-secondary-action"
                      type="button"
                      disabled={busyReviewId === review.id}
                      onClick={() => void updateStatus(review.id, "hidden")}
                    >
                      Hide
                    </button>
                  )}

                  {review.status !== "flagged" && (
                    <button
                      className="admin-secondary-action"
                      type="button"
                      disabled={busyReviewId === review.id}
                      onClick={() => void updateStatus(review.id, "flagged")}
                    >
                      Flag
                    </button>
                  )}

                  {review.status !== "pending" && (
                    <button
                      className="admin-review-pending-action"
                      type="button"
                      disabled={busyReviewId === review.id}
                      onClick={() => void updateStatus(review.id, "pending")}
                    >
                      Move to pending
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
