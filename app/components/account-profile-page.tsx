"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  customerBackendMode,
  loadCurrentCustomer,
  loadCustomerOrders,
  loadCustomerReviews,
  loadDripActivity,
  signOutCurrentCustomer,
  updateCurrentCustomer,
} from "../lib/customer-backend";
import type { CustomerProfile, DripLedgerEntry } from "../lib/customer-store";
import {
  DRIP_REWARD_TARGET,
  dripProgressPercent,
} from "../lib/loyalty";
import MobileBottomNav from "./mobile-bottom-nav";

export default function AccountProfilePage() {
  const router = useRouter();
  const backendMode = customerBackendMode();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState<DripLedgerEntry[]>([]);
  const [orderCount, setOrderCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [current, drip, orders, reviews] = await Promise.all([
          loadCurrentCustomer(),
          loadDripActivity(),
          loadCustomerOrders(),
          loadCustomerReviews(),
        ]);
        if (!active) return;
        setProfile(current);
        if (current) {
          setName(current.name);
          setEmail(current.email);
          setPhone(current.phone);
          setBirthday(current.birthday ?? "");
        }
        setBalance(drip.balance);
        setLedger(drip.entries);
        setOrderCount(orders.length);
        setReviewCount(reviews.length);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Could not load your account.");
      } finally {
        if (active) setReady(true);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const progress = useMemo(() => dripProgressPercent(balance), [balance]);
  const pendingPoints = useMemo(
    () =>
      ledger.reduce(
        (total, entry) =>
          entry.status === "pending" ? total + Math.max(0, entry.points) : total,
        0,
      ),
    [ledger],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const updated = await updateCurrentCustomer({ name, email, phone, birthday });
      setProfile(updated);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save your profile.");
    }
  }

  async function signOut() {
    try {
      await signOutCurrentCustomer();
    } finally {
      router.push("/account/sign-in");
      router.refresh();
    }
  }

  if (!ready) {
    return <div className="standalone-page"><main className="standalone-main"><div className="cart-page-loading">Loading your account…</div></main></div>;
  }

  if (!profile) {
    return (
      <div className="standalone-page account-page">
        <main className="standalone-main account-empty-main">
          <section className="account-empty-card">
            <Image src="/images/drip-points/drip-coin.png" alt="" width={120} height={120} />
            <p className="standalone-eyebrow">Nasty account</p>
            <h1>Your account lives here.</h1>
            <p>Create an account to save checkout details, build order history and earn Drip Points.</p>
            {error && <p className="account-form-error" role="alert">{error}</p>}
            <div className="account-empty-actions">
              <Link className="standalone-primary-button" href="/account/create">Create account</Link>
              <Link className="standalone-secondary-link" href="/account/sign-in">Sign in</Link>
            </div>
          </section>
        </main>
        <MobileBottomNav active="more" />
      </div>
    );
  }

  return (
    <div className="standalone-page account-page">
      <main className="standalone-main account-dashboard-main">
        <header className="account-dashboard-heading">
          <div>
            <p className="standalone-eyebrow">Nasty account</p>
            <h1>Hey, {profile.name.split(" ")[0]}.</h1>
            <p>Manage your profile, rewards, orders and feedback from one place.</p>
          </div>
          <button type="button" onClick={() => void signOut()}>Sign out</button>
        </header>

        <section className="account-overview-grid">
          <Link className="account-overview-card account-overview-card--drip" href="/drip-points">
            <Image src="/images/drip-points/drip-coin.png" alt="" width={72} height={72} />
            <span>Available Drip Points</span>
            <strong>{balance.toLocaleString()}</strong>
            <small>
              {pendingPoints > 0
                ? `${pendingPoints.toLocaleString()} pending · ${progress}% toward reward`
                : `${progress}% toward ${DRIP_REWARD_TARGET.toLocaleString()} points`}
            </small>
            <i aria-hidden="true"><b style={{ width: `${progress}%` }} /></i>
          </Link>
          <Link className="account-overview-card" href="/account/orders">
            <span>Orders</span>
            <strong>{orderCount}</strong>
            <small>View live status, receipts and history</small>
          </Link>
          <Link className="account-overview-card" href="/reviews">
            <span>Reviews</span>
            <strong>{reviewCount}</strong>
            <small>Rate completed orders and manage feedback</small>
          </Link>
        </section>

        <section className="account-dashboard-layout">
          <form className="account-card account-profile-form" onSubmit={submit}>
            <div className="account-section-heading">
              <div><p className="standalone-eyebrow">Profile</p><h2>Your details</h2></div>
              {saved && <span>Saved</span>}
            </div>
            <div className="account-form-grid">
              <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required /></label>
              <label>
                Email address
                <input type="email" value={email} readOnly={backendMode === "supabase"} onChange={(event) => setEmail(event.target.value)} required />
                {backendMode === "supabase" && <small>Managed by secure account authentication.</small>}
              </label>
              <label>Mobile number<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required /></label>
              <label>Birthday <small>Optional</small><input type="date" value={birthday} onChange={(event) => setBirthday(event.target.value)} /></label>
            </div>
            {error && <p className="account-form-error" role="alert">{error}</p>}
            <button className="standalone-primary-button" type="submit">Save profile</button>
          </form>

          <aside className="account-card account-quick-links">
            <p className="standalone-eyebrow">Quick actions</p>
            <h2>Keep it moving.</h2>
            <Link href="/menu/burgers"><span>Order again</span><strong>→</strong></Link>
            <Link href="/account/orders"><span>Order history</span><strong>→</strong></Link>
            <Link href="/drip-points"><span>Drip Points activity</span><strong>→</strong></Link>
            <Link href="/reviews"><span>Leave a review</span><strong>→</strong></Link>
          </aside>
        </section>
      </main>
      <MobileBottomNav active="more" />
    </div>
  );
}
