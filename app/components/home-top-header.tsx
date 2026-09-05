"use client";

import { UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  readSignedInCustomerProfile,
  signOutCustomer,
} from "../lib/customer-store";
import { getBrowserClientOrNull } from "../lib/supabase/client";

const CART_STORAGE_KEY = "nasty-burger-cart-v2";

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

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? "";
}

function authDisplayName(
  user: { user_metadata?: Record<string, unknown> } | null | undefined,
) {
  const name = user?.user_metadata?.name;
  return typeof name === "string" ? name.trim() : "";
}

export default function HomeTopHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isMenuPage = pathname.startsWith("/menu/");
  const isProductPage = pathname.startsWith("/product/");
  const [isHidden, setIsHidden] = useState(false);
  const [isHeroTransparent, setIsHeroTransparent] = useState(isHome);
  const [cartCount, setCartCount] = useState(0);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const lastScrollY = useRef(0);
  const accountMenuRef = useRef<HTMLDivElement>(null);

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
    let active = true;
    const supabase = getBrowserClientOrNull();

    async function updateAccount() {
      const localProfile = readSignedInCustomerProfile();

      if (!supabase) {
        if (active) {
          setIsSignedIn(Boolean(localProfile));
          setCustomerName(localProfile?.name ?? "");
        }
        return;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        let resolvedName = authDisplayName(user) || localProfile?.name || "";
        if (user && !resolvedName) {
          const { data: customer } = await supabase
            .from("customers")
            .select("name")
            .eq("id", user.id)
            .maybeSingle();
          if (typeof customer?.name === "string") {
            resolvedName = customer.name.trim();
          }
        }

        if (active) {
          setIsSignedIn(Boolean(user));
          setCustomerName(resolvedName);
        }
      } catch {
        if (active) {
          setIsSignedIn(Boolean(localProfile));
          setCustomerName(localProfile?.name ?? "");
        }
      }
    }

    void updateAccount();

    const { data: authState } = supabase?.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const localProfile = readSignedInCustomerProfile();
      setIsSignedIn(Boolean(session?.user));
      setCustomerName(
        authDisplayName(session?.user) || localProfile?.name || "",
      );
      if (session?.user && !authDisplayName(session.user) && !localProfile?.name) {
        void updateAccount();
      }
    }) ?? { data: { subscription: null } };

    const refreshAccount = () => void updateAccount();
    window.addEventListener("storage", refreshAccount);
    window.addEventListener("focus", refreshAccount);
    window.addEventListener("nasty-customer-updated", refreshAccount);

    return () => {
      active = false;
      authState.subscription?.unsubscribe();
      window.removeEventListener("storage", refreshAccount);
      window.removeEventListener("focus", refreshAccount);
      window.removeEventListener("nasty-customer-updated", refreshAccount);
    };
  }, []);

  useEffect(() => {
    function closeAccountMenu(event: MouseEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setIsAccountOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsAccountOpen(false);
    }

    document.addEventListener("mousedown", closeAccountMenu);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeAccountMenu);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    setIsAccountOpen(false);
  }, [pathname]);

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
    catalogueScroller?.addEventListener("scroll", updateCatalogueHeader, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateWindowHeader);
      window.removeEventListener("resize", updateWindowHeader);
      catalogueScroller?.removeEventListener("scroll", updateCatalogueHeader);
    };
  }, [isHome, isMenuPage, isProductPage, pathname]);

  async function handleSignOut() {
    const supabase = getBrowserClientOrNull();
    try {
      await supabase?.auth.signOut();
    } finally {
      signOutCustomer();
      setIsSignedIn(false);
      setCustomerName("");
      setIsAccountOpen(false);
      window.location.assign("/");
    }
  }

  const greetingName = firstName(customerName);
  const headerClassName = [
    "home-top-header",
    isHome ? "is-home-route" : "is-inner-route",
    isHome && isHeroTransparent ? "is-hero-transparent" : "is-dark",
    isHidden ? "is-hidden" : "is-visible",
  ].join(" ");

  return (
    <header className={headerClassName} aria-label="Nasty Burger House header">
      <Link className="home-top-header__brand" href="/" aria-label="Nasty Burger House home">
        <Image src="/logo.webp" alt="Nasty Burger House" width={256} height={256} priority />
      </Link>

      <nav className="home-top-header__nav" aria-label="Primary navigation">
        <Link href="/menu/burgers">Menu</Link>
        <Link href="/beast-of-the-month">Beast of the Month</Link>
        <Link href={isHome ? "#find-us" : "/#find-us"}>Find Us</Link>
        <Link className="home-top-header__drip" href="/drip-points">
          <span className="home-top-header__drip-icon" aria-hidden="true">
            <Image src="/images/drip-points/drip-coin.png" alt="" width={32} height={32} />
          </span>
          <span>Drip Points</span>
        </Link>
      </nav>

      <div className="home-top-header__actions">
        <div className="home-top-header__account-menu" ref={accountMenuRef}>
          <button
            className="home-top-header__account"
            type="button"
            aria-haspopup="menu"
            aria-expanded={isAccountOpen}
            aria-label={isSignedIn ? `Account menu${greetingName ? ` for ${greetingName}` : ""}` : "Account menu"}
            onClick={() => setIsAccountOpen((current) => !current)}
          >
            <span className="home-top-header__icon" aria-hidden="true">
              <HugeiconsIcon icon={UserIcon} size={22} color="currentColor" strokeWidth={1.9} />
            </span>
            <span className="home-top-header__action-copy">
              <small>Account</small>
              <strong>
                {isSignedIn
                  ? greetingName
                    ? `Hello, ${greetingName}`
                    : "My account"
                  : "Sign in"}
              </strong>
            </span>
            <span className="home-top-header__account-chevron" aria-hidden="true">⌄</span>
          </button>

          {isAccountOpen && (
            <div className="home-top-header__account-dropdown" role="menu">
              {isSignedIn ? (
                <>
                  <div className="home-top-header__account-greeting">
                    <small>Nasty account</small>
                    <strong>{greetingName ? `Hello, ${greetingName}` : "Welcome back"}</strong>
                  </div>
                  <Link href="/account" role="menuitem">My profile</Link>
                  <Link href="/account/orders" role="menuitem">My orders</Link>
                  <Link href="/drip-points" role="menuitem">Drip Points</Link>
                  <Link href="/reviews" role="menuitem">Reviews</Link>
                  <button type="button" role="menuitem" onClick={handleSignOut}>Sign out</button>
                </>
              ) : (
                <>
                  <div className="home-top-header__account-greeting">
                    <small>Nasty account</small>
                    <strong>Your account</strong>
                  </div>
                  <Link href="/account/sign-in" role="menuitem">Sign in</Link>
                  <Link href="/account/create" role="menuitem">Create account</Link>
                </>
              )}
            </div>
          )}
        </div>

        <Link className="home-top-header__cart home-top-header__cart--bag" href="/cart" aria-label={`Open cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}>
          <span className="home-top-header__bag-mark" aria-hidden="true">
            <Image src="/images/bag.webp" alt="" width={48} height={48} />
          </span>
          <strong className="home-top-header__cart-count">{cartCount}</strong>
        </Link>
      </div>
    </header>
  );
}
