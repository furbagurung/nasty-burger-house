"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const NAVIGATION_TIMEOUT_MS = 15_000;

/**
 * Keeps the current page visible until the next route is ready. Link clicks
 * start a lightweight progress indicator without waiting for server data.
 * This is visual feedback only and does not change navigation behavior.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const progress = progressRef.current;
    if (!progress) return;

    let timeoutId: number | null = null;

    const hide = () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      timeoutId = null;
      progress.classList.remove("is-visible");
      progress.setAttribute("aria-hidden", "true");
    };

    const show = () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      progress.classList.add("is-visible");
      progress.setAttribute("aria-hidden", "false");
      // Failed or canceled requests must not leave an eternal progress bar.
      timeoutId = window.setTimeout(hide, NAVIGATION_TIMEOUT_MS);
    };

    const onLinkClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) return;

      const link = event.target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.hasAttribute("download") || (link.target && link.target !== "_self")) return;

      let destination: URL;
      try {
        destination = new URL(link.href);
      } catch {
        return;
      }

      // Ignore external links, hash scrolling, and links to this same page.
      if (
        destination.origin !== window.location.origin ||
        destination.pathname === window.location.pathname
      ) return;

      show();
    };

    const onHistoryNavigation = () => {
      if (window.location.pathname !== pathname) show();
    };

    // A new pathname means the transition is complete; reset the bar.
    hide();
    document.addEventListener("click", onLinkClick, true);
    window.addEventListener("popstate", onHistoryNavigation);

    return () => {
      document.removeEventListener("click", onLinkClick, true);
      window.removeEventListener("popstate", onHistoryNavigation);
      hide();
    };
  }, [pathname]);

  return (
    <div
      ref={progressRef}
      className="nb-navigation-progress"
      role="progressbar"
      aria-label="Loading page"
      aria-valuetext="Loading next page"
      aria-hidden="true"
    >
      <span className="nb-navigation-progress__bar" aria-hidden="true" />
    </div>
  );
}
