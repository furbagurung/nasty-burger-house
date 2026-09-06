"use client";

import { useEffect } from "react";

export default function HomeSquareCheckoutEnhancer() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    const squareAwareFetch: typeof window.fetch = async (input, init) => {
      const response = await originalFetch(input, init);
      const requestUrl =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (requestUrl.includes("/api/orders") && response.ok) {
        void response
          .clone()
          .json()
          .then((result: { checkoutUrl?: unknown; orderId?: unknown }) => {
            if (typeof result.checkoutUrl !== "string" || !result.checkoutUrl) return;
            if (typeof result.orderId === "string") {
              window.sessionStorage.setItem(
                "nasty-square-pending-order",
                result.orderId,
              );
            }
            window.location.assign(result.checkoutUrl);
          })
          .catch(() => undefined);
      }

      return response;
    };

    window.fetch = squareAwareFetch;
    return () => {
      if (window.fetch === squareAwareFetch) window.fetch = originalFetch;
    };
  }, []);

  return null;
}
