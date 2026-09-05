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

    let lastScrollY = window.scrollY;
    let isHidden = false;

    const updateHeader = () => {
      if (!mobileQuery.matches) {
        header.classList.remove(
          "is-mobile-hero-overlay",
          "is-mobile-scroll-hidden",
        );
        isHidden = false;
        lastScrollY = window.scrollY;
        return;
      }

      const currentY = Math.max(0, window.scrollY);
      const heroBottom = hero.getBoundingClientRect().bottom;
      const headerHeight = header.getBoundingClientRect().height;
      const mobileDrawerOpen = Boolean(
        document.querySelector(".site-shell > .mobile-nav-backdrop"),
      );

      header.classList.toggle(
        "is-mobile-hero-overlay",
        heroBottom > headerHeight + 8,
      );

      if (mobileDrawerOpen || currentY <= 14) {
        isHidden = false;
      } else if (currentY > lastScrollY + 4 && currentY > 52) {
        isHidden = true;
      } else if (currentY < lastScrollY - 4) {
        isHidden = false;
      }

      header.classList.toggle("is-mobile-scroll-hidden", isHidden);
      lastScrollY = currentY;
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    window.addEventListener("resize", updateHeader);
    mobileQuery.addEventListener("change", updateHeader);

    return () => {
      header.classList.remove(
        "is-mobile-hero-overlay",
        "is-mobile-scroll-hidden",
      );
      window.removeEventListener("scroll", updateHeader);
      window.removeEventListener("resize", updateHeader);
      mobileQuery.removeEventListener("change", updateHeader);
    };
  }, [pathname]);

  return null;
}
