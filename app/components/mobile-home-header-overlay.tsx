"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

export default function MobileHomeHeaderOverlay() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (pathname !== "/") return;

    const header = document.querySelector<HTMLElement>(
      ".site-shell > .site-header",
    );
    const hero = document.querySelector<HTMLElement>(".hero-carousel");
    const mobileQuery = window.matchMedia("(max-width: 900px)");

    if (!header || !hero) return;

    const updateHeader = () => {
      if (!mobileQuery.matches) {
        header.classList.remove("is-mobile-hero-overlay");
        return;
      }

      const heroBottom = hero.getBoundingClientRect().bottom;
      const headerHeight = header.getBoundingClientRect().height;

      header.classList.toggle(
        "is-mobile-hero-overlay",
        heroBottom > headerHeight + 8,
      );
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    window.addEventListener("resize", updateHeader);
    mobileQuery.addEventListener("change", updateHeader);

    return () => {
      header.classList.remove("is-mobile-hero-overlay");
      window.removeEventListener("scroll", updateHeader);
      window.removeEventListener("resize", updateHeader);
      mobileQuery.removeEventListener("change", updateHeader);
    };
  }, [pathname]);

  return null;
}
