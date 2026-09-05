"use client";

import { useEffect } from "react";

function disableComingSoonCard() {
  const card = document.querySelector<HTMLElement>(
    ".menu-preview-card--clean.is-disabled",
  );
  if (!card) return;

  card.setAttribute("aria-disabled", "true");
  card.setAttribute("tabindex", "-1");

  if (card instanceof HTMLAnchorElement) {
    card.removeAttribute("href");
  }
}

export default function HomeMenuComingSoonGuard() {
  useEffect(() => {
    const apply = () => window.requestAnimationFrame(disableComingSoonCard);
    apply();

    const grid = document.querySelector<HTMLElement>(".menu-preview__grid");
    if (!grid) return;

    const observer = new MutationObserver(apply);
    observer.observe(grid, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
