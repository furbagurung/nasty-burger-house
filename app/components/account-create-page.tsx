"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  ensureSignupBonus,
  readCustomerProfile,
  saveCustomerProfile,
} from "../lib/customer-store";
import { isSupabaseBrowserConfigured } from "../lib/supabase/client";
import GoogleAuthButton from "./google-auth-button";
import PasswordInput from "./password-input";
import ButtonWithIcon from "@/components/ui/button-witn-icon";

export default function AccountCreatePage() {
  const router = useRouter();
  const productionAuth = isSupabaseBrowserConfigured();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  useEffect(() => {
    if (productionAuth) return;

    const existing = readCustomerProfile();
    if (!existing) return;

    const timer = window.setTimeout(() => {
      setName(existing.name);
      setEmail(existing.email);
      setPhone(existing.phone);
    }, 0);

    return () => window.clearTimeout(timer);
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

    const normalizedPhone = phone.trim().replace(/[()\s-]/g, "");
    if (!/^(?:\+61|0)4\d{8}$/.test(normalizedPhone)) {
      setError("Enter a valid Australian mobile number, e.g. 0491 570 006.");
      return;
    }
    if (productionAuth && password.length < 10) {
      setError("Use a password with at least 10 characters.");
      return;
    }
    if (productionAuth && password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    const destination =
      new URLSearchParams(window.location.search).get("return") ?? "/account";
    const safeDestination =
      destination.startsWith("/") && !destination.startsWith("//")
        ? destination
        : "/account";

    if (!productionAuth) {
      saveCustomerProfile({ name, email, phone: normalizedPhone });
      ensureSignupBonus();
      router.push(safeDestination);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/account/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: normalizedPhone,
          password,
          next: safeDestination,
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        signedIn?: boolean;
        confirmationRequired?: boolean;
        error?: string;
      };

      if (!response.ok || !result.ok) {
        setError(
          result.error ||
            "We could not create your account. Please check your details and try again.",
        );
        return;
      }

      if (result.signedIn) {
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
    <div className="standalone-page account-page account-auth-flow-page">
      <main className="standalone-main account-auth-main">
        <section className="account-auth-card">
          <div className="account-auth-card__intro">
            <h1>Create your account.</h1>
            <p>
              Save your details, see order history, leave reviews and earn Drip
              Points whenever you order.
            </p>
            <div className="account-auth-benefits">            <Link href="/" className="account-auth-home-link">
              ← Back to Home
            </Link>

              <span>
                <strong>500</strong> points for new loyalty members
              </span>
              <span>Order history</span>
              <span>Faster checkout</span>
            </div>
          </div>

          {confirmationSent ? (
            <div className="account-auth-form account-auth-success">
              <p className="standalone-eyebrow">Check your inbox</p>
              <h2>Confirm your email.</h2>
              <p>
                If the details can be registered, a confirmation link will be sent to{" "}
                <strong>{email}</strong>.
              </p>
              <ButtonWithIcon href="/account/sign-in" tone="red">
                Go to sign in
              </ButtonWithIcon>
            </div>
          ) : (
            <form className="account-auth-form" onSubmit={submit}>
              {productionAuth && (
                <>
                  <GoogleAuthButton
                    label="Sign up with Google"
                    onError={setError}
                  />
                  <div className="account-auth-divider" aria-hidden="true">
                    <span>or create with email</span>
                  </div>
                </>
              )}

              <label>
                Full name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  minLength={2}
                  maxLength={80}
                  required
                />
              </label>
              <label>
                Email address
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  maxLength={160}
                  required
                />
              </label>
              <label>
                Mobile number
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                  minLength={8}
                  maxLength={24}
                  placeholder="04XX XXX XXX"
                  required
                />
              </label>
              {productionAuth && (
                <>
                  <PasswordInput
                    label="Password"
                    value={password}
                    onChange={setPassword}
                    autoComplete="new-password"
                    minLength={10}
                  />
                  <PasswordInput
                    label="Confirm password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    autoComplete="new-password"
                    minLength={10}
                  />
                </>
              )}
              {error && (
                <p className="account-form-error" role="alert">
                  {error}
                </p>
              )}
              <ButtonWithIcon tone="red" type="submit" disabled={submitting}>
                {submitting
                  ? "Creating account…"
                  : "Create account"}
              </ButtonWithIcon>
              <p className="account-auth-switch">
                Already have an account?{" "}
                <Link href="/account/sign-in">Sign in</Link>
              </p>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
