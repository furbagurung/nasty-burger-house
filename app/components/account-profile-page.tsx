"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, MessageSquareText, Pencil, Phone, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
          // Optional non-modal offer; a dismissal lasts for this browser session.
          let dismissed = false;
          try {
            dismissed = window.sessionStorage.getItem("nbh-loyalty-link-dismissed:" + current.email.toLowerCase()) === "1";
          } catch {
            // Session storage may be unavailable in an embedded browser.
          }
          setPhoneModalOpen(backendMode === "supabase" && !current.phone && !dismissed);
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
              <a href="#profile" onClick={() => setProfileOpen(true)}>Add mobile number</a>
            )}
          </p>
        </div>
      </header>

      <Link
        className="account-profile-mobile-card"
        href="/account/drip-points"
        aria-label={"View Drip Points: " + (loyaltyReady ? balance.toLocaleString() + " available points" : "loading")}
      >
        <div className="account-profile-mobile-card__member">
          <Avatar size="lg" className="account-profile-mobile-card__avatar">
            {profilePhoto && (
              <AvatarImage src={profilePhoto} alt="" referrerPolicy="no-referrer" />
            )}
            <AvatarFallback>{initials || "NB"}</AvatarFallback>
          </Avatar>
          <div className="account-profile-mobile-card__identity">
            <strong>{fullName}</strong>
            <span>{mobileNumber || "Mobile number not linked"}</span>
          </div>
          <Image
            className="account-profile-mobile-card__coin"
            src="/images/drip-points/drip-coin.png"
            alt=""
            width={60}
            height={60}
          />
        </div>
        <div className="account-profile-mobile-card__points">
          <div className="account-profile-mobile-card__points-top">
            <span>Available Drip Points</span>
            <strong>{loyaltyReady ? balance.toLocaleString() : "…"}</strong>
          </div>
          <div
            className="account-profile-mobile-card__track"
            role="progressbar"
            aria-label="Progress toward the 2,000-point goal"
            aria-valuemin={0}
            aria-valuemax={DRIP_REWARD_TARGET}
            aria-valuenow={loyaltyReady ? Math.min(DRIP_REWARD_TARGET, Math.max(0, balance)) : 0}
            aria-valuetext={loyaltyReady ? balance.toLocaleString() + " points" : "Loading"}
          >
            <span style={{ width: (loyaltyReady ? progress : 0) + "%" }} />
          </div>
          <small>{loyaltyReady
            ? balance >= DRIP_REWARD_TARGET
              ? "2,000-point goal reached"
              : (DRIP_REWARD_TARGET - balance).toLocaleString() + " points to your goal"
            : "Loading your points…"}</small>
        </div>
        <div className="account-profile-mobile-card__footer">
          <span>View Drip Points</span>
          <ChevronRight size={18} aria-hidden="true" />
        </div>
      </Link>

      <section className="account-overview-grid account-saas-stats" aria-label="Account overview">
        <Link className="account-overview-card account-overview-card--drip" href="/account/drip-points">
          <Image src="/images/drip-points/drip-coin.png" alt="" width={72} height={72} />
          <span>Available Drip Points</span>
          <strong>{loyaltyReady ? balance.toLocaleString() : "…"}</strong>
          <small>{loyaltyReady ? `${progress}% toward ${DRIP_REWARD_TARGET.toLocaleString()} Drip Points` : "Syncing Square Loyalty…"}</small>
          <i aria-hidden="true"><b style={{ width: `${loyaltyReady ? progress : 0}%` }} /></i>
        </Link>
      </section>

      {backendMode === "supabase" && !profile.phone && phoneModalOpen && (
        <Card className="account-loyalty-inline" aria-labelledby="account-loyalty-inline-title">
          <CardContent className="account-loyalty-inline__content">
            <div className="account-loyalty-inline__top">
              <span className="account-loyalty-inline__kicker">Square Loyalty</span>
              <span className="account-loyalty-inline__optional">Optional for now</span>
            </div>
            <div className="account-loyalty-inline__hero">
              <div className="account-loyalty-inline__copy">
                <h2 id="account-loyalty-inline-title">Claim your 500 Drip Points</h2>
                <p>Link your mobile for the same rewards in-store.</p>
              </div>
              <Image
                className="account-loyalty-inline__burger"
                src="/images/signature-beast.webp"
                alt=""
                width={155}
                height={155}
                sizes="(max-width: 480px) 100px, 155px"
              />
            </div>
            <div className="account-loyalty-inline__benefit">
              <Image src="/images/drip-points/drip-coin.png" alt="" width={64} height={64} />
              <div>
                <strong>500</strong>
                <span>Welcome points for new members</span>
              </div>
            </div>
            <form className="account-loyalty-inline__form" onSubmit={submitPhoneModal}>
              <Label htmlFor="account-loyalty-phone">Australian mobile number</Label>
              <Input
                id="account-loyalty-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="0491 570 006"
                required
                disabled={saving}
              />
              {modalError && <p className="account-form-error" role="alert">{modalError}</p>}
              <div className="account-loyalty-inline__actions">
                <Button type="submit" disabled={saving}>
                  {saving ? "Linking…" : "Link number"}
                  <ChevronRight size={17} aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setPhoneModalOpen(false);
                    setModalError("");
                    try {
                      window.sessionStorage.setItem("nbh-loyalty-link-dismissed:" + profile.email.toLowerCase(), "1");
                    } catch {
                      // Dismissal still works without session storage.
                    }
                  }}
                >
                  Maybe later
                </Button>
              </div>
            </form>
            <p className="account-loyalty-inline__note">
              New Square members only. Existing members keep their points. No SMS needed.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="account-settings-list" role="group" aria-label="Account settings">
      <div className="account-profile-mobile-section-label" aria-hidden="true">Account &amp; security</div>
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
            aria-label={profileOpen ? "Cancel editing profile" : "Edit profile"}
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
            <span className="account-security__toggle-text">{profileOpen ? "Cancel" : "Edit"}</span>
            <ChevronRight className="account-security__mobile-chevron" size={20} aria-hidden="true" />
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
                {backendMode === "supabase" && !profile.phone && <small>Optional — link your number to use the same Square Loyalty profile in store.</small>}
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

      <div className="account-profile-mobile-section-label" aria-hidden="true">Your activity</div>
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
            <span className="account-security__toggle-text">View</span> <ChevronRight size={18} aria-hidden="true" />
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

      <div className="account-profile-mobile-section-label" aria-hidden="true">Security</div>
      <AccountChangePassword />
      </div>


    </>
  );
}
