"use client";

import Link from "next/link";
import { homepageReviews, homepageReviewsArePreview, type HomepageReview } from "../data/homepage-reviews";
import InfiniteMovingCards from "./infinite-moving-cards";

function ReviewCard({ review }: { review: HomepageReview }) {
  return (
    <article className="home-testimonial-card">
      <div className="home-testimonial-card__rating-row">
        <span className="home-testimonial-card__stars" aria-label={`${review.rating} out of 5 stars`}>
          <span aria-hidden="true">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
        </span>
        <span className="home-testimonial-card__quote-mark" aria-hidden="true">“</span>
      </div>
      <blockquote>“{review.quote}”</blockquote>
      <div className="home-testimonial-card__profile">
        <div className="home-testimonial-card__profile-copy">
          <strong>{review.name}</strong>
          {review.sourceUrl ? (
            <a href={review.sourceUrl} target="_blank" rel="noopener noreferrer">
              {review.sourceLabel || "Read review"} <span aria-hidden="true">↗</span>
              <span className="home-testimonials__sr-only"> by {review.name} (opens in a new tab)</span>
            </a>
          ) : !homepageReviewsArePreview ? <span>Customer review</span> : null}
        </div>
      </div>
    </article>
  );
}

export default function HomepageTestimonials() {
  return (
    <section className="home-testimonials" aria-labelledby="home-testimonials-title">
      <div className="home-testimonials__heading">
        <div>
          <p className="home-testimonials__eyebrow">The Nasty crowd</p>
          <h2 id="home-testimonials-title">What people are saying.</h2>
          <p>{homepageReviewsArePreview
            ? <></>
            : homepageReviews.length > 0
              ? "Big bites. Honest opinions. In our customers’ own words."
              : "Had a Nasty feed? We’d love to hear how it was."}</p>
        </div>
        <Link className="home-testimonials__cta" href="/reviews">
          Leave a verified review <span aria-hidden="true">↗</span>
        </Link>
      </div>
      {homepageReviews.length > 0 && (
        <InfiniteMovingCards
          items={homepageReviews}
          label={homepageReviewsArePreview ? "Fictional review design preview" : "Customer reviews"}
          renderItem={(review) => <ReviewCard review={review} />}
        />
      )}
    </section>
  );
}
