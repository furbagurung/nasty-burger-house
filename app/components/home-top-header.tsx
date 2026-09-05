"use client";

import Image from "next/image";
import { UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const CART_STORAGE_KEY = "nasty-burger-cart-v2";

function triggerHomeAction(selector: string, fallbackHref: string) {
  const control = document.querySelector<HTMLButtonElement>(selector);

  if (control) {
    control.click();
    return;
  }

  window.location.href = fallbackHref;
}

function readCartCount() {
  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return 0;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return 0;

    return parsed.reduce((total, line) => {
      if (!line || typeof line !== "object") return total;
      const quantity = "quantity" in line ? Number(line.quantity) : 0;
      return total + (Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0);
    }, 0);
  } catch {
    return 0;
  }
}

export default function HomeTopHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isMenuPage = pathname.startsWith("/menu/");
  const isProductPage = pathname.startsWith("/product/");
  const [isHidden, setIsHidden] = useState(false);
  const [isHeroTransparent, setIsHeroTransparent] = useState(isHome);
  const [cartCount, setCartCount] = useState(0);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const updateCartCount = () => setCartCount(readCartCount());

    updateCartCount();
    const interval = window.setInterval(updateCartCount, 1200);
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("focus", updateCartCount);
    window.addEventListener("nasty-cart-updated", updateCartCount);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("focus", updateCartCount);
      window.removeEventListener("nasty-cart-updated", updateCartCount);
    };
  }, []);

  useEffect(() => {
    const catalogueScroller = document.querySelector<HTMLElement>(
      ".catalogue-shell:not(.product-page-shell) .catalogue-content",
    );

    const readCurrentScroll = () =>
      catalogueScroller ? catalogueScroller.scrollTop : window.scrollY;

    lastScrollY.current = readCurrentScroll();
    setIsHidden(false);

    const applyScrollState = (currentY: number) => {
      if (isHome) {
        const hero = document.querySelector<HTMLElement>(".hero-carousel");
        const heroBottom = hero
          ? hero.offsetTop + hero.offsetHeight
          : window.innerHeight;
        setIsHeroTransparent(window.scrollY < heroBottom - 24);
      } else {
        setIsHeroTransparent(false);
      }

      if (isMenuPage || isProductPage) {
        setIsHidden(false);
        lastScrollY.current = currentY;
        return;
      }

      if (currentY <= 16) {
        setIsHidden(false);
      } else if (currentY > lastScrollY.current + 3) {
        setIsHidden(true);
      } else if (currentY < lastScrollY.current - 3) {
        setIsHidden(false);
      }

      lastScrollY.current = currentY;
    };

    const updateWindowHeader = () => applyScrollState(window.scrollY);
    const updateCatalogueHeader = () => {
      if (catalogueScroller) applyScrollState(catalogueScroller.scrollTop);
    };

    updateWindowHeader();
    window.addEventListener("scroll", updateWindowHeader, { passive: true });
    window.addEventListener("resize", updateWindowHeader);
    catalogueScroller?.addEventListener("scroll", updateCatalogueHeader, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", updateWindowHeader);
      window.removeEventListener("resize", updateWindowHeader);
      catalogueScroller?.removeEventListener("scroll", updateCatalogueHeader);
    };
  }, [isHome, isMenuPage, isProductPage, pathname]);

  const headerClassName = [
    "home-top-header",
    isHome && isHeroTransparent ? "is-hero-transparent" : "is-dark",
    isHidden ? "is-hidden" : "is-visible",
  ].join(" ");

  return (
    <header
      className={headerClassName}
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
        <a href="/menu/burgers">Menu</a>
        <a href="/beast-of-the-month">Beast of the Month</a>
        <a className="home-top-header__drip" href="/drip-points">
          <span className="home-top-header__drip-icon" aria-hidden="true">
            <Image
              src="/images/drip-points/drip-coin.png"
              alt=""
              width={32}
              height={32}
            />
          </span>
          <span>Drip Points</span>
        </a>
      </nav>

      <div className="home-top-header__actions">
        <button
          className="home-top-header__account"
          type="button"
          onClick={() =>
            triggerHomeAction(
              ".site-shell > .site-header .nav-button",
              "/drip-points",
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
          className="home-top-header__cart home-top-header__cart--bag"
          type="button"
          onClick={() => {
            window.location.href = "/cart";
          }}
          aria-label={`Open cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
        >
          <span className="home-top-header__bag-mark" aria-hidden="true">
            <Image src="/images/bag.webp" alt="" width={48} height={48} />
          </span>
          <strong className="home-top-header__cart-count">{cartCount}</strong>
        </button>
      </div>
    </header>
  );
}
