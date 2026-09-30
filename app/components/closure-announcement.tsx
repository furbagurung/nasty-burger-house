"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function ClosureAnnouncement() {
  const pathname = usePathname();
  const [desktopHeaderHidden, setDesktopHeaderHidden] = useState(false);
  const isMenuRoute = pathname === "/menu" || pathname.startsWith("/menu/");

  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".home-top-header");
    if (!header) return;

    const syncHeaderState = () => {
      setDesktopHeaderHidden(header.classList.contains("is-hidden"));
    };

    syncHeaderState();

    const observer = new MutationObserver(syncHeaderState);
    observer.observe(header, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    document.documentElement.classList.add("nasty-closure-visible");
    document.documentElement.classList.toggle(
      "nasty-closure-menu",
      isMenuRoute,
    );

    return () => {
      document.documentElement.classList.remove(
        "nasty-closure-visible",
        "nasty-closure-menu",
      );
    };
  }, [isMenuRoute]);

  if (pathname.startsWith("/admin")) return null;

  const headline = "WE'RE OPEN 7 DAYS";
  const message = "11:30 AM – 10:00 PM";

  return (
    <>
      <aside
        className={[
          "closure-announcement",
          desktopHeaderHidden ? "is-header-hidden" : "",
          isMenuRoute ? "is-menu-route" : "",
          "is-open",
        ]
          .filter(Boolean)
          .join(" ")}
        role="status"
        aria-label="Opening hours announcement"
      >
        <strong>{headline}</strong>

        <span className="closure-announcement__desktop-copy">{message}</span>

        <span className="closure-announcement__mobile-copy">
          <span className="closure-announcement__marquee">
            <span className="closure-announcement__marquee-item">
              <b>{headline}</b>
              <span>{message}</span>
            </span>
            <span
              className="closure-announcement__marquee-item"
              aria-hidden="true"
            >
              <b>{headline}</b>
              <span>{message}</span>
            </span>
          </span>
        </span>
      </aside>
      <div className="closure-announcement-spacer" aria-hidden="true" />
    </>
  );
}
