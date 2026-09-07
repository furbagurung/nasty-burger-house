"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ReviewStories from "./review-stories";

const testimonials = [
  {
    quote:
      "The burger is stacked, juicy and properly messy — exactly the kind of feed you order when you are seriously hungry.",
    name: "Sample customer A",
    initial: "A",
    detail: "Burger order preview",
    avatarTone: "red",
  },
  {
    quote:
      "The Beast Box is made for sharing. Burgers, fries and sides all in one hit without overthinking the order.",
    name: "Sample customer J",
    initial: "J",
    detail: "Beast Box preview",
    avatarTone: "gold",
  },
  {
    quote:
      "Quick pickup, big portions and the burger still tastes fresh off the grill when you open the bag.",
    name: "Sample customer S",
    initial: "S",
    detail: "Pickup order preview",
    avatarTone: "dark",
  },
];

export default function HomepageTestimonials() {
  const pathname = usePathname();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [storiesTarget, setStoriesTarget] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (pathname !== "/") {
      setTarget(null);
      setStoriesTarget(null);
      return;
    }

    let storiesHost: HTMLDivElement | null = null;
    let observer: MutationObserver | null = null;
    let retryTimer: number | null = null;
    let startTimer: number | null = null;

    const findTargets = () => {
      const main = document.querySelector<HTMLElement>(".site-shell > .home-main");
      const features = document.querySelector<HTMLElement>(".home-features");

      if (main) setTarget(main);

      if (features?.parentElement) {
        storiesHost = document.querySelector<HTMLDivElement>(
          ".review-stories-home-host",
        );

        if (!storiesHost) {
          storiesHost = document.createElement("div");
          storiesHost.className = "review-stories-home-host";
          features.parentElement.insertBefore(storiesHost, features);
        }

        setStoriesTarget(storiesHost);
      }

      return Boolean(main && storiesHost);
    };

    const start = () => {
      if (findTargets()) return;

      observer = new MutationObserver(() => {
        if (findTargets()) observer?.disconnect();
      });

      observer.observe(document.body, { childList: true, subtree: true });
      retryTimer = window.setTimeout(() => {
        findTargets();
        observer?.disconnect();
      }, 500);
    };

    if (document.readyState === "complete") {
      startTimer = window.setTimeout(start, 0);
    } else {
      window.addEventListener("load", start, { once: true });
    }

    return () => {
      window.removeEventListener("load", start);
      if (startTimer !== null) window.clearTimeout(startTimer);
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      observer?.disconnect();
      storiesHost?.remove();
    };
  }, [pathname]);

  if (pathname !== "/") return null;

  return (
    <>
      {target &&
        createPortal(
          <section className="home-testimonials" aria-labelledby="home-testimonials-title">
            <div className="home-testimonials__heading">
              <div>
                <p className="home-testimonials__eyebrow">The Nasty crowd</p>
                <h2 id="home-testimonials-title">What people are saying.</h2>
                <p>
                  Review-style previews for the homepage. Published customer reviews can replace these sample cards as they come in.
                </p>
              </div>
              <Link className="home-testimonials__cta" href="/reviews">
                Leave a verified review
              </Link>
            </div>

            <div className="home-testimonials__grid" aria-label="Sample testimonial cards">
              {testimonials.map((testimonial) => (
                <article className="home-testimonial-card" key={testimonial.name}>
                  <div className="home-testimonial-card__profile">
                    <span
                      className={`home-testimonial-card__avatar home-testimonial-card__avatar--${testimonial.avatarTone}`}
                      aria-hidden="true"
                    >
                      {testimonial.initial}
                    </span>
                    <div className="home-testimonial-card__profile-copy">
                      <strong>{testimonial.name}</strong>
                      <span>{testimonial.detail}</span>
                    </div>
                    <span className="home-testimonial-card__sample">Sample</span>
                  </div>

                  <div className="home-testimonial-card__rating-row">
                    <strong>5.0</strong>
                    <span className="home-testimonial-card__stars" aria-label="Five star sample rating">
                      ★★★★★
                    </span>
                    <span className="home-testimonial-card__review-source">Review preview</span>
                  </div>

                  <blockquote>“{testimonial.quote}”</blockquote>

                  <div className="home-testimonial-card__meta">
                    <span>Sample content for layout preview</span>
                    <span aria-hidden="true">·</span>
                    <span>Not a published Google review</span>
                  </div>
                </article>
              ))}
            </div>

            <div className="home-testimonials__trust">
              <strong>Real review flow, clearly marked sample cards.</strong>
              <span>Replace these previews with genuine published customer reviews once available.</span>
            </div>
          </section>,
          target,
        )}

      {storiesTarget && createPortal(<ReviewStories />, storiesTarget)}
    </>
  );
}
