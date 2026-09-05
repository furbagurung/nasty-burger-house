"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getBrowserClientOrNull } from "../lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const supabase = getBrowserClientOrNull();
    if (!supabase) {
      setError("The admin backend is not configured on this build.");
      return;
    }

    setSubmitting(true);
    try {
      // Clear any customer-only session first so staff can switch accounts cleanly.
      await supabase.auth.signOut();

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        setError("Email or password is incorrect.");
        return;
      }

      const access = await fetch("/api/admin/session", { cache: "no-store" });
      if (!access.ok) {
        await supabase.auth.signOut();
        setError(
          access.status === 403
            ? "This account does not have Nasty Burger House admin access."
            : "We could not verify admin access. Please try again.",
        );
        return;
      }

      const destination =
        new URLSearchParams(window.location.search).get("return") ?? "/admin";
      const safeDestination = destination.startsWith("/admin")
        ? destination
        : "/admin";

      router.replace(safeDestination);
      router.refresh();
    } catch {
      setError("We could not sign you in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-access-page admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-brand">
          <Image src="/logo.webp" alt="Nasty Burger House" width={150} height={150} priority />
          <div>
            <p>Nasty Burger House</p>
            <h1>Order Control</h1>
            <span>Staff sign in</span>
          </div>
        </div>

        <form className="admin-login-form" onSubmit={submit}>
          <label>
            Admin email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
              autoFocus
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <p className="admin-login-error" role="alert">{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Checking access…" : "Sign in to Order Control"}
          </button>

          <div className="admin-login-links">
            <Link href="/account/forgot-password">Forgot password?</Link>
            <Link href="/">Back to website</Link>
          </div>
        </form>

        <p className="admin-login-note">
          Customer accounts cannot access Order Control unless they have been added to the admin list.
        </p>
      </section>
    </main>
  );
}
