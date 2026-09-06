"use client";

import { useEffect } from "react";

type HeroConfig = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  image: string;
  imageAlt: string;
  href?: string;
  disabled?: boolean;
  variant: "loyalty" | "monthly" | "burgers" | "combo";
};

const heroConfigs: HeroConfig[] = [
  {
    eyebrow: "Nasty Rewards",
    title: "Get Drip Points",
    description:
      "Join Drip Points, get 500 points to start and unlock rewards made for hungry regulars.",
    ctaLabel: "Join Drip Points",
    image: "/images/hero-slider/hero-2-loyalty-drip-points.jpg",
    imageAlt: "Nasty Burger House Drip Points loyalty promotion",
    variant: "loyalty",
  },
  {
    eyebrow: "Coming Soon",
    title: "Beast of the Month",
    description:
      "A new limited-time Beast is being cooked up. Watch this space — the next Beast of the Month is coming soon.",
    ctaLabel: "Coming Soon",
    image: "/images/hero-slider/hero-1.jpg",
    imageAlt: "Nasty Burger House Beast of the Month coming soon promotion",
    disabled: true,
    variant: "monthly",
  },
  {
    eyebrow: "Flame-grilled favourites",
    title: "Beast Burgers",
    description:
      "From the OG Nasty to the Peri Beast, explore the full burger lineup and build your pickup order.",
    ctaLabel: "Explore Burgers",
    image: "/images/hero-slider/beast-burgers.jpg",
    imageAlt: "Nasty Burger House Beast Burgers selection",
    href: "/menu/burgers",
    variant: "burgers",
  },
  {
    eyebrow: "Build Your Feed",
    title: "Upgrade to Beast Combo",
    description:
      "Add Nasty Fries and choose your favourite drink to turn your burger into the full Beast Combo.",
    ctaLabel: "Build Your Combo",
    image: "/images/hero-slider/beast-combo.jpg",
    imageAlt: "Nasty Burger House Beast Combo with burger, fries and drinks",
    href: "/menu/burgers",
    variant: "combo",
  },
];

function setText(node: HTMLElement | null, value: string) {
  if (node && node.textContent !== value) node.textContent = value;
}

function applyHeroSliderImages() {
  const slides = Array.from(
    document.querySelectorAll<HTMLElement>(".hero-carousel .hero-slide"),
  );

  heroConfigs.forEach((config, index) => {
    const slide = slides[index];
    if (!slide) return;

    slide.dataset.heroPhotography = config.variant;

    // Remove the old floating product composition. The supplied hero artwork is
    // now the actual full-bleed carousel image.
    slide.querySelectorAll(".hero-real-photo-scene").forEach((scene) => scene.remove());

    const heroImage = slide.querySelector<HTMLImageElement>(".hero-slide__image");
    if (heroImage) {
      heroImage.removeAttribute("srcset");
      heroImage.removeAttribute("sizes");
      if (!heroImage.src.endsWith(config.image)) heroImage.src = config.image;
      heroImage.alt = config.imageAlt;
    }

    const copy = slide.querySelector<HTMLElement>(".hero-slide__copy");
    const eyebrow = copy?.querySelector<HTMLElement>(".eyebrow") ?? null;
    const heading = copy?.querySelector<HTMLElement>("h1, h2") ?? null;
    const description =
      copy?.querySelector<HTMLElement>(":scope > p:not(.eyebrow)") ?? null;
    const cta =
      copy?.querySelector<HTMLButtonElement | HTMLAnchorElement>(
        ".hero-card__cta",
      ) ?? null;

    setText(eyebrow, config.eyebrow);
    setText(heading, config.title);
    setText(description, config.description);

    if (!cta) return;

    setText(cta, config.ctaLabel);
    cta.classList.toggle("is-coming-soon", Boolean(config.disabled));

    if (cta instanceof HTMLAnchorElement && config.href) {
      cta.href = config.href;
      cta.removeAttribute("aria-disabled");
    }

    if (cta instanceof HTMLButtonElement) {
      cta.disabled = Boolean(config.disabled);
      if (config.disabled) cta.setAttribute("aria-disabled", "true");
      else cta.removeAttribute("aria-disabled");
    }
  });
}

export default function HomeHeroPhotographyEnhancer() {
  useEffect(() => {
    applyHeroSliderImages();

    // Re-apply once after the other homepage enhancers have mounted so the
    // current public hero-slider files remain the final image sources.
    const timer = window.setTimeout(applyHeroSliderImages, 160);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
