"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

function triggerExistingHeaderAction(selector: string) {
  const control = document.querySelector<HTMLButtonElement>(selector);
  control?.click();
}

export default function HomeTopHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateHeader = () => setIsScrolled(window.scrollY > 36);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  return (
    <header
      className={`home-top-header${isScrolled ? " is-scrolled" : ""}`}
      aria-label="Nasty Burger House header"
    >
      <a className="home-top-header__brand" href="#top" aria-label="Nasty Burger House home">
        <Image
          src="/logo.webp"
          alt="Nasty Burger House"
          width={256}
          height={256}
          priority
        />
      </a>

      <nav className="home-top-header__nav" aria-label="Primary navigation">
        <a href="#menu">Menu</a>
        <a href="#beast-month">Beast of the Month</a>
        <button
          type="button"
          onClick={() => triggerExistingHeaderAction(".site-shell > .site-header .nav-button")}
        >
          Drip Points
        </button>
      </nav>

      <div className="home-top-header__actions">
        <button
          className="home-top-header__account"
          type="button"
          onClick={() => triggerExistingHeaderAction(".site-shell > .site-header .nav-button")}
          aria-label="Account sign in"
        >
          <span className="home-top-header__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
              <path d="M4.8 20c.8-3.4 3.4-5.4 7.2-5.4s6.4 2 7.2 5.4" />
            </svg>
          </span>
          <span className="home-top-header__action-copy">
            <small>Account</small>
            <strong>Sign in</strong>
          </span>
        </button>

        <button
          className="home-top-header__cart"
          type="button"
          onClick={() => triggerExistingHeaderAction(".site-shell > .site-header .cart-button")}
          aria-label="Open cart or start an order"
        >
          <span className="home-top-header__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3.5 5h2l1.7 9.1a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L20 8H7" />
              <path d="M10 20a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM19 20a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
            </svg>
          </span>
          <span className="home-top-header__action-copy">
            <small>Your order</small>
            <strong>Cart</strong>
          </span>
        </button>
      </div>
    </header>
  );
}
