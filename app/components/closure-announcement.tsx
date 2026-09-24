"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type ClosurePhase = "upcoming" | "closed" | "ended";

function getClosurePhase(): ClosurePhase {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const dateKey = `${year}-${month}-${day}`;

  if (dateKey < "2026-09-25") return "upcoming";
  if (dateKey <= "2026-09-29") return "closed";
  return "ended";
}

export default function ClosureAnnouncement() {
  const pathname = usePathname();
  const [desktopHeaderHidden, setDesktopHeaderHidden] = useState(false);
  const [phase, setPhase] = useState<ClosurePhase>("upcoming");
  const isMenuRoute = pathname === "/menu" || pathname.startsWith("/menu/");
  const isVisible = phase !== "ended";

  useEffect(() => {
    const updatePhase = () => setPhase(getClosurePhase());
    updatePhase();

    const interval = window.setInterval(updatePhase, 60_000);
    return () => window.clearInterval(interval);
  }, []);

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
    document.documentElement.classList.toggle(
      "nasty-closure-visible",
      isVisible,
    );
    document.documentElement.classList.toggle(
      "nasty-closure-menu",
      isMenuRoute && isVisible,
    );

    return () => {
      document.documentElement.classList.remove(
        "nasty-closure-visible",
        "nasty-closure-menu",
      );
    };
  }, [isMenuRoute, isVisible]);

  if (pathname.startsWith("/admin") || !isVisible) return null;

  const upcoming = phase === "upcoming";
  const headline = upcoming
    ? "Upcoming closure · 25–29 September"
    : "Temporarily closed · 25–29 September";
  const message = upcoming
    ? "We're open today. Due to a technical issue, Nasty Burger House will be closed from 25–29 September. We'll reopen on 30 September."
    : "Due to a technical issue, Nasty Burger House is closed during these dates. We'll reopen on 30 September. Thank you for your patience.";

  return (
    <>
      <aside
      className={[
        "closure-announcement",
        desktopHeaderHidden ? "is-header-hidden" : "",
        isMenuRoute ? "is-menu-route" : "",
        upcoming ? "is-upcoming" : "is-closed",
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-label={upcoming ? "Upcoming closure announcement" : "Temporary closure announcement"}
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
