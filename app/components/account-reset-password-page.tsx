"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  getBrowserClientOrNull,
  isSupabaseBrowserConfigured,
} from "../lib/supabase/client";
import ButtonWithIcon from "@/components/ui/button-witn-icon";

export default function AccountResetPasswordPage() {
  const router = useRouter();
  const configured = isSupabaseBrowserConfigured();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 10) {
      setError("Use a password with at least 10 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    const supabase = getBrowserClientOrNull();
    if (!supabase) {
      setError("Password update is temporarily unavailable.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError("We could not update your password. Please request a new reset link.");
        return;
      }
      router.push("/account?password=updated");
      router.refresh();
    } catch {
      setError("We could not update your password. Please request a new reset link.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="standalone-page account-page account-auth-flow-page">
      <main className="standalone-main account-auth-main">
        <section className="account-auth-card account-auth-card--compact">
          <div className="account-auth-card__intro">
            <p className="standalone-eyebrow">Account security</p>
            <h1>Choose a new password.</h1>
            <p>Use at least 10 characters and keep it unique to your Nasty account.</p>
            <Link href="/" className="account-auth-home-link">
              ← Back to Home
            </Link>
          </div>
          <form className="account-auth-form" onSubmit={submit}>
            <label>
              New password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={10}
                maxLength={256}
                required
              />
            </label>
            <label>
              Confirm new password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={10}
                maxLength={256}
                required
              />
            </label>
            {!configured && (
              <p className="account-auth-note">
                Password recovery is temporarily unavailable.
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
              {submitting ? "Updating…" : "Update password"}
            </ButtonWithIcon>
            <Link className="standalone-secondary-link" href="/account/sign-in">
              Back to sign in
            </Link>
          </form>
        </section>
      </main>
    </div>
  );
}
