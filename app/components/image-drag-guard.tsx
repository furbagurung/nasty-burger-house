"use client";

import { useEffect } from "react";

export default function ImageDragGuard() {
  useEffect(() => {
    const preventImageDrag = (event: DragEvent) => {
      const target = event.target;
      if (target instanceof HTMLImageElement) {
        event.preventDefault();
      }
    };

    document.addEventListener("dragstart", preventImageDrag, true);

    return () => {
      document.removeEventListener("dragstart", preventImageDrag, true);
    };
  }, []);

  return null;
}
