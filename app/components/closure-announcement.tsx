"use client";

import Announcement4 from "@/components/ui/announcement-4";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function ClosureAnnouncement() {
  const pathname = usePathname();
  const [desktopHeaderHidden, setDesktopHeaderHidden] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isMenuRoute = pathname === "/menu" || pathname.startsWith("/menu/");
  const isAuthRoute =
    pathname === "/account/sign-in" ||
    pathname === "/account/create" ||
    pathname === "/account/forgot-password" ||
    pathname === "/account/reset-password";
  // Keep opening-hours messaging across the main website, but leave
  // authentication and administration flows distraction-free.
  const isVisible = !dismissed && !pathname.startsWith("/admin") && !isAuthRoute;

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

  if (!isVisible) return null;

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
        <Announcement4 onDismiss={() => setDismissed(true)} />
      </aside>
      <div className="closure-announcement-spacer" aria-hidden="true" />
    </>
  );
}
