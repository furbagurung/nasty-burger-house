"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { MdArrowForward, MdEmail, MdLock, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

/**
 * Nasty Burger House adaptation of the Watermelon UI Auth5 split screen.
 * The installed registry demo is presentation-only; this component accepts
 * the existing working authentication callbacks instead of fake login actions.
 */
export interface Auth5Props {
  heading?: string;
  subheading?: string;
  identifierLabel?: string;
  identifierPlaceholder?: string;
  identifierType?: "text" | "email";
  submitLabel?: string;
  signUpHref?: string;
  forgotPasswordHref?: string;
  homeHref?: string;
  socialContent?: ReactNode;
  showPasswordField?: boolean;
  submitting?: boolean;
  error?: string;
  onSubmit: (identifier: string, password: string) => void | Promise<void>;
  imageSrc?: string;
  imageAlt?: string;
  panelHeading?: string;
  panelSubtext?: string;
}

export function Auth5({
  heading = "Welcome back.",
  subheading = "Sign in to check your orders and collect Drip Points.",
  identifierLabel = "Email or mobile number",
  identifierPlaceholder = "you@example.com or 04XX XXX XXX",
  identifierType = "text",
  submitLabel = "Sign in",
  signUpHref = "/account/create",
  forgotPasswordHref = "/account/forgot-password",
  homeHref = "/",
  socialContent,
  showPasswordField = true,
  submitting = false,
  error = "",
  onSubmit,
  imageSrc = "/images/bbq-beast-hero.webp",
  imageAlt = "Nasty Burger House burger",
  panelHeading = "Good food. Great rewards.",
  panelSubtext = "Your next Nasty Burger House order is only a few taps away.",
}: Auth5Props) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    void onSubmit(identifier.trim(), password);
  }

  return (
    <div className="nbh-auth5 dark">
      <section className="nbh-auth5__form-panel" aria-label="Customer account sign in">
        <div className="nbh-auth5__form-content">
          <div className="nbh-auth5__intro">
            <h1>{heading}</h1>
            <p>{subheading}</p>
          </div>

          {socialContent && (
            <>
              <div className="nbh-auth5__social">{socialContent}</div>
              <div className="nbh-auth5__divider">
                <Separator className="flex-1" />
                <span>or continue with {showPasswordField ? "email or mobile" : "email"}</span>
                <Separator className="flex-1" />
              </div>
            </>
          )}

          <form className="nbh-auth5__form" onSubmit={handleSubmit} aria-busy={submitting}>
            <div className="nbh-auth5__field">
              <label htmlFor="nbh-auth5-identifier">{identifierLabel}</label>
              <div className="nbh-auth5__input-wrap">
                <MdEmail aria-hidden="true" className="nbh-auth5__input-icon" />
                <Input
                  id="nbh-auth5-identifier"
                  name="identifier"
                  type={identifierType}
                  autoComplete="username"
                  placeholder={identifierPlaceholder}
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  disabled={submitting}
                  maxLength={180}
                  required
                />
              </div>
            </div>

            {showPasswordField && (
              <div className="nbh-auth5__field">
                <div className="nbh-auth5__field-heading">
                  <label htmlFor="nbh-auth5-password">Password</label>
                  <Link href={forgotPasswordHref}>Forgot password?</Link>
                </div>
                <div className="nbh-auth5__input-wrap">
                  <MdLock aria-hidden="true" className="nbh-auth5__input-icon" />
                  <Input
                    id="nbh-auth5-password"
                    name="password"
                    type={passwordVisible ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={submitting}
                    maxLength={256}
                    required
                    className="nbh-auth5__password-input"
                  />
                  <button
                    type="button"
                    className="nbh-auth5__password-toggle"
                    onClick={() => setPasswordVisible((current) => !current)}
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                    aria-pressed={passwordVisible}
                  >
                    {passwordVisible ? (
                      <MdVisibilityOff aria-hidden="true" />
                    ) : (
                      <MdVisibility aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="nbh-auth5__error" role="alert">{error}</p>}

            <Button type="submit" disabled={submitting} className="nbh-auth5__submit">
              <span>{submitting ? "Signing in…" : submitLabel}</span>
              <MdArrowForward aria-hidden="true" />
            </Button>
          </form>

          <p className="nbh-auth5__signup">
            Don&apos;t have an account? <Link href={signUpHref}>Create one for free</Link>
          </p>
          <Link href={homeHref} className="nbh-auth5__home-link">← Back to Home</Link>
        </div>
      </section>

      <aside className="nbh-auth5__visual-panel" aria-label="Nasty Burger House">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(min-width: 900px) 52vw, 100vw"
          className="nbh-auth5__hero-image"
        />
        <div className="nbh-auth5__hero-shade" aria-hidden="true" />
        <div className="nbh-auth5__hero-content">
          <h2>{panelHeading}</h2>
          <p>{panelSubtext}</p>
        </div>
      </aside>
    </div>
  );
}
