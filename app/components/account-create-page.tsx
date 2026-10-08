"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ensureSignupBonus,
  readCustomerProfile,
  saveCustomerProfile,
} from "../lib/customer-store";
import { isSupabaseBrowserConfigured } from "../lib/supabase/client";
import GoogleAuthButton from "./google-auth-button";

const signupContainerMotion: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
};

const signupItemMotion: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function AccountCreatePage() {
  const router = useRouter();
  const productionAuth = isSupabaseBrowserConfigured();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const reducedMotion = useReducedMotion();

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
    if (!agreedToTerms) {
      setError("Please agree to the Terms and Privacy Policy.");
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
        <div className="nbh-auth10">
          <aside className="nbh-auth10__visual" aria-label="Welcome to Nasty Burger House">
            <Image
              src="/images/Warmly lit food trailer at night-2.png"
              alt="Nasty Burger House food truck serving burgers at night"
              fill
              sizes="(min-width: 901px) 48vw, 100vw"
              className="nbh-auth10__visual-image"
              priority
            />
            <div className="nbh-auth10__visual-overlay" aria-hidden="true" />
            <div className="nbh-auth10__visual-brand">
              <Image src="/logo.webp" alt="" width={48} height={48} />
              <span>Nasty Burger House</span>
            </div>
            <div className="nbh-auth10__visual-copy">
              <p>THE GOOD STUFF STARTS HERE</p>
              <h2>BIG BURGERS.
                <span>BETTER REWARDS.</span>
              </h2>
              <p>Join the crew. Order your favourites and earn Drip Points.</p>
            </div>
          </aside>

          <section className="nbh-auth10__form-side" aria-label="Sign up for Nasty Burger House">
            <motion.div
              className="nbh-auth10__form-content"
              variants={signupContainerMotion}
              initial={reducedMotion ? "visible" : "hidden"}
              animate="visible"
            >
              <motion.header className="nbh-auth10__heading" variants={signupItemMotion}>
                <p>JOIN NASTY BURGER HOUSE</p>
                <h1>{confirmationSent ? "Check your inbox." : "Get started now."}</h1>
                <span>
                  {confirmationSent
                    ? "One more step to get your account ready."
                    : "Create an account to track your orders and collect Drip Points."}
                </span>
              </motion.header>

              {confirmationSent ? (
                <motion.div className="nbh-auth10__confirmation" variants={signupItemMotion} role="status">
                  <h2>Confirm your email</h2>
                  <p>
                    If your details can be registered, we&apos;ll send a confirmation
                    link to <strong>{email}</strong>.
                  </p>
                  <Link href="/account/sign-in" className="nbh-auth10__confirmation-link">
                    Go to sign in
                  </Link>
                </motion.div>
              ) : (
                <>
                  <form className="nbh-auth10__form" onSubmit={submit} aria-busy={submitting}>
                    <motion.div className="nbh-auth10__field" variants={signupItemMotion}>
                      <label htmlFor="nbh-signup-name">Full name</label>
                      <Input
                        id="nbh-signup-name"
                        type="text"
                        autoComplete="name"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        minLength={2}
                        maxLength={80}
                        disabled={submitting}
                        required
                      />
                    </motion.div>

                    <motion.div className="nbh-auth10__field" variants={signupItemMotion}>
                      <label htmlFor="nbh-signup-email">Email address</label>
                      <Input
                        id="nbh-signup-email"
                        type="email"
                        autoComplete="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        maxLength={160}
                        disabled={submitting}
                        required
                      />
                    </motion.div>

                    <motion.div className="nbh-auth10__field" variants={signupItemMotion}>
                      <label htmlFor="nbh-signup-phone">Mobile number</label>
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
                    </motion.div>

                    {productionAuth && (
                      <>
                        <motion.div className="nbh-auth10__field" variants={signupItemMotion}>
                          <label htmlFor="nbh-signup-password">Password</label>
                          <div className="nbh-auth10__password-wrap">
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
                            />
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => setShowPassword((visible) => !visible)}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                              aria-pressed={showPassword}
                            >
                              {showPassword ? <MdVisibilityOff aria-hidden="true" /> : <MdVisibility aria-hidden="true" />}
                            </button>
                          </div>
                        </motion.div>


                      </>
                    )}

                    <motion.div className="nbh-auth10__terms" variants={signupItemMotion}>
                      <input
                        id="nbh-signup-terms"
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(event) => setAgreedToTerms(event.target.checked)}
                        disabled={submitting}
                        required
                      />
                      <label htmlFor="nbh-signup-terms">
                        I agree to the <Link href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">Terms and Conditions</Link> and{" "}
                        <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.
                      </label>
                    </motion.div>

                    {error && <p className="nbh-auth10__error" role="alert">{error}</p>}

                    <motion.div variants={signupItemMotion}>
                      <Button className="nbh-auth10__submit" type="submit" disabled={submitting}>
                        {submitting ? "Creating account…" : "Create account"}
                      </Button>
                    </motion.div>
                  </form>

                  {productionAuth && (
                    <>
                      <motion.div className="nbh-auth10__divider" variants={signupItemMotion}>
                        <span>or</span>
                      </motion.div>
                      <motion.div className="nbh-auth10__social" variants={signupItemMotion}>
                        <GoogleAuthButton label="Continue with Google" onError={setError} />
                      </motion.div>
                      <p className="nbh-auth10__social-note">
                        By continuing with Google, you acknowledge our{" "}
                        <Link href="/terms-and-conditions">Terms</Link> and{" "}
                        <Link href="/privacy-policy">Privacy Policy</Link>.
                      </p>
                    </>
                  )}

                  <motion.p className="nbh-auth10__signin" variants={signupItemMotion}>
                    Already have an account? <Link href="/account/sign-in">Sign in</Link>
                  </motion.p>
                </>
              )}

              <motion.div className="nbh-auth10__home" variants={signupItemMotion}>
                <Link href="/">← Back to Home</Link>
              </motion.div>
            </motion.div>
          </section>
        </div>
      </main>
    </div>
  );
}
