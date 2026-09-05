"use client";

import {
  Cancel01Icon,
  File01Icon,
  HelpCircleIcon,
  Home01Icon,
  MenuRestaurantIcon,
  Settings01Icon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import SocialIcon from "./social-icons";

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

function MoreTabIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <path d="M10.5 8.75V6.75C10.5 5.10626 10.5 4.28439 10.046 3.73121C9.96291 3.62995 9.87005 3.53709 9.76879 3.45398C9.21561 3 8.39374 3 6.75 3C5.10626 3 4.28439 3 3.73121 3.45398C3.62995 3.53709 3.53709 3.62995 3.45398 3.73121C3 4.28439 3 5.10626 3 6.75V8.75C3 10.3937 3 11.2156 3.45398 11.7688C3.53709 11.8701 3.62995 11.9629 3.73121 12.046C4.28439 12.5 5.10626 12.5 6.75 12.5C8.39374 12.5 9.21561 12.5 9.76879 12.046C9.87005 11.9629 9.96291 11.8701 10.046 11.7688C10.5 11.2156 10.5 10.3937 10.5 8.75Z" />
        <path d="M7.75 15.5H5.75C5.05222 15.5 4.70333 15.5 4.41943 15.5861C3.78023 15.78 3.28002 16.2802 3.08612 16.9194C3 17.2033 3 17.5522 3 18.25C3 18.9478 3 19.2967 3.08612 19.5806C3.28002 20.2198 3.78023 20.72 4.41943 20.9139C4.70333 21 5.05222 21 5.75 21H7.75C8.44778 21 8.79667 21 9.08057 20.9139C9.71977 20.72 10.22 20.2198 10.4139 19.5806C10.5 19.2967 10.5 18.9478 10.5 18.25C10.5 17.5522 10.5 17.2033 10.4139 16.9194C10.22 16.2802 9.71977 15.78 9.08057 15.5861C8.79667 15.5 8.44778 15.5 7.75 15.5Z" />
        <path d="M21 17.25V15.25C21 13.6063 21 12.7844 20.546 12.2312C20.4629 12.1299 20.3701 12.0371 20.2688 11.954C19.7156 11.5 18.8937 11.5 17.25 11.5C15.6063 11.5 14.7844 11.5 14.2312 11.954C14.1299 12.0371 14.0371 12.1299 13.954 12.2312C13.5 12.7844 13.5 13.6063 13.5 15.25V17.25C13.5 18.8937 13.5 19.7156 13.954 20.2688C14.0371 20.3701 14.1299 20.4629 14.2312 20.546C14.7844 21 15.6063 21 17.25 21C18.8937 21 19.7156 21 20.2688 20.546C20.3701 20.4629 20.4629 20.3701 20.546 20.2688C21 19.7156 21 18.8937 21 17.25Z" />
        <path d="M18.25 3H16.25C15.5522 3 15.2033 3 14.9194 3.08612C14.2802 3.28002 13.78 3.78023 13.5861 4.41943C13.5 4.70333 13.5 5.05222 13.5 5.75C13.5 6.44778 13.5 6.79667 13.5861 7.08057C13.78 7.71977 14.2802 8.21998 14.9194 8.41388C15.2033 8.5 15.5522 8.5 16.25 8.5H18.25C18.9478 8.5 19.2967 8.5 19.5806 8.41388C20.2198 8.21998 20.72 7.71977 20.9139 7.08057C21 6.79667 21 6.44778 21 5.75C21 5.05222 21 4.70333 20.9139 4.41943C20.72 3.78023 20.2198 3.28002 19.5806 3.08612C19.2967 3 18.9478 3 18.25 3Z" />
      </g>
    </svg>
  );
}

function AppIcon({ icon }: { icon: Parameters<typeof HugeiconsIcon>[0]["icon"] }) {
  return <HugeiconsIcon icon={icon} color="currentColor" size={24} strokeWidth={1.8} aria-hidden="true" />;
}

function getStoredCartCount() {
  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!storedCart) return 0;
    const parsedCart = JSON.parse(storedCart) as unknown;
    if (!Array.isArray(parsedCart)) return 0;
    return parsedCart.reduce((total, entry) => {
      if (!entry || typeof entry !== "object" || !("quantity" in entry)) return total;
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
      <Image className="mobile-tab__primary-cart-bag" src="/images/bag.webp" alt="" width={80} height={80} />
      {count > 0 && <strong className="mobile-tab__primary-cart-badge">{count}</strong>}
    </span>
  );
}

