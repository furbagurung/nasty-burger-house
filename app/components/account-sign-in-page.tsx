"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signInCustomerByEmail } from "../lib/customer-store";
import { isSupabaseBrowserConfigured } from "../lib/supabase/client";
import MobileBottomNav from "./mobile-bottom-nav";
import PasswordInput from "./password-input";

export default function AccountSignInPage() {
  const router = useRouter();
  const productionAuth = isSupabaseBrowserConfigured();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const destination =
      new URLSearchParams(window.location.search).get("return") ?? "/account";
    const safeDestination = destination.startsWith("/") ? destination : "/account";

    if (!productionAuth) {
      const profile = signInCustomerByEmail(identifier);
      if (!profile) {
        setError("No saved local account with that email exists on this device yet.");
        return;
      }
      router.push(safeDestination);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/account/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        setError(result.error || "We could not sign you in. Please try again.");
        return;
      }

      router.push(safeDestination);
      router.refresh();
    } catch {
      setError("We could not sign you in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="standalone-page account-page">
      <main className="standalone-main account-auth-main">
        <section className="account-auth-card account-auth-card--compact">
          <div className="account-auth-card__intro">
            <p className="standalone-eyebrow">Welcome back</p>
            <h1>Sign in.</h1>
            <p>Open your Nasty account, Drip Points and order history.</p>
          </div>
          <form className="account-auth-form" onSubmit={submit}>
            <label>
              {productionAuth ? "Email address or mobile number" : "Email address"}
              <input
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                autoComplete="username"
                inputMode="email"
                placeholder={productionAuth ? "Email or 04XX XXX XXX" : undefined}
                required
              />
            </label>
            {productionAuth && (
              <PasswordInput
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
              />
            )}
            {error && (
              <p className="account-form-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="standalone-primary-button"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
            {productionAuth && (
              <Link className="standalone-secondary-link" href="/account/forgot-password">
                Forgot password?
              </Link>
            )}
            <p className="account-auth-switch">
              New here? <Link href="/account/create">Create an account</Link>
            </p>
          </form>
        </section>
      </main>
      <MobileBottomNav active="more" />
    </div>
  );
}
