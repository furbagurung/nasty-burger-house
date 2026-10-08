"use client";

import Announcement4 from "@/components/ui/announcement-4";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ANNOUNCEMENT_DISMISS_KEY = "nasty-opening-hours-dismissed-until";
const ANNOUNCEMENT_COOLDOWN_MS = 6 * 60 * 60 * 1000;

function readDismissedUntil(): number {
  try {
    const stored = window.localStorage.getItem(ANNOUNCEMENT_DISMISS_KEY);
    const until = Number(stored);
    return Number.isFinite(until) && until > Date.now() ? until : 0;
  } catch {
    // Browsers with blocked storage can still dismiss the bar for this visit.
    return 0;
  }
}

export default function ClosureAnnouncement() {
  const pathname = usePathname();
  const [desktopHeaderHidden, setDesktopHeaderHidden] = useState(false);
  const [dismissal, setDismissal] = useState({
    checked: false,
    until: 0,
  });
  const isMenuRoute = pathname === "/menu" || pathname.startsWith("/menu/");
  const isAuthRoute =
    pathname === "/account/sign-in" ||
    pathname === "/account/create" ||
    pathname === "/account/forgot-password" ||
    pathname === "/account/reset-password";
  // Keep opening-hours messaging across the main website, but leave
  // authentication and administration flows distraction-free.
  // Checkout shows its own authoritative pickup-ordering status; the generic
  // site-wide hours promotion could imply ordering is open when it is not.
  const isVisible =
    dismissal.checked &&
    dismissal.until <= Date.now() &&
    !pathname.startsWith("/admin") &&
    !isAuthRoute &&
    pathname !== "/checkout";

  // Check storage after mount to avoid a flash of the announcement on reload
  // for visitors who have already closed it. Also sync between open tabs.
  useEffect(() => {
    const syncDismissal = () =>
      setDismissal({ checked: true, until: readDismissedUntil() });

    syncDismissal();
    const onStorage = (event: StorageEvent) => {
      if (event.key === ANNOUNCEMENT_DISMISS_KEY || event.key === null) {
        syncDismissal();
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Become eligible to show the notice again after the six-hour cooldown,
  // even if the visitor leaves the same tab open.
  useEffect(() => {
    if (!dismissal.checked || dismissal.until === 0) return;

    const remaining = dismissal.until - Date.now();
    const timeout = window.setTimeout(() => {
      setDismissal((current) =>
        current.until === dismissal.until ? { checked: true, until: 0 } : current,
      );
    }, Math.max(0, remaining));

    return () => window.clearTimeout(timeout);
  }, [dismissal.checked, dismissal.until]);

  const dismissAnnouncement = () => {
    const until = Date.now() + ANNOUNCEMENT_COOLDOWN_MS;
    try {
      window.localStorage.setItem(ANNOUNCEMENT_DISMISS_KEY, String(until));
    } catch {
      // Dismiss locally even if browser storage is unavailable.
    }
    setDismissal({ checked: true, until });
  };

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
        <Announcement4 onDismiss={dismissAnnouncement} />
      </aside>
      <div className="closure-announcement-spacer" aria-hidden="true" />
    </>
  );
}
