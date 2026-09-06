"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function MobileHomeLocation() {
  const pathname = usePathname();
  const [headerTarget, setHeaderTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (pathname !== "/") {
      setHeaderTarget(null);
      return;
    }

    const findHeader = () => {
      const header = document.querySelector<HTMLElement>(
        ".home-top-header.is-home-route",
      );
      setHeaderTarget(header);
    };

    findHeader();
    const timer = window.setTimeout(findHeader, 60);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (pathname !== "/" || !headerTarget) return null;

  return createPortal(
    <a
      className="mobile-home-location"
      href="#find-us"
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
