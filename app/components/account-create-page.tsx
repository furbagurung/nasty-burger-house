"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  ensureSignupBonus,
  readCustomerProfile,
  saveCustomerProfile,
} from "../lib/customer-store";
import MobileBottomNav from "./mobile-bottom-nav";

export default function AccountCreatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const existing = readCustomerProfile();
    if (!existing) return;
    setName(existing.name);
    setEmail(existing.email);
    setPhone(existing.phone);
    setBirthday(existing.birthday ?? "");
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (name.trim().length < 2) {
      setError("Enter your name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (!/^[+()\d\s-]{8,24}$/.test(phone.trim())) {
      setError("Enter a valid mobile number.");
      return;
    }

    saveCustomerProfile({ name, email, phone, birthday });
    ensureSignupBonus();
    const destination = new URLSearchParams(window.location.search).get("return");
    router.push(destination?.startsWith("/") ? destination : "/account");
  }

  return (
    <div className="standalone-page account-page">
      <main className="standalone-main account-auth-main">
        <section className="account-auth-card">
          <div className="account-auth-card__intro">
            <p className="standalone-eyebrow">Nasty account</p>
            <h1>Create your account.</h1>
            <p>
              Save your details, see order history, leave reviews and earn Drip
              Points whenever you order.
            </p>
            <div className="account-auth-benefits">
              <span><strong>500</strong> signup Drip Points</span>
              <span>Order history</span>
              <span>Faster checkout</span>
            </div>
          </div>

          <form className="account-auth-form" onSubmit={submit}>
            <label>
              Full name
              <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" minLength={2} maxLength={80} required />
            </label>
            <label>
              Email address
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={160} required />
            </label>
            <label>
              Mobile number
              <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" minLength={8} maxLength={24} required />
            </label>
            <label>
              Birthday <small>Optional</small>
              <input type="date" value={birthday} onChange={(event) => setBirthday(event.target.value)} />
            </label>
            {error && <p className="account-form-error" role="alert">{error}</p>}
            <button className="standalone-primary-button" type="submit">Create account + get 500 points</button>
            <p className="account-auth-note">
              Development account mode: no password is stored in the browser.
              Secure cross-device authentication will be connected to the production backend next.
            </p>
            <p className="account-auth-switch">Already created an account on this device? <Link href="/account/sign-in">Sign in</Link></p>
          </form>
        </section>
      </main>
      <MobileBottomNav active="more" />
    </div>
  );
}
