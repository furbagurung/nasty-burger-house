"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { isSupabaseBrowserConfigured } from "../lib/supabase/client";
import ButtonWithIcon from "@/components/ui/button-witn-icon";

export default function AccountForgotPasswordPage() {
  const configured = isSupabaseBrowserConfigured();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/account/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        setError("We could not process the request right now. Please try again.");
        return;
      }

      setSent(true);
    } catch {
      setError("We could not process the request right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="standalone-page account-page account-auth-flow-page">
      <main className="standalone-main account-auth-main">
        <section className="account-auth-card account-auth-card--compact">
          <div className="account-auth-card__intro">
            <p className="standalone-eyebrow">Account recovery</p>
            <h1>Reset your password.</h1>
            <p>We&apos;ll email you a secure link to choose a new password.</p>
            <Link href="/" className="account-auth-home-link">
              ← Back to Home
            </Link>
          </div>

          {sent ? (
            <div className="account-auth-form account-auth-success">
              <h2>Check your inbox.</h2>
              <p>
                If an account exists for {email}, a password reset link is on the
                way.
              </p>
              <ButtonWithIcon href="/account/sign-in" tone="red">
                Back to sign in
              </ButtonWithIcon>
            </div>
          ) : (
            <form className="account-auth-form" onSubmit={submit}>
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
              {!configured && (
                <p className="account-auth-note">
                  Account recovery is temporarily unavailable.
                </p>
              )}
              {error && (
                <p className="account-form-error" role="alert">
                  {error}
                </p>
              )}
              <ButtonWithIcon
                tone="red"
                type="submit"
                disabled={submitting || !configured}
              >
                {submitting ? "Sending…" : "Send reset link"}
              </ButtonWithIcon>
              <Link className="standalone-secondary-link" href="/account/sign-in">
                ← Back to sign in
              </Link>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
