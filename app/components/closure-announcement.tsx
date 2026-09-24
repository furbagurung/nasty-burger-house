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
    document.documentElement.classList.toggle("nasty-closure-menu", isMenuRoute);

    return () => {
      document.documentElement.classList.remove("nasty-closure-menu");
    };
  }, [isMenuRoute]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <aside
      className={[
        "closure-announcement",
        desktopHeaderHidden ? "is-header-hidden" : "",
        isMenuRoute ? "is-menu-route" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-label="Temporary closure announcement"
    >
      <strong>Temporarily closed · 25–29 September</strong>
      <span className="closure-announcement__desktop-copy">
        Due to a technical issue, Nasty Burger House will be closed during these
        dates. We&apos;ll reopen on 30 September. Thank you for your patience.
      </span>
      <span className="closure-announcement__mobile-copy">
        Closed due to a technical issue. Reopening 30 September.
      </span>
    </aside>
  );
}
