"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import ReviewStories from "./review-stories";

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

export default function HomepageTestimonials() {
  const pathname = usePathname();
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (pathname !== "/") {
      // The portal target belongs to the previous route's external DOM.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

      <ReviewStories />
    </>,
    target,
  );
}
