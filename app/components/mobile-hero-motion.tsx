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

const GSAP_SCRIPT_ID = "nasty-gsap-runtime";
const GSAP_SRC = "https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js";

type GsapApi = {
  fromTo: (
    target: Element,
    fromVars: Record<string, unknown>,
    toVars: Record<string, unknown>,
  ) => unknown;
};

declare global {
  interface Window {
    gsap?: GsapApi;
  }
}

function mobileViewport() {
  return window.matchMedia("(max-width: 680px)").matches;
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function MobileHeroMotion() {
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

    const animateActiveSlide = () => {
      if (!mobileViewport() || reducedMotion() || !window.gsap) return;

      const activeSlide = heroRoot.querySelector<HTMLElement>(
        ".hero-slide.is-active",
      );
      if (!activeSlide) return;

      const image = activeSlide.querySelector<HTMLElement>(".hero-slide__image");
      const copy = activeSlide.querySelector<HTMLElement>(".hero-slide__copy");

      if (image) {
        window.gsap.fromTo(
          image,
          { scale: 1.035, opacity: 0.86 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.7,
            ease: "power3.out",
            clearProps: "transform,opacity",
          },
        );
      }

      if (copy) {
        window.gsap.fromTo(
          copy,
          { y: 14, opacity: 0.88 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: "power2.out",
            clearProps: "transform,opacity",
          },
        );
      }
    };

    const syncState = (animate = false) => {
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

      if (animate) requestAnimationFrame(animateActiveSlide);
    };

    syncState();

    const mutationObserver = new MutationObserver((mutations) => {
      const slideChanged = mutations.some(
        (mutation) =>
          mutation.type === "attributes" &&
          mutation.attributeName === "class" &&
          mutation.target instanceof HTMLElement &&
          mutation.target.classList.contains("hero-slide"),
      );
      syncState(slideChanged);
    });

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
      window.setTimeout(() => syncState(kind !== "playback"), 0);
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

    let script = document.getElementById(GSAP_SCRIPT_ID) as HTMLScriptElement | null;
    const onGsapReady = () => animateActiveSlide();

    if (window.gsap) {
      onGsapReady();
    } else if (!script) {
      script = document.createElement("script");
      script.id = GSAP_SCRIPT_ID;
      script.src = GSAP_SRC;
      script.async = true;
      script.addEventListener("load", onGsapReady, { once: true });
      document.head.appendChild(script);
    } else {
      script.addEventListener("load", onGsapReady, { once: true });
    }

    return () => {
      mutationObserver.disconnect();
      heroRoot.removeEventListener("pointerdown", onPointerDown);
      heroRoot.removeEventListener("pointerup", onPointerUp);
      heroRoot.removeEventListener("pointercancel", cancelPointer);
      script?.removeEventListener("load", onGsapReady);
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
    activeSlide
      ?.querySelectorAll<HTMLButtonElement>(".hero-carousel__dots button")
      [index]?.click();
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