export default function MobileBottomNav({ active, cartCount }: MobileBottomNavProps) {
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
      <nav className="mobile-tab-bar mobile-tab-bar--v2" aria-label="Mobile app navigation">
        <Link className={`mobile-tab ${active === "home" ? "is-active" : ""}`} href="/" aria-current={active === "home" ? "page" : undefined}>
          <AppIcon icon={Home01Icon} /><span>Home</span>
        </Link>
        <Link className={`mobile-tab ${active === "menu" ? "is-active" : ""}`} href="/menu/burgers" aria-current={active === "menu" ? "page" : undefined}>
          <AppIcon icon={MenuRestaurantIcon} /><span>Menu</span>
        </Link>
        <Link className={`mobile-tab mobile-tab--primary-cart ${cartActive ? "is-active" : ""}`} href="/cart" aria-label={visibleCartCount > 0 ? `Open cart, ${visibleCartCount} item${visibleCartCount === 1 ? "" : "s"}` : "Open cart"} aria-current={cartActive ? "page" : undefined}>
          <CartBag count={visibleCartCount} />
        </Link>
        <Link className={`mobile-tab mobile-tab--drip ${dripActive ? "is-active" : ""}`} href="/drip-points" aria-label="Drip Points" aria-current={dripActive ? "page" : undefined}>
          <Image className="mobile-tab__drip-coin" src="/images/drip-points/drip-coin.png" alt="" width={32} height={32} /><span>Drip Points</span>
        </Link>
        <button className={`mobile-tab ${isMoreOpen || active === "more" ? "is-active" : ""}`} type="button" onClick={() => setIsMoreOpen(true)} aria-expanded={isMoreOpen} aria-controls="mobile-more-sheet">
          <MoreTabIcon /><span>More</span>
        </button>
      </nav>

      {isMoreOpen && (
        <div className="mobile-more-backdrop" role="presentation" onMouseDown={() => setIsMoreOpen(false)}>
          <aside className="mobile-more-sheet" id="mobile-more-sheet" role="dialog" aria-modal="true" aria-labelledby="mobile-more-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="mobile-more-sheet__heading">
              <div><p>More</p><h2 id="mobile-more-title">Nasty Burger House</h2></div>
              <button type="button" onClick={() => setIsMoreOpen(false)} aria-label="Close more menu"><AppIcon icon={Cancel01Icon} /></button>
            </div>

            <nav className="mobile-more-sheet__links" aria-label="Account and support links">
              <Link href="/account" onClick={() => setIsMoreOpen(false)}>
                <AppIcon icon={Home01Icon} /><span><strong>My account</strong><small>Profile, Drip Points and quick actions</small></span>
              </Link>
              <Link href="/account/orders" onClick={() => setIsMoreOpen(false)}>
                <AppIcon icon={File01Icon} /><span><strong>Order history</strong><small>Receipts, points earned and order details</small></span>
              </Link>
              <Link href="/reviews" onClick={() => setIsMoreOpen(false)}>
                <AppIcon icon={HelpCircleIcon} /><span><strong>Reviews</strong><small>Rate recent orders and manage feedback</small></span>
              </Link>
              <Link href="/help-support" onClick={() => setIsMoreOpen(false)}>
                <AppIcon icon={HelpCircleIcon} /><span><strong>Help &amp; Support</strong><small>Ordering help and contact information</small></span>
              </Link>
              <Link href="/privacy-policy" onClick={() => setIsMoreOpen(false)}>
                <AppIcon icon={Shield01Icon} /><span><strong>Privacy Policy</strong><small>How your information is handled</small></span>
              </Link>
              <Link href="/terms-and-conditions" onClick={() => setIsMoreOpen(false)}>
                <AppIcon icon={File01Icon} /><span><strong>Terms &amp; Conditions</strong><small>Ordering and website terms</small></span>
              </Link>
              <button type="button" onClick={openCookieSettings}>
                <AppIcon icon={Settings01Icon} /><span><strong>Cookie settings</strong><small>Review your privacy preferences</small></span>
              </button>
            </nav>

            <div className="mobile-more-sheet__socials">
              <span>Follow Nasty Burger House</span>
              <div>
                <a href="https://www.instagram.com/nastyburgerhouse/" target="_blank" rel="noreferrer" aria-label="Nasty Burger House on Instagram"><SocialIcon name="instagram" /><span>Instagram</span></a>
                <a href="https://www.tiktok.com/@nastyburgerhouse" target="_blank" rel="noreferrer" aria-label="Nasty Burger House on TikTok"><SocialIcon name="tiktok" /><span>TikTok</span></a>
                <a href="https://www.facebook.com/profile.php?id=61590139712227" target="_blank" rel="noreferrer" aria-label="Nasty Burger House on Facebook"><SocialIcon name="facebook" /><span>Facebook</span></a>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
