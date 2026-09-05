"use client";

import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

function mobileViewport() {
  return window.matchMedia("(max-width: 680px)").matches;
}

export default function MobileHeroControls() {
  const pathname = usePathname();
  const [heroRoot, setHeroRoot] = useState<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (pathname !== "/") {
      setHeroRoot(null);
      return;
    }

    const findHero = () => {
      const hero = document.querySelector<HTMLElement>(".hero-carousel");
      if (hero) setHeroRoot(hero);
      return Boolean(hero);
    };

    if (findHero()) return;

    const observer = new MutationObserver(() => {
      if (findHero()) observer.disconnect();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (!heroRoot || pathname !== "/") return;

    const syncState = () => {
      const slides = Array.from(
        heroRoot.querySelectorAll<HTMLElement>(".hero-slide"),
      );
      const nextIndex = Math.max(
        0,
        slides.findIndex((slide) => slide.classList.contains("is-active")),
      );
      const activeSlide = slides[nextIndex];
      const playback = activeSlide?.querySelector<HTMLButtonElement>(
        ".hero-carousel__playback",
      );

      setSlideCount(slides.length);
      setActiveIndex(nextIndex);
      setIsPaused(
        playback?.getAttribute("aria-label")?.toLowerCase().startsWith("play") ??
          false,
      );
    };

    syncState();

    const mutationObserver = new MutationObserver(syncState);
    mutationObserver.observe(heroRoot, {
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "aria-label"],
    });

    let startX = 0;
    let startY = 0;
    let tracking = false;

    const trigger = (kind: "previous" | "next" | "playback") => {
      const activeSlide = heroRoot.querySelector<HTMLElement>(
        ".hero-slide.is-active",
      );
      const controls = activeSlide?.querySelector<HTMLElement>(
        ".hero-carousel__controls",
      );
      if (!controls) return;

      const directButtons = Array.from(controls.children).filter(
        (child): child is HTMLButtonElement => child instanceof HTMLButtonElement,
      );

      const button =
        kind === "previous"
          ? directButtons[0]
          : kind === "next"
            ? directButtons[1]
            : directButtons[2];

      button?.click();
      window.setTimeout(syncState, 0);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!mobileViewport()) return;
      if ((event.target as HTMLElement).closest("a, button")) return;
      tracking = true;
      startX = event.clientX;
      startY = event.clientY;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!tracking || !mobileViewport()) return;
      tracking = false;

      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      if (Math.abs(deltaX) < 46 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.15) {
        return;
      }

      trigger(deltaX < 0 ? "next" : "previous");
    };

    const cancelPointer = () => {
      tracking = false;
    };

    heroRoot.addEventListener("pointerdown", onPointerDown, { passive: true });
    heroRoot.addEventListener("pointerup", onPointerUp, { passive: true });
    heroRoot.addEventListener("pointercancel", cancelPointer, { passive: true });

    return () => {
      mutationObserver.disconnect();
      heroRoot.removeEventListener("pointerdown", onPointerDown);
      heroRoot.removeEventListener("pointerup", onPointerUp);
      heroRoot.removeEventListener("pointercancel", cancelPointer);
    };
  }, [heroRoot, pathname]);

  if (!heroRoot || pathname !== "/") return null;

  const triggerControl = (kind: "previous" | "next" | "playback") => {
    const activeSlide = heroRoot.querySelector<HTMLElement>(
      ".hero-slide.is-active",
    );
    const controls = activeSlide?.querySelector<HTMLElement>(
      ".hero-carousel__controls",
    );
    if (!controls) return;

    const directButtons = Array.from(controls.children).filter(
      (child): child is HTMLButtonElement => child instanceof HTMLButtonElement,
    );

    const button =
      kind === "previous"
        ? directButtons[0]
        : kind === "next"
          ? directButtons[1]
          : directButtons[2];
    button?.click();
  };

  const chooseSlide = (index: number) => {
    const activeSlide = heroRoot.querySelector<HTMLElement>(
      ".hero-slide.is-active",
    );
    const dots = activeSlide?.querySelectorAll<HTMLButtonElement>(
      ".hero-carousel__dots button",
    );
    dots?.[index]?.click();
  };

  return createPortal(
    <div className="mobile-hero-motion-controls" aria-label="Hero slider controls">
      <button
        type="button"
        onClick={() => triggerControl("previous")}
        aria-label="Previous promotion"
      >
        <ChevronLeft aria-hidden="true" />
      </button>

      <div className="mobile-hero-motion-dots" aria-label="Choose promotion">
        {Array.from({ length: slideCount }).map((_, index) => (
          <button
            className={index === activeIndex ? "is-active" : ""}
            type="button"
            onClick={() => chooseSlide(index)}
            aria-label={`Show promotion ${index + 1}`}
            aria-current={index === activeIndex ? "true" : undefined}
            key={index}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => triggerControl("playback")}
        aria-label={isPaused ? "Play promotions" : "Pause promotions"}
      >
        {isPaused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
      </button>

      <button
        type="button"
        onClick={() => triggerControl("next")}
        aria-label="Next promotion"
      >
        <ChevronRight aria-hidden="true" />
      </button>
    </div>,
    heroRoot,
  );
}
