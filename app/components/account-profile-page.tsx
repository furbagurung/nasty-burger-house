"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  customerBackendMode,
  loadCurrentCustomer,
  loadCustomerOrders,
  loadCustomerReviews,
  updateCurrentCustomer,
} from "../lib/customer-backend";
import type { CustomerProfile } from "../lib/customer-store";
import { DRIP_REWARD_TARGET, dripProgressPercent } from "../lib/loyalty";
import AccountDashboardSkeleton from "./account-dashboard-skeleton";

type SquareLoyaltyStatus = {
  ok?: boolean;
  balance?: number;
};

async function loadLoyaltyBalance() {
  try {
    const response = await fetch("/api/account/loyalty", { cache: "no-store" });
    const data = (await response.json()) as SquareLoyaltyStatus;
    return response.ok && data.ok && Number.isFinite(data.balance)
      ? Number(data.balance)
      : null;
  } catch {
    return null;
  }
}

export default function AccountProfilePage() {
  const backendMode = customerBackendMode();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [loyaltyReady, setLoyaltyReady] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadCoreAccount() {
      try {
        const [current, orders, reviews] = await Promise.all([
          loadCurrentCustomer(),
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
          setPhoneModalOpen(backendMode === "supabase" && !current.phone);
        }
        setOrderCount(orders.length);
        setReviewCount(reviews.length);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Could not load your account.");
      } finally {
        if (active) setReady(true);
      }
    }

    async function loadSquareLoyalty() {
      const loyaltyBalance = await loadLoyaltyBalance();
      if (!active) return;
      if (loyaltyBalance !== null) setBalance(loyaltyBalance);
      setLoyaltyReady(true);
    }

    void loadCoreAccount();
    void loadSquareLoyalty();

    return () => {
      active = false;
    };
  }, [backendMode]);

  const progress = useMemo(() => dripProgressPercent(balance), [balance]);

  async function saveProfileDetails(source: "page" | "modal") {
    const setSourceError = source === "modal" ? setModalError : setError;
    setSourceError("");
    const normalizedPhone = phone.replace(/[()\s-]/g, "");

    if (!/^(?:\+61|0)4\d{8}$/.test(normalizedPhone)) {
      setSourceError("Enter a valid Australian mobile number, e.g. 0491 570 006.");
      return false;
    }

    setSaving(true);
    try {
      const updated = await updateCurrentCustomer({
        name,
        email,
        phone: normalizedPhone,
        birthday,
      });
      if (!updated) throw new Error("Could not update your account.");

      setProfile(updated);
      setPhone(normalizedPhone);
      setLoyaltyReady(false);
      const loyaltyBalance = await loadLoyaltyBalance();
      if (loyaltyBalance !== null) setBalance(loyaltyBalance);
      setLoyaltyReady(true);

      setSaved(true);
      setPhoneModalOpen(false);
      setModalError("");
      setError("");
      window.setTimeout(() => setSaved(false), 1800);
      return true;
    } catch (saveError) {
      setSourceError(saveError instanceof Error ? saveError.message : "Could not save your profile.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveProfileDetails("page");
  }

  async function submitPhoneModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveProfileDetails("modal");
  }

  if (!ready) {
    return <AccountDashboardSkeleton variant="overview" />;
  }

  if (!profile) {
    return (
      <section className="account-empty-card account-saas-empty">
        <Image src="/images/drip-points/drip-coin.png" alt="" width={96} height={96} />
        <p className="standalone-eyebrow">Nasty account</p>
        <h1>Your account lives here.</h1>
        <p>Create an account to save checkout details, build order history and earn Drip Points.</p>
        <div className="account-empty-actions">
          <Link className="standalone-primary-button" href="/account/create">Create account</Link>
          <Link className="standalone-secondary-link" href="/account/sign-in">Sign in</Link>
        </div>
      </section>
    );
  }

  const firstName = profile.name.trim().split(/\s+/)[0] || "there";

  return (
    <>
      <header className="account-dashboard-heading account-saas-heading account-saas-heading--overview">
        <div>
          <p className="standalone-eyebrow">Dashboard</p>
          <h1>Welcome back, {firstName}</h1>
        </div>
        <Link className="account-saas-order-button" href="/menu/burgers">
          Order now <span aria-hidden="true">→</span>
        </Link>
      </header>

      <section className="account-overview-grid account-saas-stats" aria-label="Account overview">
        <Link className="account-overview-card account-overview-card--drip" href="/account/drip-points">
          <Image src="/images/drip-points/drip-coin.png" alt="" width={72} height={72} />
          <span>Available Drip Points</span>
          <strong>{loyaltyReady ? balance.toLocaleString() : "…"}</strong>
          <small>{loyaltyReady ? `${progress}% toward ${DRIP_REWARD_TARGET.toLocaleString()} Drip Points` : "Syncing Square Loyalty…"}</small>
          <i aria-hidden="true"><b style={{ width: `${loyaltyReady ? progress : 0}%` }} /></i>
        </Link>
        <Link className="account-overview-card" href="/account/orders">
          <span>Orders</span>
          <strong>{orderCount}</strong>
          <small>Track orders and view receipts</small>
        </Link>
        <Link className="account-overview-card" href="/account/reviews">
          <span>Reviews</span>
          <strong>{reviewCount}</strong>
          <small>Manage your feedback</small>
        </Link>
      </section>

      <section className="account-dashboard-layout account-saas-dashboard-layout">
        <form id="profile" className="account-card account-profile-form account-saas-profile-card" onSubmit={submit}>
          <div className="account-section-heading">
            <div>
              <p className="standalone-eyebrow">Profile</p>
              <h2>Personal details</h2>
              <p className="account-saas-section-copy">Keep these details current so checkout and Square Loyalty stay synced.</p>
            </div>
            {saved && <span>Saved</span>}
          </div>

          <div className="account-form-grid">
            <label>
              Full name
              <input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required />
            </label>
            <label>
              Email address
              <input type="email" value={email} readOnly={backendMode === "supabase"} onChange={(event) => setEmail(event.target.value)} required />
              {backendMode === "supabase" && <small>Managed by secure account authentication.</small>}
            </label>
            <label>
              Mobile number
              <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0491 570 006" required />
              {backendMode === "supabase" && !profile.phone && <small>Required to activate Square POS Loyalty.</small>}
            </label>
            <label>
              Birthday <small>Optional</small>
              <input type="date" value={birthday} onChange={(event) => setBirthday(event.target.value)} />
            </label>
          </div>

          {error && <p className="account-form-error" role="alert">{error}</p>}

          <div className="account-saas-form-actions">
            <button className="standalone-primary-button" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
            {backendMode === "supabase" && profile.phone && (
              <span className="account-saas-sync-status"><i aria-hidden="true" /> Square Loyalty connected</span>
            )}
          </div>
        </form>

        <aside className="account-card account-quick-links account-saas-quick-card">
          <p className="standalone-eyebrow">Quick actions</p>
          <h2>Shortcuts</h2>
          <Link href="/menu/burgers"><span>Order again</span><strong>→</strong></Link>
          <Link href="/account/orders"><span>Order history</span><strong>→</strong></Link>
          <Link href="/account/drip-points"><span>Drip Points activity</span><strong>→</strong></Link>
          <Link href="/account/reviews"><span>Leave a review</span><strong>→</strong></Link>
        </aside>
      </section>

      {backendMode === "supabase" && !profile.phone && phoneModalOpen && (
        <div className="account-loyalty-modal-backdrop" role="presentation">
          <section className="account-loyalty-modal" role="dialog" aria-modal="true" aria-labelledby="account-loyalty-modal-title">
            <button className="account-loyalty-modal-close" type="button" aria-label="Close" onClick={() => setPhoneModalOpen(false)}>×</button>
            <div className="account-loyalty-modal-coin">
              <Image src="/images/drip-points/drip-coin.png" alt="" width={88} height={88} />
            </div>
            <span className="account-loyalty-modal-kicker">Square POS Loyalty</span>
            <h2 id="account-loyalty-modal-title">Activate your 500 Drip Points</h2>
            <p>Add your Australian mobile number to link this website account with Nasty Burger House Square POS. Your 500 signup points will be added to the same loyalty profile you use in store.</p>
            <div className="account-loyalty-modal-benefit">
              <strong>500</strong><span>signup Drip Points</span><small>Synced to Square Loyalty</small>
            </div>
            <form onSubmit={submitPhoneModal}>
              <label>
                Australian mobile number
                <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0491 570 006" autoComplete="tel" autoFocus required />
              </label>
              {modalError && <p className="account-form-error" role="alert">{modalError}</p>}
              <button type="submit" disabled={saving}>{saving ? "Connecting to Square…" : "Activate 500 points"}</button>
              <button className="account-loyalty-modal-later" type="button" onClick={() => setPhoneModalOpen(false)}>I’ll do this later</button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
