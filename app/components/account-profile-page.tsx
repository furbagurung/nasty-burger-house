"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, MessageSquareText, Pencil, Phone, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { getBrowserClientOrNull } from "../lib/supabase/client";
import { googleProfilePhoto } from "../lib/google-profile-photo";
import AccountDashboardSkeleton from "./account-dashboard-skeleton";
import AccountChangePassword from "./account-change-password";
import ButtonWithIcon from "@/components/ui/button-witn-icon";

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
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>();
  const [profileOpen, setProfileOpen] = useState(false);

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

  useEffect(() => {
    const supabase = getBrowserClientOrNull();
    if (!supabase) return;
    let active = true;

    async function loadProfilePhoto() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (active) setProfilePhoto(error ? undefined : googleProfilePhoto(user));
      } catch {
        if (active) setProfilePhoto(undefined);
      }
    }

    void loadProfilePhoto();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function expandLinkedProfile() {
      if (window.location.hash === "#profile") setProfileOpen(true);
    }
    expandLinkedProfile();
    window.addEventListener("hashchange", expandLinkedProfile);
    return () => window.removeEventListener("hashchange", expandLinkedProfile);
  }, []);

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
      });
      if (!updated) throw new Error("Could not update your account.");

      setProfile(updated);
      setPhone(normalizedPhone);
      setProfileOpen(false);
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
          <ButtonWithIcon href="/account/create" tone="red">Create account</ButtonWithIcon>
          <Link className="standalone-secondary-link" href="/account/sign-in">Sign in</Link>
        </div>
      </section>
    );
  }

  const fullName = profile.name.trim() || profile.email;
  const initials = fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  const mobileNumber = profile.phone.trim();

  return (
    <>
      <header className="account-dashboard-heading account-saas-heading account-saas-heading--overview account-profile-identity">
        <Avatar size="lg" className="account-profile-identity__avatar">
          {profilePhoto && (
            <AvatarImage src={profilePhoto} alt="" referrerPolicy="no-referrer" />
          )}
          <AvatarFallback className="account-profile-identity__avatar-fallback">
            {initials || "NB"}
          </AvatarFallback>
        </Avatar>
        <div className="account-profile-identity__details">
          <h1>{fullName}</h1>
          <p className="account-profile-identity__phone">
            <Phone size={15} strokeWidth={1.9} aria-hidden="true" />
            {mobileNumber ? (
              <span>{mobileNumber}</span>
            ) : (
              <a href="#profile">Add mobile number</a>
            )}
          </p>
        </div>
      </header>

      <section className="account-overview-grid account-saas-stats" aria-label="Account overview">
        <Link className="account-overview-card account-overview-card--drip" href="/account/drip-points">
          <Image src="/images/drip-points/drip-coin.png" alt="" width={72} height={72} />
          <span>Available Drip Points</span>
          <strong>{loyaltyReady ? balance.toLocaleString() : "…"}</strong>
          <small>{loyaltyReady ? `${progress}% toward ${DRIP_REWARD_TARGET.toLocaleString()} Drip Points` : "Syncing Square Loyalty…"}</small>
          <i aria-hidden="true"><b style={{ width: `${loyaltyReady ? progress : 0}%` }} /></i>
        </Link>
      </section>

      <section
        className="account-dashboard-layout account-saas-dashboard-layout"
        style={{ gridTemplateColumns: "minmax(0, 1fr)" }}
      >
      <section id="profile" className="account-card account-security-card account-manage-card" aria-labelledby="account-profile-title">
        <div className="account-security__header">
          <span className="account-security__icon" aria-hidden="true">
            <Pencil size={22} strokeWidth={1.8} />
          </span>
          <div className="account-security__intro">
            <h2 id="account-profile-title">Edit profile</h2>
            <p>Update your personal and contact details.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="account-security__toggle"
            aria-expanded={profileOpen}
            aria-controls="account-profile-form"
            disabled={saving}
            onClick={() => {
              if (profileOpen) {
                setName(profile.name);
                setEmail(profile.email);
                setPhone(profile.phone);
                setError("");
                setProfileOpen(false);
              } else {
                setProfileOpen(true);
              }
            }}
          >
            {profileOpen ? "Cancel" : "Edit"}
          </Button>
        </div>
        {saved && <p className="account-security__success" role="status">Profile updated successfully.</p>}
        {profileOpen && (
          <form id="account-profile-form" className="account-profile-form account-saas-profile-card account-manage-card__form" onSubmit={submit}>
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
          </div>

          {error && <p className="account-form-error" role="alert">{error}</p>}

          <div className="account-saas-form-actions">
            <ButtonWithIcon tone="red" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </ButtonWithIcon>
          </div>
          </form>
        )}
      </section>

      <section className="account-card account-security-card account-manage-card" aria-labelledby="account-orders-title">
        <div className="account-security__header">
          <span className="account-security__icon" aria-hidden="true">
            <ReceiptText size={22} strokeWidth={1.8} />
          </span>
          <div className="account-security__intro">
            <h2 id="account-orders-title">Order history</h2>
            <p>{orderCount} order{orderCount === 1 ? "" : "s"} · Track orders and view receipts.</p>
          </div>
          <Link className="account-security__toggle account-manage-card__link" href="/account/orders">
            View <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="account-card account-security-card account-manage-card" aria-labelledby="account-reviews-title">
        <div className="account-security__header">
          <span className="account-security__icon" aria-hidden="true">
            <MessageSquareText size={22} strokeWidth={1.8} />
          </span>
          <div className="account-security__intro">
            <h2 id="account-reviews-title">Reviews</h2>
            <p>{reviewCount} review{reviewCount === 1 ? "" : "s"} · View and manage your feedback.</p>
          </div>
          <Link className="account-security__toggle account-manage-card__link" href="/account/reviews">
            View <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <AccountChangePassword />

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
