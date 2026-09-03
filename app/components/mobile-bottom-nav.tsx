"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CART_STORAGE_KEY = "nasty-burger-cart-v2";

type MobileTab = "home" | "menu" | "order" | "cart" | "profile";

type MobileBottomNavProps = {
  active: MobileTab;
  cartCount?: number;
  onOrder?: () => void;
  onCart?: () => void;
  onProfile?: () => void;
};

type IconName = "home" | "menu" | "bag" | "cart" | "profile";

function TabIcon({ name }: { name: IconName }) {
  if (name === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m3 11 9-7 9 7" />
        <path d="M5.5 10v10h13V10M9 20v-6h6v6" />
      </svg>
    );
  }

  if (name === "menu") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3v7M4 3v4c0 1.7 1.3 3 3 3s3-1.3 3-3V3M7 10v11M16 3c-2 3-2 7 0 9h3V3h-3ZM19 12v9" />
      </svg>
    );
  }

  if (name === "bag") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 8h14l-1 13H6L5 8Z" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      </svg>
    );
  }

  if (name === "cart") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 4h2l2 11h10l3-8H6" />
        <circle cx="9" cy="19" r="1.3" />
        <circle cx="17" cy="19" r="1.3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21c.6-4.2 3.1-6.5 7.5-6.5s6.9 2.3 7.5 6.5" />
    </svg>
  );
}

function getStoredCartCount() {
  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!storedCart) return 0;
    const parsedCart = JSON.parse(storedCart) as unknown;
    if (!Array.isArray(parsedCart)) return 0;

    return parsedCart.reduce((total, entry) => {
      if (!entry || typeof entry !== "object" || !("quantity" in entry)) {
        return total;
      }

      const quantity = Number(entry.quantity);
      return total + (Number.isFinite(quantity) && quantity > 0 ? quantity : 0);
    }, 0);
  } catch {
    return 0;
  }
}

export default function MobileBottomNav({
  active,
  cartCount,
  onOrder,
  onCart,
  onProfile,
}: MobileBottomNavProps) {
  const [storedCartCount, setStoredCartCount] = useState(0);
  const visibleCartCount = cartCount ?? storedCartCount;

  useEffect(() => {
    if (cartCount !== undefined) return;

    const refreshCount = () => setStoredCartCount(getStoredCartCount());
    refreshCount();
    window.addEventListener("storage", refreshCount);
    window.addEventListener("pageshow", refreshCount);

    return () => {
      window.removeEventListener("storage", refreshCount);
      window.removeEventListener("pageshow", refreshCount);
    };
  }, [cartCount]);

  return (
    <nav className="mobile-tab-bar" aria-label="Mobile app navigation">
      <Link
        className={`mobile-tab ${active === "home" ? "is-active" : ""}`}
        href="/"
        aria-current={active === "home" ? "page" : undefined}
      >
        <TabIcon name="home" />
        <span>Home</span>
      </Link>

      <Link
        className={`mobile-tab ${active === "menu" ? "is-active" : ""}`}
        href="/menu/burgers"
        aria-current={active === "menu" ? "page" : undefined}
      >
        <TabIcon name="menu" />
        <span>Menu</span>
      </Link>

      {onOrder ? (
        <button
          className={`mobile-tab mobile-tab--order ${active === "order" ? "is-active" : ""}`}
          type="button"
          onClick={onOrder}
          aria-label="Order now"
        >
          <span className="mobile-tab__order-circle">
            <TabIcon name="bag" />
          </span>
          <span>Order Now</span>
        </button>
      ) : (
        <Link
          className={`mobile-tab mobile-tab--order ${active === "order" ? "is-active" : ""}`}
          href="/?order=1"
          aria-label="Order now"
        >
          <span className="mobile-tab__order-circle">
            <TabIcon name="bag" />
          </span>
          <span>Order Now</span>
        </Link>
      )}

      {onCart ? (
        <button
          className={`mobile-tab ${active === "cart" ? "is-active" : ""}`}
          type="button"
          onClick={onCart}
          aria-label={visibleCartCount > 0 ? `Cart, ${visibleCartCount} items` : "Cart"}
        >
          <span className="mobile-tab__icon-wrap">
            <TabIcon name="cart" />
            {visibleCartCount > 0 && (
              <strong className="mobile-tab__badge">{visibleCartCount}</strong>
            )}
          </span>
          <span>Cart</span>
        </button>
      ) : (
        <Link
          className={`mobile-tab ${active === "cart" ? "is-active" : ""}`}
          href="/?cart=1"
          aria-label={visibleCartCount > 0 ? `Cart, ${visibleCartCount} items` : "Cart"}
        >
          <span className="mobile-tab__icon-wrap">
            <TabIcon name="cart" />
            {visibleCartCount > 0 && (
              <strong className="mobile-tab__badge">{visibleCartCount}</strong>
            )}
          </span>
          <span>Cart</span>
        </Link>
      )}

      {onProfile ? (
        <button
          className={`mobile-tab ${active === "profile" ? "is-active" : ""}`}
          type="button"
          onClick={onProfile}
          aria-label="Profile and Drip Points"
        >
          <TabIcon name="profile" />
          <span>Profile</span>
        </button>
      ) : (
        <Link
          className={`mobile-tab ${active === "profile" ? "is-active" : ""}`}
          href="/?loyalty=1"
          aria-label="Profile and Drip Points"
        >
          <TabIcon name="profile" />
          <span>Profile</span>
        </Link>
      )}
    </nav>
  );
}
