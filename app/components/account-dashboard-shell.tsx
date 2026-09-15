"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  loadCurrentCustomer,
  loadCustomerOrders,
  loadCustomerReviews,
  signOutCurrentCustomer,
} from "../lib/customer-backend";
import type { CustomerProfile } from "../lib/customer-store";

function initialsFor(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "NB"
  );
}

export default function AccountDashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [customer, orders, reviews] = await Promise.all([
          loadCurrentCustomer(),
          loadCustomerOrders(),
          loadCustomerReviews(),
        ]);
        if (!active) return;
        setProfile(customer);
        setOrderCount(orders.length);
        setReviewCount(reviews.length);
      } finally {
        if (active) setReady(true);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const activeSection = useMemo(() => {
    if (pathname.startsWith("/account/orders")) return "orders";
    if (pathname.startsWith("/account/drip-points")) return "drip";
    if (pathname.startsWith("/account/reviews")) return "reviews";
    return "overview";
  }, [pathname]);

  async function signOut() {
    try {
      await signOutCurrentCustomer();
    } finally {
      router.push("/account/sign-in");
      router.refresh();
    }
  }

  if (!ready || !profile) {
    return <>{children}</>;
  }

  const initials = initialsFor(profile.name);

  return (
    <div className="account-page account-saas-page account-saas-layout-page">
      <main className="account-saas-shell account-saas-shell--persistent">
        <aside className="account-saas-sidebar" aria-label="Account navigation">
          <div className="account-saas-brand">
            <div className="account-saas-brand-mark">N</div>
            <div>
              <strong>Nasty Account</strong>
              <span>Customer dashboard</span>
            </div>
          </div>

          <nav className="account-saas-nav">
            <Link className={activeSection === "overview" ? "is-active" : ""} href="/account">
              <span className="account-saas-nav-icon" aria-hidden="true">▦</span>
              Overview
            </Link>
            <Link className={activeSection === "orders" ? "is-active" : ""} href="/account/orders">
              <span className="account-saas-nav-icon" aria-hidden="true">◫</span>
              Orders
              {orderCount > 0 && <em>{orderCount}</em>}
            </Link>
            <Link className={activeSection === "drip" ? "is-active" : ""} href="/account/drip-points">
              <span className="account-saas-nav-icon account-saas-nav-icon--coin" aria-hidden="true">●</span>
              Drip Points
            </Link>
            <Link className={activeSection === "reviews" ? "is-active" : ""} href="/account/reviews">
              <span className="account-saas-nav-icon" aria-hidden="true">☆</span>
              Reviews
              {reviewCount > 0 && <em>{reviewCount}</em>}
            </Link>
            <Link href="/account#profile">
              <span className="account-saas-nav-icon" aria-hidden="true">◉</span>
              Profile
            </Link>
            <Link href="/menu/burgers">
              <span className="account-saas-nav-icon" aria-hidden="true">＋</span>
              Order food
            </Link>
          </nav>

          <div className="account-saas-sidebar-footer">
            <div className="account-saas-user">
              <span>{initials}</span>
              <div>
                <strong>{profile.name}</strong>
                <small>{profile.email}</small>
              </div>
            </div>
            <button type="button" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </aside>

        <section className="account-saas-content account-saas-route-content">
          {children}
        </section>
      </main>
    </div>
  );
}
