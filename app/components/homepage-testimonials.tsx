"use client";

import ButtonWithIcon from "@/components/ui/button-witn-icon";
import { homepageReviews as designPreviewReviews } from "../data/homepage-reviews";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
type HomepageReview = {
  id: string;
  name: string;
  quote: string;
  rating: 1 | 2 | 3 | 4 | 5;
  kind: "verified" | "design-preview";
};

// Keep enough cards for the three-column desktop design while genuine reviews
// accumulate. Demo cards are ALWAYS visibly identified as fictional samples.
// Never insert samples in Supabase, count them as real reviews, or show the
// "Verified purchase" label on one of them.
const MIN_CAROUSEL_CARDS = 3;
type PublishedReview = {
  id: string;
  displayName: string;
  message: string;
  rating: number;
  verifiedPurchase: boolean;
};

function ReviewAvatar({ review }: { review: HomepageReview }) {
  const initials = review.name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      className="home-testimonial-card__avatar home-testimonial-card__avatar--fallback"
      aria-hidden="true"
    >
      {initials || "NB"}
    </span>
  );
}

function RatingStars({ rating }: { rating: HomepageReview["rating"] }) {
  return (
    <span
      className="home-testimonial-card__stars"
      aria-label={`${rating} out of 5 stars`}
    >
      <span aria-hidden="true">{"★".repeat(rating)}</span>
    </span>
  );
}

