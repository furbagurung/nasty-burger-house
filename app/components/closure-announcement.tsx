"use client";

import { usePathname } from "next/navigation";

export default function ClosureAnnouncement() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  return (
    <aside
      className="closure-announcement"
      role="status"
      aria-label="Temporary closure announcement"
    >
      <strong>Temporarily closed · 25–29 September</strong>
      <span>
        Due to a technical issue, Nasty Burger House will be closed during these
        dates. We&apos;ll reopen on 30 September. Thank you for your patience.
      </span>
    </aside>
  );
}
