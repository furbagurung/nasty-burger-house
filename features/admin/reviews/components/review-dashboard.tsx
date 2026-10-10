"use client";

import { AdminMetricCard } from "@/components/admin/shared/admin-metric-card";
import { ClipboardCheck, Clock3, Star, MessageSquareText } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AdminReview, AdminReviewStatus } from "@/app/lib/admin-reviews";

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
}: {
  initialReviews: AdminReview[];
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
        setError(result?.error ?? "Could not update review.");
        return;
      }

      setReviews((current) =>
        current.map((review) =>
          review.id === reviewId ? { ...review, status } : review,
        ),
      );
    } catch {
      setError("Review service unavailable.");
    } finally {
      setBusyReviewId("");
    }
  }

  return (
    <main className="admin-main admin-review-main">
        <section className="admin-summary-grid" aria-label="Review summary">
          <AdminMetricCard label="Pending" value={pendingCount} icon={<Clock3 size={20} />} index={0} />
          <AdminMetricCard label="Published" value={publishedReviews.length} icon={<ClipboardCheck size={20} />} index={1} />
          <AdminMetricCard label="Average rating" value={publishedReviews.length === 0 ? "—" : averagePublished.toFixed(1) + "/5"} icon={<Star size={20} />} index={2} />
          <AdminMetricCard label="Total reviews" value={reviews.length} icon={<MessageSquareText size={20} />} index={3} />
        </section>

        <div
          className="admin-filter-bar"
          role="group"
          aria-label="Review filters"
        >
          {filters.map((entry) => (
            <Button
              variant={filter === entry.value ? "default" : "outline"}
              className={filter === entry.value ? "is-active" : ""}
              type="button"
              key={entry.value}
              aria-pressed={filter === entry.value}
              onClick={() => setFilter(entry.value)}
            >
              {entry.label}
              {entry.value === "pending" && pendingCount > 0
                ? " (" + pendingCount + ")"
                : ""}
            </Button>
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
              <strong>No reviews match this filter.</strong>
            </div>
          ) : (
            visibleReviews.map((review) => (
              <Card
                className={
                  "admin-review-card admin-review-card--" + review.status
                }
                key={review.id}
              >
                <div className="admin-review-card__header">
                  <div>
                    <div className="admin-review-card__badges">
                      <Badge
                        variant="secondary"
                        className={
                          "admin-review-status admin-review-status--" +
                          review.status
                        }
                      >
                        {review.status}
                      </Badge>
                      <Badge variant="outline" className="admin-review-verified">
                        Verified order
                      </Badge>
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
                  {review.message || "Rating only."}
                </p>

                <div className="admin-review-card__actions">
                  {review.status !== "published" && (
                    <Button
                      variant="default"
                      className="admin-primary-action"
                      type="button"
                      disabled={busyReviewId === review.id}
                      onClick={() => void updateStatus(review.id, "published")}
                    >
                      {busyReviewId === review.id ? "Updating…" : "Publish"}
                    </Button>
                  )}

                  {review.status !== "hidden" && (
                    <Button
                      variant="outline"
                      className="admin-secondary-action"
                      type="button"
                      disabled={busyReviewId === review.id}
                      onClick={() => void updateStatus(review.id, "hidden")}
                    >
                      Hide
                    </Button>
                  )}

                  {review.status !== "flagged" && (
                    <Button
                      variant="outline"
                      className="admin-secondary-action"
                      type="button"
                      disabled={busyReviewId === review.id}
                      onClick={() => void updateStatus(review.id, "flagged")}
                    >
                      Flag
                    </Button>
                  )}

                  {review.status !== "pending" && (
                    <Button
                      variant="outline"
                      className="admin-review-pending-action"
                      type="button"
                      disabled={busyReviewId === review.id}
                      onClick={() => void updateStatus(review.id, "pending")}
                    >
                      Mark pending
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </section>
    </main>
  );
}
