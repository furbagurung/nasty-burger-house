"use client";

import { useEffect } from "react";

const COMING_SOON_DESCRIPTION =
  "A new limited-time Beast is being cooked up. Watch this space — the next Beast of the Month is coming soon.";

function applyComingSoonState() {
  const slides = Array.from(
    document.querySelectorAll<HTMLElement>(".hero-carousel .hero-slide"),
  );
  const monthlySlide = slides.find((slide) =>
    slide.textContent?.includes("Beast of the Month"),
  );

  if (monthlySlide) {
    const eyebrow = monthlySlide.querySelector<HTMLElement>(".eyebrow");
    const heading = monthlySlide.querySelector<HTMLElement>("h1, h2");
    const description = monthlySlide.querySelector<HTMLElement>(
      ".hero-slide__copy > p:not(.eyebrow)",
    );
    const image = monthlySlide.querySelector<HTMLImageElement>(".hero-slide__image");
    const cta = monthlySlide.querySelector<HTMLButtonElement | HTMLAnchorElement>(
      ".hero-card__cta",
    );

    if (eyebrow && eyebrow.textContent !== "Coming soon") {
      eyebrow.textContent = "Coming soon";
    }
    if (heading && heading.textContent !== "Beast of the Month") {
      heading.textContent = "Beast of the Month";
    }
    if (description && description.textContent !== COMING_SOON_DESCRIPTION) {
      description.textContent = COMING_SOON_DESCRIPTION;
    }
    if (image && !image.src.endsWith("/images/home-menu/beast-of-the-month.jpg")) {
      image.removeAttribute("srcset");
      image.src = "/images/home-menu/beast-of-the-month.jpg";
      image.alt = "Nasty Burger House Beast of the Month coming soon";
    }
    if (cta) {
      cta.textContent = "Coming Soon";
      cta.setAttribute("aria-disabled", "true");
      cta.classList.add("is-coming-soon");
      if (cta instanceof HTMLButtonElement) cta.disabled = true;
      if (cta instanceof HTMLAnchorElement) {
        cta.href = "/beast-of-the-month";
        cta.removeAttribute("aria-disabled");
      }
    }
  }

  const feature = document.querySelector<HTMLElement>(".home-feature--bbq");
  if (feature) {
    const eyebrow = feature.querySelector<HTMLElement>(".eyebrow");
    const heading = feature.querySelector<HTMLElement>("h2");
    const description = feature.querySelector<HTMLElement>(".home-feature__copy > p:not(.eyebrow)");
    const image = feature.querySelector<HTMLImageElement>(".home-feature__image img");
    const button = feature.querySelector<HTMLButtonElement>("button");

    if (eyebrow) eyebrow.textContent = "Beast of the Month · Coming soon";
    if (heading) heading.textContent = "A new Beast is loading.";
    if (description) description.textContent = COMING_SOON_DESCRIPTION;
    if (image && !image.src.endsWith("/images/home-menu/beast-of-the-month.jpg")) {
      image.removeAttribute("srcset");
      image.src = "/images/home-menu/beast-of-the-month.jpg";
      image.alt = "Nasty Burger House Beast of the Month coming soon";
    }
    if (button) {
      button.textContent = "Coming soon";
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
    }
  }
}

export default function HomeBeastMonthEnhancer() {
  useEffect(() => {
    applyComingSoonState();

    const monthlySlideIndex = Array.from(
      document.querySelectorAll<HTMLElement>(".hero-carousel .hero-slide"),
    ).findIndex((slide) => slide.textContent?.includes("Beast of the Month"));

    if (monthlySlideIndex >= 0) {
      const dots = Array.from(
        document.querySelectorAll<HTMLButtonElement>(".hero-carousel__dots button"),
      );
      window.setTimeout(() => dots[monthlySlideIndex]?.click(), 0);
    }

    const root = document.querySelector<HTMLElement>(".home-main");
    if (!root) return;

    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(applyComingSoonState);
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, []);

  return (
    <style>{`
      .hero-card__cta.is-coming-soon,
      .home-feature--bbq button:disabled {
        cursor: default !important;
        opacity: 0.9;
      }

      .hero-slide:has(.hero-card__cta.is-coming-soon) .hero-slide__shade {
        background: linear-gradient(90deg, rgba(9, 8, 7, 0.82), rgba(9, 8, 7, 0.36)) !important;
      }
    `}</style>
  );
}