export default function HomepageTestimonials() {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startScrollLeft: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    moved: false,
  });
  const momentumFrameRef = useRef<number | null>(null);
  const [reviews, setReviews] = useState<HomepageReview[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [active, setActive] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const getClosestIndex = () => {
    const track = trackRef.current;
    if (!track) return 0;

    const cards = Array.from(track.children) as HTMLElement[];
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const distance = Math.abs(
        card.offsetLeft - track.offsetLeft - track.scrollLeft,
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return Math.min(closestIndex, Math.max(0, reviews.length - 1));
  };

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track || reviews.length === 0) return;

    const cards = Array.from(track.children) as HTMLElement[];
    const targetIndex =
      (index + reviews.length) % reviews.length;
    const target = cards[targetIndex];
    if (!target) return;

    track.scrollTo({
      left: target.offsetLeft - track.offsetLeft,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
    setActive(targetIndex);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;

    const track = trackRef.current;
    if (!track) return;

    event.preventDefault();

    if (momentumFrameRef.current !== null) {
      window.cancelAnimationFrame(momentumFrameRef.current);
      momentumFrameRef.current = null;
    }

    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: track.scrollLeft,
      lastX: event.clientX,
      lastTime: performance.now(),
      velocity: 0,
      moved: false,
    };

    track.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    const drag = dragRef.current;
    if (!track || !drag.active || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const now = performance.now();
    const elapsed = Math.max(now - drag.lastTime, 1);
    const frameDelta = event.clientX - drag.lastX;

    drag.velocity = frameDelta / elapsed;
    drag.lastX = event.clientX;
    drag.lastTime = now;

    if (Math.abs(deltaX) > 4) drag.moved = true;

    if (drag.moved) {
      event.preventDefault();
      track.scrollLeft = drag.startScrollLeft - deltaX;
    }
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    const drag = dragRef.current;
    if (!track || !drag.active || drag.pointerId !== event.pointerId) return;

    dragRef.current.active = false;
    dragRef.current.pointerId = -1;
    setIsDragging(false);

    if (track.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId);
    }

    if (!drag.moved) return;

    let velocity = -drag.velocity * 24;

    const glide = () => {
      const currentTrack = trackRef.current;
      if (!currentTrack) return;

      currentTrack.scrollLeft += velocity;
      velocity *= 0.94;

      if (Math.abs(velocity) > 0.18) {
        momentumFrameRef.current = window.requestAnimationFrame(glide);
        return;
      }

      momentumFrameRef.current = null;
      setActive(getClosestIndex());
    };

    momentumFrameRef.current = window.requestAnimationFrame(glide);
  };

  useEffect(() => {
    if (reviews.length < 2) return;

    const interval = window.setInterval(() => {
      if (dragRef.current.active) return;
      goTo(getClosestIndex() + 1);
    }, 4200);

    return () => window.clearInterval(interval);
  }, [reviews.length]);

  useEffect(
    () => () => {
      if (momentumFrameRef.current !== null) {
        window.cancelAnimationFrame(momentumFrameRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    let mounted = true;

    async function loadPublishedReviews() {
      try {
        const response = await fetch("/api/reviews", { cache: "no-store" });
        const result = (await response.json()) as {
          ok?: boolean;
          reviews?: PublishedReview[];
        };

        if (!response.ok || !result.ok || !Array.isArray(result.reviews)) {
          throw new Error("Could not load published reviews");
        }

        // The API returns published reviews only. Validate public fields and
        // don't render unverified entries or customer contact information.
        const verified = result.reviews
          .filter(
            (review) =>
              review.verifiedPurchase === true &&
              typeof review.id === "string" &&
              typeof review.displayName === "string" &&
              typeof review.message === "string" &&
              Number.isInteger(review.rating) &&
              review.rating >= 1 &&
              review.rating <= 5,
          )
          .slice(0, 12)
          .map((review): HomepageReview => ({
            id: review.id,
            name: review.displayName,
            quote: review.message.trim() || "Left a verified rating.",
            rating: review.rating as HomepageReview["rating"],
            kind: "verified",
          }));

        // Real reviews always come first. Each additional real review removes
        // one illustrative sample; at 3+ approved reviews no demos remain.
        const placeholders = designPreviewReviews
          .slice(0, Math.max(0, MIN_CAROUSEL_CARDS - verified.length))
          .map(
            (review): HomepageReview => ({
              id: `sample:${review.id}`,
              name: review.name,
              quote: review.quote,
              rating: review.rating,
              kind: "design-preview",
            }),
          );

        if (!mounted) return;
        setReviews([...verified, ...placeholders]);
        setActive(0);
        setExpanded(null);
        setLoadState("ready");
      } catch {
        if (mounted) setLoadState("error");
      }
    }

    void loadPublishedReviews();
    // Also refresh when returning from admin moderation in another tab.
    window.addEventListener("focus", loadPublishedReviews);
    return () => {
      mounted = false;
      window.removeEventListener("focus", loadPublishedReviews);
    };
  }, []);

  return (
    <section
      className="home-testimonials"
      aria-labelledby="home-testimonials-title"
      aria-roledescription="carousel"
    >
      <div className="home-testimonials__inner">
        <div className="home-testimonials__heading">
          <div>
            <p className="home-testimonials__eyebrow">The Nasty crowd</p>
            <h2 id="home-testimonials-title">
              What people are <span>saying.</span>
            </h2>
          </div>

          <ButtonWithIcon href="/reviews" tone="dark">
            Leave a review
          </ButtonWithIcon>
        </div>

        {loadState === "loading" && (
          <p className="home-testimonials__empty" role="status">
            Loading verified customer reviews…
          </p>
        )}
        {loadState === "error" && (
          <p className="home-testimonials__empty" role="status">
            Customer reviews are temporarily unavailable.
          </p>
        )}
        {loadState === "ready" && reviews.some((review) => review.kind === "design-preview") && (
          <p className="home-testimonials__preview-note">
            Some cards are fictional design examples until more verified reviews arrive.
          </p>
        )}

        {loadState === "ready" && reviews.length > 0 && (
          <>
            <div
              ref={trackRef}
              className={`home-testimonials__track${isDragging ? " is-dragging" : ""}`}
              tabIndex={0}
              aria-label="Customer reviews and clearly labeled illustrative examples"
              onScroll={() => setActive(getClosestIndex())}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onDragStart={(event) => event.preventDefault()}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (
                  event.key === "ArrowLeft" ||
                  event.key === "ArrowRight"
                ) {
                  event.preventDefault();
                  goTo(active + (event.key === "ArrowRight" ? 1 : -1));
                }
              }}
            >
              {reviews.map((review, index) => (
                <article
                  className={`home-testimonial-card${review.kind === "design-preview" ? " home-testimonial-card--preview" : ""}`}
                  key={review.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${reviews.length}: ${review.name}${review.kind === "design-preview" ? " (fictional design example)" : " (verified review)"}`}
                >
                  {review.kind === "design-preview" && (
                    <span className="home-testimonial-card__sample-tag">
                      Fictional design example
                    </span>
                  )}
                  <span
                    className="home-testimonial-card__quote-mark"
                    aria-hidden="true"
                  >
                    “
                  </span>

                  <div className="home-testimonial-card__quote">
                    <blockquote
                      className={
                        expanded === index
                          ? "is-expanded"
                          : undefined
                      }
                    >
                      {review.quote}
                    </blockquote>

                    {review.quote.length > 135 && (
                      <button
                        type="button"
                        className="home-testimonial-card__read-more"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() =>
                          setExpanded((current) =>
                            current === index ? null : index,
                          )
                        }
                        aria-expanded={expanded === index}
                      >
                        {expanded === index ? "Show less" : "Read more"}
                      </button>
                    )}
                  </div>

                  <div className="home-testimonial-card__footer">
                    <ReviewAvatar review={review} />
                    <div className="home-testimonial-card__identity">
                      <div>
                        <strong>{review.name}</strong>
                        <RatingStars rating={review.rating} />
                      </div>
                      <span>
                        {review.kind === "verified"
                          ? "Verified purchase · Approved review"
                          : "Sample only · Not customer feedback"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div
              className="home-testimonials__indicators"
              aria-label="Testimonial slides"
            >
              {reviews.map((review, index) => (
                <button
                  key={review.id}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Go to testimonial ${index + 1}: ${review.name}`}
                  aria-current={active === index ? "true" : undefined}
                  className={active === index ? "is-active" : undefined}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
