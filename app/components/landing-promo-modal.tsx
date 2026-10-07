"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "nasty-loyalty-promo-seen-v1";

export default function LandingPromoModal() {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasRequestedOverlay = ["item", "cart", "loyalty", "order"].some((key) =>
      params.has(key),
    );

    if (
      hasRequestedOverlay ||
      window.sessionStorage.getItem(SESSION_KEY) === "1"
    ) {
      return;
    }

    window.sessionStorage.setItem(SESSION_KEY, "1");
    const frame = window.requestAnimationFrame(() => setOpen(true));

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="landing-promo-modal" role="presentation">
      <button
        className="landing-promo-modal__backdrop"
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Close promotion"
      />

      <section
        className="landing-promo-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Drip Points promotion"
      >
        <button
          ref={closeButtonRef}
          className="landing-promo-modal__close"
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close promotion"
        >
          ×
        </button>

        <Link
          className="landing-promo-modal__poster"
          href="/drip-points"
          onClick={() => setOpen(false)}
          aria-label="View Drip Points"
        >
          <Image
            src="/images/loyalty-poster.png"
            alt="Nasty Burger House Drip Points promotion"
            fill
            priority
            sizes="(max-width: 680px) 88vw, 30rem"
          />
        </Link>
      </section>
    </div>
  );
}
