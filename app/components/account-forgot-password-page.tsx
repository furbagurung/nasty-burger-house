"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  getBrowserClientOrNull,
  isSupabaseBrowserConfigured,
} from "../lib/supabase/client";
import MobileBottomNav from "./mobile-bottom-nav";

export default function AccountForgotPasswordPage() {
  const configured = isSupabaseBrowserConfigured();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const supabase = getBrowserClientOrNull();
    if (!supabase) {
      setError("Password recovery becomes available when Supabase is configured.");
      return;
    }

    setSubmitting(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/account/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo },
      );
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setSent(true);
    } catch {
      setError("We could not send the reset email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="standalone-page account-page">
      <main className="standalone-main account-auth-main">
        <section className="account-auth-card account-auth-card--compact">
          <div className="account-auth-card__intro">
            <p className="standalone-eyebrow">Account recovery</p>
            <h1>Reset your password.</h1>
            <p>We&apos;ll email you a secure link to choose a new password.</p>
          </div>

          {sent ? (
            <div className="account-auth-form account-auth-success">
              <h2>Check your inbox.</h2>
              <p>If an account exists for {email}, a password reset link is on the way.</p>
              <Link className="standalone-primary-button" href="/account/sign-in">Back to sign in</Link>
            </div>
          ) : (
            <form className="account-auth-form" onSubmit={submit}>
              <label>
                Email address
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
              </label>
              {!configured && <p className="account-auth-note">Supabase setup is required for secure password recovery.</p>}
              {error && <p className="account-form-error" role="alert">{error}</p>}
              <button className="standalone-primary-button" type="submit" disabled={submitting || !configured}>
                {submitting ? "Sending…" : "Send reset link"}
              </button>
              <Link className="standalone-secondary-link" href="/account/sign-in">← Back to sign in</Link>
            </form>
          )}
        </section>
      </main>
      <MobileBottomNav active="more" />
    </div>
  );
}
