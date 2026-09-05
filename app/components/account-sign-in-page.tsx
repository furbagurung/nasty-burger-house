"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signInCustomerByEmail } from "../lib/customer-store";
import {
  getBrowserClientOrNull,
  isSupabaseBrowserConfigured,
} from "../lib/supabase/client";
import MobileBottomNav from "./mobile-bottom-nav";

export default function AccountSignInPage() {
  const router = useRouter();
  const productionAuth = isSupabaseBrowserConfigured();
  const [email, setEmail] = useState("");
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
      const profile = signInCustomerByEmail(email);
      if (!profile) {
        setError("No saved local account with that email exists on this device yet.");
        return;
      }
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
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        setError(authError.message);
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
              Email address
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            </label>
            {productionAuth && (
              <label>
                Password
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
              </label>
            )}
            {error && <p className="account-form-error" role="alert">{error}</p>}
            <button className="standalone-primary-button" type="submit" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
            {productionAuth && (
              <Link className="standalone-secondary-link" href="/account/forgot-password">
                Forgot password?
              </Link>
            )}
            <p className="account-auth-note">
              {productionAuth
                ? "Secure Supabase Auth is active for this build."
                : "Local preview mode is active until Supabase environment variables are configured."}
            </p>
            <p className="account-auth-switch">New here? <Link href="/account/create">Create an account</Link></p>
          </form>
        </section>
      </main>
      <MobileBottomNav active="more" />
    </div>
  );
}
