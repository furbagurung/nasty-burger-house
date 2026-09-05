"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  ensureSignupBonus,
  readCustomerProfile,
  saveCustomerProfile,
} from "../lib/customer-store";
import {
  getBrowserClientOrNull,
  isSupabaseBrowserConfigured,
} from "../lib/supabase/client";
import MobileBottomNav from "./mobile-bottom-nav";

export default function AccountCreatePage() {
  const router = useRouter();
  const productionAuth = isSupabaseBrowserConfigured();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  useEffect(() => {
    if (productionAuth) return;
    const existing = readCustomerProfile();
    if (!existing) return;
    setName(existing.name);
    setEmail(existing.email);
    setPhone(existing.phone);
    setBirthday(existing.birthday ?? "");
  }, [productionAuth]);

  async function submit(event: FormEvent<HTMLFormElement>) {
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
    if (productionAuth && password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (productionAuth && password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    const destination =
      new URLSearchParams(window.location.search).get("return") ?? "/account";
    const safeDestination = destination.startsWith("/") ? destination : "/account";

    if (!productionAuth) {
      saveCustomerProfile({ name, email, phone, birthday });
      ensureSignupBonus();
      router.push(safeDestination);
      return;
    }

    const supabase = getBrowserClientOrNull();
    if (!supabase) {
      setError("Supabase is not configured yet.");
      return;
    }

    setSubmitting(true);
    try {
      const siteUrl = (
        process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
      ).replace(/\/$/, "");
      const emailRedirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(
        safeDestination,
      )}`;

      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo,
          data: {
            name: name.trim(),
            phone: phone.trim(),
            birthday: birthday || null,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.session) {
        router.push(safeDestination);
        router.refresh();
      } else {
        setConfirmationSent(true);
      }
    } catch {
      setError("We could not create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
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

          {confirmationSent ? (
            <div className="account-auth-form account-auth-success">
              <p className="standalone-eyebrow">Check your inbox</p>
              <h2>Confirm your email.</h2>
              <p>
                We sent a confirmation link to <strong>{email}</strong>. Open it
                to activate your account and the 500-point welcome bonus.
              </p>
              <Link className="standalone-primary-button" href="/account/sign-in">
                Go to sign in
              </Link>
            </div>
          ) : (
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
              {productionAuth && (
                <>
                  <label>
                    Password
                    <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required />
                  </label>
                  <label>
                    Confirm password
                    <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required />
                  </label>
                </>
              )}
              {error && <p className="account-form-error" role="alert">{error}</p>}
              <button className="standalone-primary-button" type="submit" disabled={submitting}>
                {submitting ? "Creating account…" : "Create account + get 500 points"}
              </button>
              <p className="account-auth-note">
                {productionAuth
                  ? "Your password is handled by Supabase Auth and is never stored in the Nasty Burger House customer tables."
                  : "Local preview mode is active until Supabase environment variables are configured."}
              </p>
              <p className="account-auth-switch">Already have an account? <Link href="/account/sign-in">Sign in</Link></p>
            </form>
          )}
        </section>
      </main>
      <MobileBottomNav active="more" />
    </div>
  );
}
