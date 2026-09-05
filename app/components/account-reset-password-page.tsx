"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  getBrowserClientOrNull,
  isSupabaseBrowserConfigured,
} from "../lib/supabase/client";
import MobileBottomNav from "./mobile-bottom-nav";

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

    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    const supabase = getBrowserClientOrNull();
    if (!supabase) {
      setError("Supabase is not configured yet.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      router.push("/account?password=updated");
      router.refresh();
    } catch {
      setError("We could not update your password. Open the reset link again and retry.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="standalone-page account-page">
      <main className="standalone-main account-auth-main">
        <section className="account-auth-card account-auth-card--compact">
          <div className="account-auth-card__intro">
            <p className="standalone-eyebrow">Account security</p>
            <h1>Choose a new password.</h1>
            <p>Use at least 8 characters and keep it unique to your Nasty account.</p>
          </div>
          <form className="account-auth-form" onSubmit={submit}>
            <label>
              New password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required />
            </label>
            <label>
              Confirm new password
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required />
            </label>
            {!configured && <p className="account-auth-note">Supabase setup is required for password recovery.</p>}
            {error && <p className="account-form-error" role="alert">{error}</p>}
            <button className="standalone-primary-button" type="submit" disabled={submitting || !configured}>
              {submitting ? "Updating…" : "Update password"}
            </button>
            <Link className="standalone-secondary-link" href="/account/sign-in">Back to sign in</Link>
          </form>
        </section>
      </main>
      <MobileBottomNav active="more" />
    </div>
  );
}
