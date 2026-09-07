"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type CSSProperties,
  useEffect,
  useRef,
  useState,
} from "react";

const primaryLinks = [
  { label: "Home", href: "/" },
  { label: "Beast of the Month", href: "/beast-of-the-month" },
  { label: "Drip Points", href: "/drip-points" },
  { label: "Find Us", href: "/#find-us" },
];

const menuLinks = [
  { label: "Beast Burgers", href: "/menu/burgers" },
  { label: "Beast Boxes", href: "/menu/beast-boxes" },
  { label: "Loaded Sides", href: "/menu/loaded-sides" },
  { label: "Kids", href: "/menu/kids" },
  { label: "Dessert", href: "/menu/sweet" },
  { label: "Drinks", href: "/menu/drinks" },
];

function staggerStyle(index: number) {
  return { "--nasty-nav-index": index } as CSSProperties;
}

export default function FindStyleNavigation() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isMenuPage = pathname.startsWith("/menu/");
  const isProductPage = pathname.startsWith("/product/");
  const supportsDrawer = isHome || isMenuPage || isProductPage;
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const burgerRef = useRef<HTMLButtonElement | null>(null);

  // The homepage already owns a real hamburger button inside OrderExperience.
  // Bind to that button without inserting a portal into the SSR-owned header.
  // This keeps the header DOM identical during hydration and avoids the
  // server/client mismatch that was caused by injecting .nasty-find-burger.
  useEffect(() => {
    if (!isHome) {
      triggerRef.current = null;
      return;
    }

    const trigger = document.querySelector<HTMLButtonElement>(
      ".site-shell > .site-header .mobile-menu-button",
    );
    if (!trigger) return;

    triggerRef.current = trigger;

    const handleTrigger = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsOpen((current) => {
        const next = !current;
        trigger.setAttribute("aria-expanded", String(next));
        trigger.setAttribute("aria-controls", "nasty-find-navigation");
        return next;
      });
    };

    // Capture the click before the legacy React handler can open its old drawer.
    trigger.addEventListener("click", handleTrigger, true);

    return () => {
      trigger.removeEventListener("click", handleTrigger, true);
      triggerRef.current = null;
    };
  }, [isHome, pathname]);

  useEffect(() => {
    setIsOpen(false);
    setIsMenuOpen(false);
    if (triggerRef.current) {
      triggerRef.current.setAttribute("aria-expanded", "false");
    }
  }, [pathname]);

  useEffect(() => {
    if (!supportsDrawer) return;

    const root = document.documentElement;
    const previousOverflow = document.body.style.overflow;

    root.classList.toggle("nasty-find-nav-open", isOpen);
    if (isOpen) document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.setAttribute("aria-expanded", "false");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      root.classList.remove("nasty-find-nav-open");
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, supportsDrawer]);

  useEffect(() => {
    if (!isMenuPage) return;

    const header = document.querySelector<HTMLElement>(
      ".catalogue-shell:not(.product-page-shell) > .catalogue-header",
    );
    const scroller = document.querySelector<HTMLElement>(
      ".catalogue-shell:not(.product-page-shell) .catalogue-content",
    );

    if (!header || !scroller) return;

    let lastScrollY = scroller.scrollTop;
    let isHidden = false;

    const updateHeader = () => {
      const currentY = Math.max(0, scroller.scrollTop);

      if (isOpen || currentY <= 12) {
        isHidden = false;
      } else if (currentY > lastScrollY + 4 && currentY > 40) {
        isHidden = true;
      } else if (currentY < lastScrollY - 4) {
        isHidden = false;
      }

      header.classList.toggle("is-mobile-scroll-hidden", isHidden);
      lastScrollY = currentY;
    };

    updateHeader();
    scroller.addEventListener("scroll", updateHeader, { passive: true });

    return () => {
      header.classList.remove("is-mobile-scroll-hidden");
      scroller.removeEventListener("scroll", updateHeader);
    };
  }, [isMenuPage, isOpen]);

  function closeDrawer({ restoreFocus = false } = {}) {
    setIsOpen(false);
    setIsMenuOpen(false);
    triggerRef.current?.setAttribute("aria-expanded", "false");
    if (restoreFocus) {
      window.setTimeout(() => {
        (triggerRef.current ?? burgerRef.current)?.focus();
      }, 320);
    }
  }

  if (!supportsDrawer) return null;

  return (
    <>
      {!isHome && (
        <button
          ref={burgerRef}
          className="nasty-find-burger is-catalogue-route"
          type="button"
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isOpen}
          aria-controls="nasty-find-navigation"
          onClick={() => setIsOpen((current) => !current)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      )}

      <div
        className={`nasty-find-drawer ${isOpen ? "is-open" : ""}`}
        id="nasty-find-navigation"
        aria-hidden={!isOpen}
      >
        <div className="nasty-find-drawer__surface" aria-hidden="true" />

        <div
          className="nasty-find-drawer__content"
          role="dialog"
          aria-modal="true"
          aria-label="Nasty Burger House navigation"
        >
          <nav className="nasty-find-drawer__nav" aria-label="Mobile navigation">
            <Link
              className="nasty-find-drawer__link"
              href="/"
              onClick={() => closeDrawer()}
              style={staggerStyle(0)}
            >
              <span className="nasty-find-drawer__label">Home</span>
              <span className="nasty-find-drawer__arrow" aria-hidden="true">↗</span>
            </Link>

            <div
              className={`nasty-find-drawer__menu-group ${isMenuOpen ? "is-expanded" : ""}`}
              style={staggerStyle(1)}
            >
              <button
                className="nasty-find-drawer__link nasty-find-drawer__menu-trigger"
                type="button"
                aria-expanded={isMenuOpen}
                aria-controls="nasty-find-menu-categories"
                onClick={() => setIsMenuOpen((current) => !current)}
              >
                <span className="nasty-find-drawer__label">Menu</span>
                <span className="nasty-find-drawer__plus" aria-hidden="true">
                  <i />
                  <i />
                </span>
              </button>

              <div
                className="nasty-find-drawer__submenu"
                id="nasty-find-menu-categories"
              >
                <div className="nasty-find-drawer__submenu-inner">
                  {menuLinks.map((link) => (
                    <Link href={link.href} onClick={() => closeDrawer()} key={link.href}>
                      {link.label}
                      <span aria-hidden="true">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {primaryLinks.slice(1).map((link, index) => (
              <Link
                className="nasty-find-drawer__link"
                href={link.href}
                onClick={() => closeDrawer()}
                style={staggerStyle(index + 2)}
                key={link.href}
              >
                <span className="nasty-find-drawer__label">{link.label}</span>
                <span className="nasty-find-drawer__arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </nav>

          <div className="nasty-find-drawer__actions" style={staggerStyle(5)}>
            <div className="nasty-find-drawer__utility">
              <Link href="/account" onClick={() => closeDrawer()}>Account</Link>
              <Link href="/help-support" onClick={() => closeDrawer()}>Help</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
