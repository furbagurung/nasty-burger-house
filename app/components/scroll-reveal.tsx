"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const revealSelectors = [
  ".menu-preview__heading",
  ".menu-preview-card--clean",
  ".home-feature",
  ".catalogue-heading",
  ".catalogue-product--browse",
  ".product-detail__description",
  ".product-detail__tags",
  ".product-custom-section",
  ".product-purchase-panel",
  ".help-support-page section",
  ".site-footer .footer-brand",
  ".site-footer .footer-links > nav",
  ".site-footer .footer-bottom",
].join(",");

const excludedAncestors = [
  ".drawer-backdrop",
  ".modal-backdrop",
  ".product-drink-drawer-backdrop",
  ".cart-drawer",
].join(",");

function staggerDelay(element: HTMLElement) {
  if (
    element.matches(
      ".menu-preview-card--clean, .catalogue-product--browse, .site-footer .footer-links > nav",
    )
  ) {
    const siblings = Array.from(element.parentElement?.children ?? []);
    const index = Math.max(0, siblings.indexOf(element));
    return Math.min(index * 65, 260);
  }

  return 0;
}

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const element = entry.target as HTMLElement;
          element.classList.add("is-revealed");
          observer.unobserve(element);
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -7% 0px",
      },
    );

    const register = (root: ParentNode = document) => {
      root.querySelectorAll<HTMLElement>(revealSelectors).forEach((element) => {
        if (element.dataset.scrollReveal === "ready") return;
        if (element.closest(excludedAncestors)) return;

        element.dataset.scrollReveal = "ready";
        element.style.setProperty(
          "--scroll-reveal-delay",
          `${staggerDelay(element)}ms`,
        );
        element.classList.add("scroll-reveal");
        observer.observe(element);
      });
    };

    register();

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(revealSelectors) && !node.closest(excludedAncestors)) {
            register(node.parentElement ?? document);
          } else {
            register(node);
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
