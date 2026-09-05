"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function MobileHeroHeader() {
  const pathname = usePathname();

  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-shell > .site-header");
    const hero = document.querySelector<HTMLElement>(".hero-carousel");
    const mobileQuery = window.matchMedia("(max-width: 900px)");

    if (!header) return;

    const update = () => {
      if (pathname !== "/" || !hero || !mobileQuery.matches) {
        header.classList.remove("is-mobile-hero-transparent");
        return;
      }

      const headerBottom = header.getBoundingClientRect().bottom;
      const heroBottom = hero.getBoundingClientRect().bottom;
      header.classList.toggle(
        "is-mobile-hero-transparent",
        heroBottom > headerBottom + 8,
      );
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    mobileQuery.addEventListener("change", update);

    return () => {
      header.classList.remove("is-mobile-hero-transparent");
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      mobileQuery.removeEventListener("change", update);
    };
  }, [pathname]);

  return null;
}
