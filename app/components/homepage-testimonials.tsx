"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
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
    mp4: "https://res.cloudinary.com/qhd4ecgt/video/upload/f_mp4,vc_h264,ac_aac/v1788706765/review-02.mov",
    original:
      "https://res.cloudinary.com/qhd4ecgt/video/upload/v1788706765/review-02.mov",
    poster:
      "https://res.cloudinary.com/qhd4ecgt/video/upload/so_0,f_jpg,q_auto/v1788706765/review-02.jpg",
  },
  {
    mp4: "https://res.cloudinary.com/qhd4ecgt/video/upload/f_mp4,vc_h264,ac_aac/v1788706753/review-03.mov",
    original:
      "https://res.cloudinary.com/qhd4ecgt/video/upload/v1788706753/review-03.mov",
    poster:
      "https://res.cloudinary.com/qhd4ecgt/video/upload/so_0,f_jpg,q_auto/v1788706753/review-03.jpg",
  },
  {
    mp4: "https://res.cloudinary.com/qhd4ecgt/video/upload/f_mp4,vc_h264,ac_aac/v1788706744/review-01.mov",
    original:
      "https://res.cloudinary.com/qhd4ecgt/video/upload/v1788706744/review-01.mov",
    poster:
      "https://res.cloudinary.com/qhd4ecgt/video/upload/so_0,f_jpg,q_auto/v1788706744/review-01.jpg",
  },
  {
    mp4: "https://res.cloudinary.com/qhd4ecgt/video/upload/f_mp4,vc_h264,ac_aac/v1788706738/review-04.mov",
    original:
      "https://res.cloudinary.com/qhd4ecgt/video/upload/v1788706738/review-04.mov",
    poster:
      "https://res.cloudinary.com/qhd4ecgt/video/upload/so_0,f_jpg,q_auto/v1788706738/review-04.jpg",
  },
];

export default function HomepageTestimonials() {
  const pathname = usePathname();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [playingReels, setPlayingReels] = useState<Record<number, boolean>>({});
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);

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

  async function playReviewVideo(index: number) {
    const video = videoRefs.current[index];
    if (!video) return;

    try {
      await video.play();
    } catch {
      video.controls = true;
    }
  }

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
            <article className="home-reel-card" key={reel.original}>
              <div className="home-reel-card__media">
                <video
                  ref={(element) => {
                    videoRefs.current[index] = element;
                  }}
                  controls
                  playsInline
                  preload="metadata"
                  poster={reel.poster}
                  aria-label={`Customer review video ${index + 1}`}
                  onPlay={() =>
                    setPlayingReels((current) => ({ ...current, [index]: true }))
                  }
                  onPause={() =>
                    setPlayingReels((current) => ({ ...current, [index]: false }))
                  }
                  onEnded={() =>
                    setPlayingReels((current) => ({ ...current, [index]: false }))
                  }
                >
                  <source src={reel.mp4} type="video/mp4" />
                  <source src={reel.original} type="video/quicktime" />
                </video>
                {!playingReels[index] && (
                  <button
                    className="home-reel-card__native-play"
                    type="button"
                    onClick={() => void playReviewVideo(index)}
                    aria-label={`Play customer review video ${index + 1}`}
                  >
                    <span aria-hidden="true">▶</span>
                  </button>
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
