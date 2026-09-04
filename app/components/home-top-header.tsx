"use client";

import Image from "next/image";
import { ShoppingBag, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function triggerHomeAction(selector: string, fallbackHref: string) {
  const control = document.querySelector<HTMLButtonElement>(selector);

  if (control) {
    control.click();
    return;
  }

  window.location.href = fallbackHref;
}

export default function HomeTopHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
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
      <a
        className="home-top-header__brand"
        href="/"
        aria-label="Nasty Burger House home"
      >
        <Image
          src="/logo.webp"
          alt="Nasty Burger House"
          width={256}
          height={256}
          priority
        />
      </a>

      <nav className="home-top-header__nav" aria-label="Primary navigation">
        <a href={isHome ? "#menu" : "/#menu"}>Menu</a>
        <a href={isHome ? "#beast-month" : "/#beast-month"}>
          Beast of the Month
        </a>
        <button
          type="button"
          onClick={() =>
            triggerHomeAction(
              ".site-shell > .site-header .nav-button",
              "/?loyalty=1",
            )
          }
        >
          Drip Points
        </button>
      </nav>

      <div className="home-top-header__actions">
        <button
          className="home-top-header__account"
          type="button"
          onClick={() =>
            triggerHomeAction(
              ".site-shell > .site-header .nav-button",
              "/?loyalty=1",
            )
          }
          aria-label="Account sign in"
        >
          <span className="home-top-header__icon" aria-hidden="true">
            <UserRound size={22} strokeWidth={1.9} />
          </span>
          <span className="home-top-header__action-copy">
            <small>Account</small>
            <strong>Sign in</strong>
          </span>
        </button>

        <button
          className="home-top-header__cart"
          type="button"
          onClick={() =>
            triggerHomeAction(
              ".site-shell > .site-header .cart-button",
              "/?cart=1",
            )
          }
          aria-label="Open cart or start an order"
        >
          <span className="home-top-header__icon" aria-hidden="true">
            <ShoppingBag size={22} strokeWidth={1.9} />
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
