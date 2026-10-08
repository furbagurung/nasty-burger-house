"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  MdArrowForward,
  MdEmail,
  MdLock,
  MdPerson,
  MdPhone,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ensureSignupBonus,
  readCustomerProfile,
  saveCustomerProfile,
} from "../lib/customer-store";
import { isSupabaseBrowserConfigured } from "../lib/supabase/client";
import GoogleAuthButton from "./google-auth-button";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    <div className="standalone-page account-page nbh-auth-page nbh-signup-page">
      <main className="standalone-main nbh-auth-main">
        <div className="nbh-auth5 nbh-auth5--signup dark">
          <section className="nbh-auth5__form-panel" aria-label="Create a Nasty Burger House account">
            <div className="nbh-auth5__form-content">
              <div className="nbh-auth5__intro">
                <h1>Create your account.</h1>
                <p>Join Nasty Burger House to save your details, track orders and collect Drip Points.</p>
              </div>

              {confirmationSent ? (
                <div className="nbh-auth5__success" role="status">
                  <h2>Confirm your email.</h2>
                  <p>
                    If your details can be registered, we&apos;ll send a confirmation
                    link to <strong>{email}</strong>.
                  </p>
                  <Button asChild className="nbh-auth5__submit">
                    <Link href="/account/sign-in">
                      Go to sign in <MdArrowForward aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <>
                  {productionAuth && (
                    <>
                      <div className="nbh-auth5__social">
                        <GoogleAuthButton label="Sign up with Google" onError={setError} />
                      </div>
                      <div className="nbh-auth5__divider">
                        <Separator className="flex-1" />
                        <span>or continue with email</span>
                        <Separator className="flex-1" />
                      </div>
                    </>
                  )}

                  <form className="nbh-auth5__form" onSubmit={submit} aria-busy={submitting}>
                    <div className="nbh-auth5__field">
                      <label htmlFor="nbh-signup-name">Full name</label>
                      <div className="nbh-auth5__input-wrap">
                        <MdPerson className="nbh-auth5__input-icon" aria-hidden="true" />
                        <Input
                          id="nbh-signup-name"
                          type="text"
                          autoComplete="name"
                          placeholder="Your full name"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          minLength={2}
                          maxLength={80}
                          disabled={submitting}
                          required
                        />
                      </div>
                    </div>

                    <div className="nbh-auth5__field">
                      <label htmlFor="nbh-signup-email">Email address</label>
                      <div className="nbh-auth5__input-wrap">
                        <MdEmail className="nbh-auth5__input-icon" aria-hidden="true" />
                        <Input
                          id="nbh-signup-email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          maxLength={160}
                          disabled={submitting}
                          required
                        />
                      </div>
                    </div>

                    <div className="nbh-auth5__field">
                      <label htmlFor="nbh-signup-phone">Mobile number</label>
                      <div className="nbh-auth5__input-wrap">
                        <MdPhone className="nbh-auth5__input-icon" aria-hidden="true" />
                        <Input
                          id="nbh-signup-phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="04XX XXX XXX"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          minLength={8}
                          maxLength={24}
                          disabled={submitting}
                          required
                        />
                      </div>
                    </div>

                    {productionAuth && (
                      <>
                        <div className="nbh-auth5__field">
                          <label htmlFor="nbh-signup-password">Password</label>
                          <div className="nbh-auth5__input-wrap">
                            <MdLock className="nbh-auth5__input-icon" aria-hidden="true" />
                            <Input
                              id="nbh-signup-password"
                              type={showPassword ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="At least 10 characters"
                              value={password}
                              onChange={(event) => setPassword(event.target.value)}
                              minLength={10}
                              maxLength={256}
                              disabled={submitting}
                              required
                              className="nbh-auth5__password-input"
                            />
                            <button
                              type="button"
                              className="nbh-auth5__password-toggle"
                              onClick={() => setShowPassword((current) => !current)}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                              aria-pressed={showPassword}
                            >
                              {showPassword ? <MdVisibilityOff aria-hidden="true" /> : <MdVisibility aria-hidden="true" />}
                            </button>
                          </div>
                        </div>

                        <div className="nbh-auth5__field">
                          <label htmlFor="nbh-signup-confirm">Confirm password</label>
                          <div className="nbh-auth5__input-wrap">
                            <MdLock className="nbh-auth5__input-icon" aria-hidden="true" />
                            <Input
                              id="nbh-signup-confirm"
                              type={showConfirmPassword ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="Re-enter your password"
                              value={confirmPassword}
                              onChange={(event) => setConfirmPassword(event.target.value)}
                              minLength={10}
                              maxLength={256}
                              disabled={submitting}
                              required
                              className="nbh-auth5__password-input"
                            />
                            <button
                              type="button"
                              className="nbh-auth5__password-toggle"
                              onClick={() => setShowConfirmPassword((current) => !current)}
                              aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
                              aria-pressed={showConfirmPassword}
                            >
                              {showConfirmPassword ? <MdVisibilityOff aria-hidden="true" /> : <MdVisibility aria-hidden="true" />}
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {error && <p className="nbh-auth5__error" role="alert">{error}</p>}

                    <Button className="nbh-auth5__submit" type="submit" disabled={submitting}>
                      <span>{submitting ? "Creating account…" : "Create account"}</span>
                      <MdArrowForward aria-hidden="true" />
                    </Button>
                  </form>

                  <p className="nbh-auth5__signup">
                    Already have an account? <Link href="/account/sign-in">Sign in</Link>
                  </p>
                </>
              )}
              <Link href="/" className="nbh-auth5__home-link">← Back to Home</Link>
            </div>
          </section>

          <aside className="nbh-auth5__visual-panel" aria-label="Nasty Burger House">
            <Image
              src="/images/Warmly lit food trailer at night-2.png"
              alt="Warmly lit Nasty Burger House food trailer at night"
              fill
              sizes="(min-width: 900px) 52vw, 100vw"
              className="nbh-auth5__hero-image"
            />
            <div className="nbh-auth5__hero-shade" aria-hidden="true" />
            <div className="nbh-auth5__hero-content">
              <h2>{"BIG BURGERS.\nBIG REWARDS."}</h2>
              <p>Order your favourites. Earn Drip Points.</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
