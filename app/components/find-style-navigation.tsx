"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const primaryLinks = [
  { label: "Home", href: "/" },
  { label: "Beast of the Month", href: "/beast-of-the-month" },
  { label: "Drip Points", href: "/drip-points" },
  { label: "Find Us", href: "#find-us" },
];

const menuLinks = [
  { label: "Beast Burgers", href: "/menu/burgers" },
  { label: "Beast Boxes", href: "/menu/beast-boxes" },
  { label: "Loaded Sides", href: "/menu/loaded-sides" },
  { label: "Kids", href: "/menu/kids" },
  { label: "Dessert", href: "/menu/dessert" },
  { label: "Drinks", href: "/menu/drinks" },
];

function staggerStyle(index: number) {
  return { "--nasty-nav-index": index } as CSSProperties;
}

export default function FindStyleNavigation() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [buttonHost, setButtonHost] = useState<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    if (!isHome) {
      // The portal host belongs to the homepage-only OrderExperience header.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setButtonHost(null);
      return;
    }

    const findHost = () => {
      const host = document.querySelector<HTMLElement>(
        ".site-shell > .site-header .header-actions",
      );
      setButtonHost(host);
      return Boolean(host);
    };

    if (findHost()) return;

    const observer = new MutationObserver(() => {
      if (findHost()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const timer = window.setTimeout(() => {
      findHost();
      observer.disconnect();
    }, 700);

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [isHome]);

  useEffect(() => {
    // Route changes should never leave an external portal drawer open.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpen(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isHome) return;

    const root = document.documentElement;
    const previousOverflow = document.body.style.overflow;

    root.classList.toggle("nasty-find-nav-open", isOpen);
    if (isOpen) document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      root.classList.remove("nasty-find-nav-open");
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isHome, isOpen]);

  function closeDrawer({ restoreFocus = false } = {}) {
    setIsOpen(false);
    setIsMenuOpen(false);
    if (restoreFocus) {
      window.setTimeout(() => burgerRef.current?.focus(), 320);
    }
  }

  function handleFindUs(event: ReactMouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    closeDrawer();
    window.setTimeout(() => {
      document.querySelector("#find-us")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 360);
  }

  if (!isHome || !buttonHost) return null;

  const burgerButton = createPortal(
    <button
      ref={burgerRef}
      className="nasty-find-burger"
      type="button"
      aria-label={isOpen ? "Close navigation" : "Open navigation"}
      aria-expanded={isOpen}
      aria-controls="nasty-find-navigation"
      onClick={() => setIsOpen((current) => !current)}
    >
      <span aria-hidden="true" />
      <span aria-hidden="true" />
    </button>,
    buttonHost,
  );

  const drawer = createPortal(
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
        <div className="nasty-find-drawer__intro" style={staggerStyle(0)}>
          <span className="nasty-find-drawer__mini-logo" aria-hidden="true">
            <Image src="/logo.webp" alt="" width={80} height={80} />
          </span>
          <div>
            <p>NASTY BURGER HOUSE</p>
            <span>Pick your next feed.</span>
          </div>
        </div>

        <nav className="nasty-find-drawer__nav" aria-label="Mobile navigation">
          <Link
            className="nasty-find-drawer__link"
            href="/"
            onClick={() => closeDrawer()}
            style={staggerStyle(1)}
          >
            <span className="nasty-find-drawer__index">01</span>
            <span className="nasty-find-drawer__label">Home</span>
            <span className="nasty-find-drawer__arrow" aria-hidden="true">↗</span>
          </Link>

          <div
            className={`nasty-find-drawer__menu-group ${isMenuOpen ? "is-expanded" : ""}`}
            style={staggerStyle(2)}
          >
            <button
              className="nasty-find-drawer__link nasty-find-drawer__menu-trigger"
              type="button"
              aria-expanded={isMenuOpen}
              aria-controls="nasty-find-menu-categories"
              onClick={() => setIsMenuOpen((current) => !current)}
            >
              <span className="nasty-find-drawer__index">02</span>
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
              onClick={link.href === "#find-us" ? handleFindUs : () => closeDrawer()}
              style={staggerStyle(index + 3)}
              key={link.href}
            >
              <span className="nasty-find-drawer__index">0{index + 3}</span>
              <span className="nasty-find-drawer__label">{link.label}</span>
              <span className="nasty-find-drawer__arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </nav>

        <div className="nasty-find-drawer__actions" style={staggerStyle(6)}>
          <a className="nasty-find-drawer__order" href="/?order=1">
            <span>Order now</span>
            <strong aria-hidden="true">→</strong>
          </a>
          <div className="nasty-find-drawer__utility">
            <Link href="/account" onClick={() => closeDrawer()}>Account</Link>
            <Link href="/help" onClick={() => closeDrawer()}>Help</Link>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );

  return <>{burgerButton}{drawer}</>;
}
