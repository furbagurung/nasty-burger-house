"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { menuNavigationCategories } from "../data/menu-pages";
import { MenuToggleIcon } from "./menu-toggle-icon";

export default function CatalogueMobileMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div className="catalogue-mobile-menu">
      <button
        className="catalogue-menu-trigger"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={isOpen}
        aria-controls="catalogue-navigation"
      >
        <MenuToggleIcon open={isOpen} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          className="drawer-backdrop mobile-nav-backdrop"
          role="presentation"
          onMouseDown={() => setIsOpen(false)}
        >
          <aside
            className="mobile-nav-drawer catalogue-nav-drawer"
            id="catalogue-navigation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalogue-navigation-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="catalogue-nav-drawer__brand">
              <Image src="/logo.webp" alt="Nasty Burger House" width={256} height={256} />
              <button
                className="close-button"
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close navigation"
              >
                <MenuToggleIcon open aria-hidden="true" />
              </button>
            </div>

            <div className="catalogue-nav-drawer__intro">
              <p className="eyebrow">Nasty Burger House</p>
              <h2 id="catalogue-navigation-title">Choose your feed.</h2>
            </div>

            <nav className="mobile-nav-links" aria-label="Menu navigation">
              <Link
                className={pathname === "/" ? "is-active" : undefined}
                href="/"
                aria-current={pathname === "/" ? "page" : undefined}
                onClick={() => setIsOpen(false)}
              >
                Home <span aria-hidden="true">→</span>
              </Link>
              {menuNavigationCategories.map((category) => {
                const href = `/menu/${category.id}`;
                const isActive = pathname === href || pathname.startsWith(`${href}/`);

                return (
                  <Link
                    className={isActive ? "is-active" : undefined}
                    href={href}
                    key={category.id}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setIsOpen(false)}
                  >
                    {category.label} <span aria-hidden="true">→</span>
                  </Link>
                );
              })}
              <Link
                className={pathname === "/drip-points" ? "is-active" : undefined}
                href="/drip-points"
                aria-current={pathname === "/drip-points" ? "page" : undefined}
                onClick={() => setIsOpen(false)}
              >
                Drip Points <span aria-hidden="true">→</span>
              </Link>
            </nav>

            <Link
              className="primary-button full-width catalogue-drawer-order"
              href="/?order=1"
              onClick={() => setIsOpen(false)}
            >
              Start pickup order
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
