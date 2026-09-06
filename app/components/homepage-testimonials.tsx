"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

const testimonials = [
  {
    quote:
      "The burger is stacked, juicy and properly messy — exactly the kind of feed you order when you are seriously hungry.",
    detail: "Burger order",
  },
  {
    quote:
      "The Beast Box is made for sharing. Burgers, fries and sides all in one hit without overthinking the order.",
    detail: "Beast Box order",
  },
  {
    quote:
      "Quick pickup, big portions and the burger still tastes fresh off the grill when you open the bag.",
    detail: "Pickup order",
  },
];

const reviewVideos = [
  {
    src: "/videos/nasty-reel-01.mp4",
    poster: "/images/signature-beast.webp",
  },
  {
    src: "/videos/nasty-reel-02.mp4",
    poster: "/images/bbq-beast-hero.webp",
  },
  {
    src: "/videos/nasty-reel-03.mp4",
    poster: "/images/beast-box-hero.webp",
  },
];

export default function HomepageTestimonials() {
  const pathname = usePathname();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [failedReels, setFailedReels] = useState<Record<string, boolean>>({});

  useLayoutEffect(() => {
    if (pathname !== "/") {
      setTarget(null);
      return;
    }

    const findTarget = () => {
      const main = document.querySelector<HTMLElement>(".site-shell > .home-main");
      setTarget(main);
      return Boolean(main);
    };

    if (findTarget()) return;

    const observer = new MutationObserver(() => {
      if (findTarget()) observer.disconnect();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    const timer = window.setTimeout(() => {
      findTarget();
      observer.disconnect();
    }, 500);

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [pathname]);

  if (pathname !== "/" || !target) return null;

  return createPortal(
    <>
      <section className="home-testimonials" aria-labelledby="home-testimonials-title">
        <div className="home-testimonials__heading">
          <div>
            <p className="home-testimonials__eyebrow">The Nasty crowd</p>
            <h2 id="home-testimonials-title">What people are saying.</h2>
            <p>
              A dedicated review area for customer feedback, backed by the verified-order review flow already built into the site.
            </p>
          </div>
          <Link className="home-testimonials__cta" href="/reviews">
            Leave a verified review
          </Link>
        </div>

        <div className="home-testimonials__grid" aria-label="Sample testimonial cards">
          {testimonials.map((testimonial) => (
            <article className="home-testimonial-card" key={testimonial.detail}>
              <div className="home-testimonial-card__topline">
                <span className="home-testimonial-card__stars" aria-label="Five star sample review">
                  ★★★★★
                </span>
                <span className="home-testimonial-card__sample">Sample review</span>
              </div>
              <blockquote>“{testimonial.quote}”</blockquote>
              <div className="home-testimonial-card__footer">
                <span className="home-testimonial-card__avatar" aria-hidden="true">N</span>
                <div>
                  <strong>Customer testimonial</strong>
                  <span>{testimonial.detail}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="home-testimonials__trust">
          <strong>Real review system, real completed orders.</strong>
          <span>The cards above are sample copy for the homepage layout and can be replaced with published customer reviews.</span>
        </div>
      </section>

      <section className="home-reels" aria-labelledby="home-reels-title">
        <div className="home-reels__heading">
          <div>
            <p className="home-reels__eyebrow">Customer stories</p>
            <h2 id="home-reels-title">Video reviews.</h2>
            <p>Watch real customer review videos in a vertical reel format.</p>
          </div>
          <span className="home-reels__hint">Swipe to watch →</span>
        </div>

        <div className="home-reels__track" aria-label="Customer video reviews">
          {reviewVideos.map((reel, index) => (
            <article className="home-reel-card" key={reel.src}>
              <div className="home-reel-card__media">
                {failedReels[reel.src] ? (
                  <div
                    className="home-reel-card__fallback"
                    style={{ backgroundImage: `url(${reel.poster})` }}
                    role="img"
                    aria-label={`Customer review video ${index + 1} preview`}
                  >
                    <span className="home-reel-card__play" aria-hidden="true">▶</span>
                  </div>
                ) : (
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    poster={reel.poster}
                    aria-label={`Customer review video ${index + 1}`}
                    onError={() =>
                      setFailedReels((current) => ({
                        ...current,
                        [reel.src]: true,
                      }))
                    }
                  >
                    <source src={reel.src} type="video/mp4" />
                  </video>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>,
    target,
  );
}
