"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function MobileHomeHeaderOverlay() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;

    if (pathname !== "/") {
      root.classList.remove(
        "nasty-mobile-hero-overlay",
        "nasty-mobile-header-hidden",
      );
      return;
    }

    const header = document.querySelector<HTMLElement>(
      ".site-shell > .site-header",
    );
    const hero = document.querySelector<HTMLElement>(".hero-carousel");
    const mobileQuery = window.matchMedia("(max-width: 900px)");

    if (!header || !hero) return;

    let lastScrollY = window.scrollY;
    let isHidden = false;

    const updateHeader = () => {
      if (!mobileQuery.matches) {
        root.classList.remove(
          "nasty-mobile-hero-overlay",
          "nasty-mobile-header-hidden",
        );
        isHidden = false;
        lastScrollY = window.scrollY;
        return;
      }

      const currentY = Math.max(0, window.scrollY);
      const heroBottom = hero.getBoundingClientRect().bottom;
      const headerHeight = header.getBoundingClientRect().height;
      const mobileDrawerOpen = root.classList.contains("nasty-find-nav-open");

      root.classList.toggle(
        "nasty-mobile-hero-overlay",
        heroBottom > headerHeight + 8,
      );

      if (mobileDrawerOpen || currentY <= 14) {
        isHidden = false;
      } else if (currentY > lastScrollY + 4 && currentY > 52) {
        isHidden = true;
      } else if (currentY < lastScrollY - 4) {
        isHidden = false;
      }

      root.classList.toggle("nasty-mobile-header-hidden", isHidden);
      lastScrollY = currentY;
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    window.addEventListener("resize", updateHeader);
    mobileQuery.addEventListener("change", updateHeader);

    return () => {
      root.classList.remove(
        "nasty-mobile-hero-overlay",
        "nasty-mobile-header-hidden",
      );
      window.removeEventListener("scroll", updateHeader);
      window.removeEventListener("resize", updateHeader);
      mobileQuery.removeEventListener("change", updateHeader);
    };
  }, [pathname]);

  return null;
}
