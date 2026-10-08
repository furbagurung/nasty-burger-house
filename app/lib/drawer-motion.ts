"use client";

import { useSyncExternalStore } from "react";

function subscribeMobile(callback: () => void) {
  const query = window.matchMedia("(max-width: 680px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

export function useMobileCart() {
  return useSyncExternalStore(subscribeMobile,
    () => window.matchMedia("(max-width: 680px)").matches,
    () => false);
}

// Preserve the cart's mobile bottom sheet and desktop side panel layouts.
export function drawerMotion(reduced: boolean, bottomSheet = false) {
  const transition = { duration: reduced ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] as const };
  const hidden = { x: !reduced && !bottomSheet ? "100%" : 0, y: !reduced && bottomSheet ? "100%" : 0 };
  return {
    backdrop: {
      initial: { backgroundColor: "rgba(0, 0, 0, 0)" },
      animate: { backgroundColor: "rgba(0, 0, 0, 0.34)" },
      exit: { backgroundColor: "rgba(0, 0, 0, 0)" },
      transition,
      style: { animation: "none" },
    },
    panel: {
      initial: hidden,
      animate: { x: 0, y: 0 },
      exit: hidden,
      transition,
      style: { animation: "none" },
    },
  };
}
