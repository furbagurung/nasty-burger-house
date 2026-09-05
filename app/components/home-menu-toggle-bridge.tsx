"use client";

import { useEffect } from "react";

export default function HomeMenuToggleBridge() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const trigger = target?.closest<HTMLButtonElement>(".mobile-menu-button");
      if (!trigger || trigger.getAttribute("aria-expanded") !== "true") return;

      const closeButton = document.querySelector<HTMLButtonElement>(
        ".site-shell > .mobile-nav-backdrop .mobile-nav-drawer .close-button",
      );
      if (!closeButton) return;

      event.preventDefault();
      event.stopPropagation();
      closeButton.click();
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}
