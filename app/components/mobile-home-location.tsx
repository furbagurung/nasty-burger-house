"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function MobileHomeLocation() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isMenuPage = pathname.startsWith("/menu/");
  const isProductPage = pathname.startsWith("/product/");
  const supportsHeader = isHome || isMenuPage || isProductPage;
  const [headerTarget, setHeaderTarget] = useState<HTMLElement | null>(null);

  // Wait until hydration has committed before portaling into a page-owned header.
  // Using a layout effect here can mutate the SSR DOM while the menu/product
  // subtree is still hydrating, which produces a false client/server mismatch.
  useEffect(() => {
    if (!supportsHeader) {
      setHeaderTarget(null);
      return;
    }

    const findHeader = () => {
      const header = document.querySelector<HTMLElement>(
        isMenuPage || isProductPage
          ? ".catalogue-shell > .catalogue-header"
          : ".site-shell > .site-header",
      );
      setHeaderTarget(header);
      return Boolean(header);
    };

    const frame = window.requestAnimationFrame(() => {
      if (findHeader()) return;

      const observer = new MutationObserver(() => {
        if (findHeader()) observer.disconnect();
      });

      observer.observe(document.body, { childList: true, subtree: true });
      const timer = window.setTimeout(() => {
        findHeader();
        observer.disconnect();
      }, 500);

      cleanupObserver = () => {
        window.clearTimeout(timer);
        observer.disconnect();
      };
    });

    let cleanupObserver = () => {};

    return () => {
      window.cancelAnimationFrame(frame);
      cleanupObserver();
    };
  }, [isHome, isMenuPage, isProductPage, supportsHeader, pathname]);

  if (!supportsHeader || !headerTarget) return null;

  return createPortal(
    <a
      className="mobile-home-location"
      href={isHome ? "#find-us" : "/#find-us"}
      aria-label="Pickup location: Belconnen ACT 2617. Jump to Find Us."
    >
      <span className="mobile-home-location__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="10"
            r="2.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      </span>
      <span className="mobile-home-location__copy">
        <small>Pickup at</small>
        <strong>Belconnen</strong>
      </span>
    </a>,
    headerTarget,
  );
}
