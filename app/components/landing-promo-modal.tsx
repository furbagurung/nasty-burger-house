"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { readSignedInCustomerProfile } from "../lib/customer-store";
import { getBrowserClientOrNull } from "../lib/supabase/client";

// Remember when the popup was last displayed, not when it was dismissed.
// A rolling 24-hour cooldown also avoids a popup at 11:59pm and again at midnight.
const LAST_SHOWN_KEY = "nbh-drip-points-promo-last-shown-at";
const PROMO_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function shownInLast24Hours() {
  try {
    const stored = window.localStorage.getItem(LAST_SHOWN_KEY);
    if (!stored) return false;
    const lastShownAt = Number(stored);
    const elapsed = Date.now() - lastShownAt;
    return Number.isFinite(lastShownAt) && elapsed >= 0 && elapsed < PROMO_COOLDOWN_MS;
  } catch {
    // Storage may be disabled; never break the homepage for a promotion.
    return false;
  }
}

function rememberPromoShown() {
  try {
    window.localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
  } catch {
    // Storage unavailable: the modal still works for this visit.
  }
}

export default function LandingPromoModal() {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let frame = 0;

    async function maybeOpenPromo() {
      const params = new URLSearchParams(window.location.search);
      const hasRequestedOverlay = ["item", "cart", "loyalty", "order"].some(
        (key) => params.has(key),
      );

      if (hasRequestedOverlay || readSignedInCustomerProfile() || shownInLast24Hours()) return;

      const supabase = getBrowserClientOrNull();

      if (supabase) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (cancelled || user) return;
        } catch {
          if (cancelled) return;
        }
      }

      frame = window.requestAnimationFrame(() => {
        if (cancelled || shownInLast24Hours()) return;
        rememberPromoShown();
        setOpen(true);
      });
    }

    void maybeOpenPromo();

    return () => {
      cancelled = true;
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    // Another tab may have shown the promotion first. Close this instance
    // rather than showing duplicates across browser tabs.
    function handleStorage(event: StorageEvent) {
      if (event.key === LAST_SHOWN_KEY && shownInLast24Hours()) {
        setOpen(false);
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
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
