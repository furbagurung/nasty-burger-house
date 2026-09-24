"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  homepageReviews,
  homepageReviewsArePreview,
  type HomepageReview,
} from "../data/homepage-reviews";

function ReviewAvatar({ review }: { review: HomepageReview }) {
  const [failed, setFailed] = useState(false);
  const initials = review.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (failed) {
    return (
      <span className="home-testimonial-card__avatar home-testimonial-card__avatar--fallback">
        {initials}
      </span>
    );
  }

  return (
    <span className="home-testimonial-card__avatar">
      <Image
        src={review.avatar}
        alt=""
        width={48}
        height={48}
        onError={() => setFailed(true)}
      />
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

    return Math.min(closestIndex, homepageReviews.length - 1);
  };

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track || homepageReviews.length === 0) return;

    const cards = Array.from(track.children) as HTMLElement[];
    const targetIndex =
      (index + homepageReviews.length) % homepageReviews.length;
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
    if (homepageReviews.length < 2) return;

    const interval = window.setInterval(() => {
      if (dragRef.current.active) return;
      goTo(getClosestIndex() + 1);
    }, 4200);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(
    () => () => {
      if (momentumFrameRef.current !== null) {
        window.cancelAnimationFrame(momentumFrameRef.current);
      }
    },
    [],
  );

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

          <Link className="home-testimonials__cta" href="/reviews">
            Leave a review <span aria-hidden="true">↗</span>
          </Link>
        </div>

        {homepageReviewsArePreview && (
          <p className="home-testimonials__preview-note">
            Review cards shown as design preview.
          </p>
        )}

        {homepageReviews.length > 0 && (
          <>
            <div
              ref={trackRef}
              className={`home-testimonials__track${isDragging ? " is-dragging" : ""}`}
              tabIndex={0}
              aria-label={
                homepageReviewsArePreview
                  ? "Fictional review design preview"
                  : "Customer testimonials"
              }
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
              {homepageReviews.map((review, index) => (
                <article
                  className="home-testimonial-card"
                  key={review.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${homepageReviews.length}: ${review.name}`}
                >
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
                      {review.sourceUrl ? (
                        <a
                          href={review.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {review.sourceLabel || "Customer review"} ↗
                        </a>
                      ) : (
                        <span>
                          {homepageReviewsArePreview
                            ? "Design preview"
                            : review.sourceLabel || "Customer review"}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div
              className="home-testimonials__indicators"
              aria-label="Testimonial slides"
            >
              {homepageReviews.map((review, index) => (
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
