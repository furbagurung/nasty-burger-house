"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Cookie,
  FileText,
  HelpCircle,
  Home,
  MoreHorizontal,
  ShieldCheck,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

const CART_STORAGE_KEY = "nasty-burger-cart-v2";

type MobileTab =
  | "home"
  | "menu"
  | "cart"
  | "drip"
  | "more"
  | "order"
  | "profile";

type MobileBottomNavProps = {
  active: MobileTab;
  cartCount?: number;
  onOrder?: () => void;
  onCart?: () => void;
  onProfile?: () => void;
};

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

function CartBag({ count }: { count: number }) {
  return (
    <span className="mobile-tab__primary-cart-circle" aria-hidden="true">
      <Image
        className="mobile-tab__primary-cart-bag"
        src="/images/bag.webp"
        alt=""
        width={80}
        height={80}
      />
      {count > 0 && (
        <strong className="mobile-tab__primary-cart-badge">{count}</strong>
      )}
    </span>
  );
}

export default function MobileBottomNav({
  active,
  cartCount,
  onCart,
  onProfile,
}: MobileBottomNavProps) {
  const [storedCartCount, setStoredCartCount] = useState(0);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const visibleCartCount = cartCount ?? storedCartCount;
  const cartActive = active === "cart" || active === "order";
  const dripActive = active === "drip" || active === "profile";

  useEffect(() => {
    if (cartCount !== undefined) return;

    const refreshCount = () => setStoredCartCount(getStoredCartCount());
    refreshCount();
    window.addEventListener("storage", refreshCount);
    window.addEventListener("pageshow", refreshCount);
    window.addEventListener("nasty-cart-updated", refreshCount);

    return () => {
      window.removeEventListener("storage", refreshCount);
      window.removeEventListener("pageshow", refreshCount);
      window.removeEventListener("nasty-cart-updated", refreshCount);
    };
  }, [cartCount]);

  useEffect(() => {
    if (!isMoreOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMoreOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMoreOpen]);

  const openCookieSettings = () => {
    setIsMoreOpen(false);
    window.dispatchEvent(new Event("nasty:open-cookie-settings"));
  };

  return (
    <>
      <nav
        className="mobile-tab-bar mobile-tab-bar--v2"
        aria-label="Mobile app navigation"
      >
        <Link
          className={`mobile-tab ${active === "home" ? "is-active" : ""}`}
          href="/"
          aria-current={active === "home" ? "page" : undefined}
        >
          <Home aria-hidden="true" />
          <span>Home</span>
        </Link>

        <Link
          className={`mobile-tab ${active === "menu" ? "is-active" : ""}`}
          href="/menu/burgers"
          aria-current={active === "menu" ? "page" : undefined}
        >
          <UtensilsCrossed aria-hidden="true" />
          <span>Menu</span>
        </Link>

        {onCart ? (
          <button
            className={`mobile-tab mobile-tab--primary-cart ${cartActive ? "is-active" : ""}`}
            type="button"
            onClick={onCart}
            aria-label={
              visibleCartCount > 0
                ? `Open cart, ${visibleCartCount} item${visibleCartCount === 1 ? "" : "s"}`
                : "Open cart"
            }
          >
            <CartBag count={visibleCartCount} />
            <span className="mobile-tab__primary-cart-label">Cart</span>
          </button>
        ) : (
          <Link
            className={`mobile-tab mobile-tab--primary-cart ${cartActive ? "is-active" : ""}`}
            href="/?cart=1"
            aria-label={
              visibleCartCount > 0
                ? `Open cart, ${visibleCartCount} item${visibleCartCount === 1 ? "" : "s"}`
                : "Open cart"
            }
          >
            <CartBag count={visibleCartCount} />
            <span className="mobile-tab__primary-cart-label">Cart</span>
          </Link>
        )}

        {onProfile ? (
          <button
            className={`mobile-tab mobile-tab--drip ${dripActive ? "is-active" : ""}`}
            type="button"
            onClick={onProfile}
            aria-label="Drip Points"
          >
            <Image
              className="mobile-tab__drip-coin"
              src="/images/drip-points/drip-coin.png"
              alt=""
              width={32}
              height={32}
            />
            <span>Drip Points</span>
          </button>
        ) : (
          <Link
            className={`mobile-tab mobile-tab--drip ${dripActive ? "is-active" : ""}`}
            href="/?loyalty=1"
            aria-label="Drip Points"
          >
            <Image
              className="mobile-tab__drip-coin"
              src="/images/drip-points/drip-coin.png"
              alt=""
              width={32}
              height={32}
            />
            <span>Drip Points</span>
          </Link>
        )}

        <button
          className={`mobile-tab ${isMoreOpen || active === "more" ? "is-active" : ""}`}
          type="button"
          onClick={() => setIsMoreOpen(true)}
          aria-expanded={isMoreOpen}
          aria-controls="mobile-more-sheet"
        >
          <MoreHorizontal aria-hidden="true" />
          <span>More</span>
        </button>
      </nav>

      {isMoreOpen && (
        <div
          className="mobile-more-backdrop"
          role="presentation"
          onMouseDown={() => setIsMoreOpen(false)}
        >
          <aside
            className="mobile-more-sheet"
            id="mobile-more-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-more-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mobile-more-sheet__heading">
              <div>
                <p>More</p>
                <h2 id="mobile-more-title">Nasty Burger House</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                aria-label="Close more menu"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <nav className="mobile-more-sheet__links" aria-label="More links">
              <Link href="/help-support" onClick={() => setIsMoreOpen(false)}>
                <HelpCircle aria-hidden="true" />
                <span>
                  <strong>Help &amp; Support</strong>
                  <small>Ordering help and contact information</small>
                </span>
              </Link>

              <Link href="/privacy-policy" onClick={() => setIsMoreOpen(false)}>
                <ShieldCheck aria-hidden="true" />
                <span>
                  <strong>Privacy Policy</strong>
                  <small>How your information is handled</small>
                </span>
              </Link>

              <Link
                href="/terms-and-conditions"
                onClick={() => setIsMoreOpen(false)}
              >
                <FileText aria-hidden="true" />
                <span>
                  <strong>Terms &amp; Conditions</strong>
                  <small>Ordering and website terms</small>
                </span>
              </Link>

              <button type="button" onClick={openCookieSettings}>
                <Cookie aria-hidden="true" />
                <span>
                  <strong>Cookie settings</strong>
                  <small>Review your privacy preferences</small>
                </span>
              </button>
            </nav>

            <div className="mobile-more-sheet__socials">
              <span>Follow Nasty Burger House</span>
              <div>
                <a
                  href="https://www.instagram.com/nastyburgerhouse/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram
                </a>
                <a
                  href="https://www.tiktok.com/@nastyburgerhouse"
                  target="_blank"
                  rel="noreferrer"
                >
                  TikTok
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61590139712227"
                  target="_blank"
                  rel="noreferrer"
                >
                  Facebook
                </a>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
