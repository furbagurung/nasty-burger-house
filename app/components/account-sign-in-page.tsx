"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Auth5 } from "@/components/ui/nasty-auth-05";
import { signInCustomerByEmail } from "../lib/customer-store";
import { isSupabaseBrowserConfigured } from "../lib/supabase/client";
import GoogleAuthButton from "./google-auth-button";

export default function AccountSignInPage() {
  const router = useRouter();
  const productionAuth = isSupabaseBrowserConfigured();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(identifier: string, password: string) {
    if (submitting) return;
    setError("");

    const destination =
      new URLSearchParams(window.location.search).get("return") ?? "/account";
    const safeDestination =
      destination.startsWith("/") && !destination.startsWith("//")
        ? destination
        : "/account";

    if (!productionAuth) {
      const profile = signInCustomerByEmail(identifier);
      if (!profile) {
        setError(
          "No saved local account with that email exists on this device yet.",
        );
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
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

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
    <div className="standalone-page account-page nbh-auth-page">
      <main className="standalone-main nbh-auth-main">
        <Auth5
          heading="Welcome back."
          subheading="Sign in to view orders and Drip Points."
          identifierLabel={
            productionAuth ? "Email or mobile number" : "Email address"
          }
          identifierPlaceholder={
            productionAuth
              ? "you@example.com or 04XX XXX XXX"
              : "you@example.com"
          }
          identifierType={productionAuth ? "text" : "email"}
          showPasswordField={productionAuth}
          submitLabel="Sign in"
          socialContent={
            productionAuth ? <GoogleAuthButton onError={setError} /> : undefined
          }
          signUpHref="/account/create"
          forgotPasswordHref="/account/forgot-password"
          homeHref="/"
          imageSrc="/images/Warmly lit food trailer at night-2.png"
          imageAlt="Warmly lit Nasty Burger House food trailer at night"
          panelHeading="BIG BURGERS. BIG REWARDS."
          panelSubtext="Order your favourites. Earn Drip Points."
          onSubmit={submit}
          error={error}
          submitting={submitting}
        />
      </main>
    </div>
  );
}
