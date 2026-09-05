"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  dripBalance,
  ensureSignupBonus,
  readCustomerOrders,
  readCustomerReviews,
  readDripLedger,
  readSignedInCustomerProfile,
  saveCustomerProfile,
  signOutCustomer,
  type CustomerProfile,
} from "../lib/customer-store";
import {
  DRIP_REWARD_TARGET,
  dripProgressPercent,
} from "../lib/loyalty";
import MobileBottomNav from "./mobile-bottom-nav";

export default function AccountProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);
  const [balance, setBalance] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    const current = readSignedInCustomerProfile();
    if (current) {
      ensureSignupBonus();
      setProfile(current);
      setName(current.name);
      setEmail(current.email);
      setPhone(current.phone);
      setBirthday(current.birthday ?? "");
    }
    setBalance(dripBalance(readDripLedger()));
    setOrderCount(readCustomerOrders().length);
    setReviewCount(readCustomerReviews().length);
    setReady(true);
  }, []);

  const progress = useMemo(() => dripProgressPercent(balance), [balance]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const updated = saveCustomerProfile({ name, email, phone, birthday });
    setProfile(updated);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function signOut() {
    signOutCustomer();
    router.push("/account/sign-in");
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
          <button type="button" onClick={signOut}>Sign out</button>
        </header>

        <section className="account-overview-grid">
          <Link className="account-overview-card account-overview-card--drip" href="/drip-points">
            <Image src="/images/drip-points/drip-coin.png" alt="" width={72} height={72} />
            <span>Drip Points</span>
            <strong>{balance.toLocaleString()}</strong>
            <small>{progress}% toward {DRIP_REWARD_TARGET.toLocaleString()} points</small>
            <i aria-hidden="true"><b style={{ width: `${progress}%` }} /></i>
          </Link>
          <Link className="account-overview-card" href="/account/orders">
            <span>Orders</span>
            <strong>{orderCount}</strong>
            <small>View order history and order details</small>
          </Link>
          <Link className="account-overview-card" href="/reviews">
            <span>Reviews</span>
            <strong>{reviewCount}</strong>
            <small>Rate recent orders and manage feedback</small>
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
              <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
              <label>Mobile number<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required /></label>
              <label>Birthday <small>Optional</small><input type="date" value={birthday} onChange={(event) => setBirthday(event.target.value)} /></label>
            </div>
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
