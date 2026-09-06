"use client";

import { useEffect } from "react";

type HeroConfig = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  href?: string;
  disabled?: boolean;
  variant: "loyalty" | "monthly" | "menu" | "combo";
};

const heroConfigs: HeroConfig[] = [
  {
    eyebrow: "Nasty Rewards",
    title: "Get Drip Points",
    description:
      "Join Drip Points, get 500 points to start and unlock rewards made for hungry regulars.",
    ctaLabel: "Join Drip Points",
    variant: "loyalty",
  },
  {
    eyebrow: "Coming Soon",
    title: "Beast of the Month",
    description:
      "A new limited-time Beast is being cooked up. Watch this space — the next Beast of the Month is coming soon.",
    ctaLabel: "Coming Soon",
    disabled: true,
    variant: "monthly",
  },
  {
    eyebrow: "Nasty Burger House",
    title: "Explore Our Menu",
    description:
      "Flame-grilled burgers, loaded sides and ice-cold drinks made for hungry regulars.",
    ctaLabel: "View Menu",
    href: "/menu/burgers",
    variant: "menu",
  },
  {
    eyebrow: "Build Your Feed",
    title: "Upgrade to Beast Combo",
    description:
      "Add Nasty Fries and choose your favourite drink to turn your burger into the full Beast Combo.",
    ctaLabel: "Build Your Combo",
    href: "/menu/burgers",
    variant: "combo",
  },
];

function setText(node: HTMLElement | null, value: string) {
  if (node && node.textContent !== value) node.textContent = value;
}

function createImage(
  src: string,
  className: string,
  alt = "",
): HTMLImageElement {
  const image = document.createElement("img");
  image.src = src;
  image.alt = alt;
  image.className = className;
  image.loading = "eager";
  image.decoding = "async";
  image.draggable = false;
  return image;
}

function createPhoto(src: string, className: string) {
  const frame = document.createElement("div");
  frame.className = `hero-real-photo ${className}`;
  frame.appendChild(createImage(src, "hero-real-photo__image"));
  return frame;
}

function createBrandLogo() {
  return createImage(
    "/logo.webp",
    "hero-real-photo__brand",
  );
}

function buildScene(variant: HeroConfig["variant"]) {
  const scene = document.createElement("div");
  scene.className = `hero-real-photo-scene hero-real-photo-scene--${variant}`;
  scene.setAttribute("aria-hidden", "true");

  const stage = document.createElement("div");
  stage.className = "hero-real-photo-stage";
  scene.appendChild(stage);
  stage.appendChild(createBrandLogo());

  if (variant === "menu") {
    stage.appendChild(
      createPhoto("/images/menu/og-nasty.jpg", "hero-real-photo--menu-og"),
    );
    stage.appendChild(
      createPhoto("/images/menu/peri-beast.jpg", "hero-real-photo--menu-peri"),
    );
    stage.appendChild(
      createPhoto("/images/menu/hooked.jpg", "hero-real-photo--menu-hooked"),
    );
    stage.appendChild(
      createImage("/images/menu/coke.webp", "hero-real-photo__drink hero-real-photo__drink--menu-coke"),
    );
    stage.appendChild(
      createImage("/images/menu/fanta-can.png", "hero-real-photo__drink hero-real-photo__drink--menu-fanta"),
    );
  }

  if (variant === "combo") {
    stage.appendChild(
      createPhoto("/images/menu/og-nasty.jpg", "hero-real-photo--combo-burger"),
    );
    stage.appendChild(
      createPhoto("/images/menu/nasty-fries.jpg", "hero-real-photo--combo-fries"),
    );
    stage.appendChild(
      createImage("/images/menu/solo-can.png", "hero-real-photo__drink hero-real-photo__drink--solo"),
    );
    stage.appendChild(
      createImage("/images/menu/coke.webp", "hero-real-photo__drink hero-real-photo__drink--coke"),
    );
    stage.appendChild(
      createImage("/images/menu/fanta-can.png", "hero-real-photo__drink hero-real-photo__drink--fanta"),
    );
  }

  if (variant === "loyalty") {
    stage.appendChild(
      createPhoto("/images/menu/og-nasty.jpg", "hero-real-photo--loyalty-burger"),
    );
    stage.appendChild(
      createImage(
        "/images/drip-points/drip-coin.png",
        "hero-real-photo__coin",
      ),
    );
    stage.appendChild(
      createImage("/images/menu/coke no sugar.webp", "hero-real-photo__drink hero-real-photo__drink--loyalty-coke"),
    );
  }

  if (variant === "monthly") {
    stage.appendChild(
      createPhoto(
        "/images/home-menu/beast-of-the-month.jpg",
        "hero-real-photo--monthly",
      ),
    );
    stage.appendChild(
      createImage(
        "/images/coming-soon.png",
        "hero-real-photo__coming-soon",
      ),
    );
  }

  return scene;
}

function enhanceHeroPhotography() {
  const slides = Array.from(
    document.querySelectorAll<HTMLElement>(".hero-carousel .hero-slide"),
  );

  heroConfigs.forEach((config, index) => {
    const slide = slides[index];
    if (!slide) return;

    slide.dataset.heroPhotography = config.variant;

    const copy = slide.querySelector<HTMLElement>(".hero-slide__copy");
    const eyebrow = copy?.querySelector<HTMLElement>(".eyebrow") ?? null;
    const heading = copy?.querySelector<HTMLElement>("h1, h2") ?? null;
    const description = copy?.querySelector<HTMLElement>(
      ":scope > p:not(.eyebrow)",
    ) ?? null;
    const cta = copy?.querySelector<HTMLButtonElement | HTMLAnchorElement>(
      ".hero-card__cta",
    ) ?? null;

    setText(eyebrow, config.eyebrow);
    setText(heading, config.title);
    setText(description, config.description);

    if (cta) {
      setText(cta, config.ctaLabel);
      cta.classList.toggle("is-coming-soon", Boolean(config.disabled));

      if (cta instanceof HTMLAnchorElement && config.href) {
        cta.href = config.href;
      }

      if (cta instanceof HTMLButtonElement) {
        cta.disabled = Boolean(config.disabled);
        if (config.disabled) cta.setAttribute("aria-disabled", "true");
        else cta.removeAttribute("aria-disabled");
      }
    }

    const oldScene = slide.querySelector(".hero-real-photo-scene");
    if (oldScene?.getAttribute("data-variant") === config.variant) return;
    oldScene?.remove();

    const scene = buildScene(config.variant);
    scene.setAttribute("data-variant", config.variant);
    slide.prepend(scene);
  });
}

export default function HomeHeroPhotographyEnhancer() {
  useEffect(() => {
    enhanceHeroPhotography();

    const timer = window.setTimeout(enhanceHeroPhotography, 120);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
