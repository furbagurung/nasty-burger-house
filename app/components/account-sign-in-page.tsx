"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Auth5 } from "@/components/ui/nasty-auth-05";
import { MdLocalOffer, MdReceiptLong } from "react-icons/md";
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
        setError("No saved local account with that email exists on this device yet.");
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
      const result = (await response.json()) as { ok?: boolean; error?: string };

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
          brandName="Nasty Burger House"
          heading="Welcome back."
          subheading="Sign in to check your orders, collect Drip Points and keep the good stuff coming."
          identifierLabel={productionAuth ? "Email or mobile number" : "Email address"}
          identifierPlaceholder={productionAuth ? "you@example.com or 04XX XXX XXX" : "you@example.com"}
          identifierType={productionAuth ? "text" : "email"}
          showPasswordField={productionAuth}
          submitLabel="Sign in"
          socialContent={productionAuth ? <GoogleAuthButton onError={setError} /> : undefined}
          signUpHref="/account/create"
          forgotPasswordHref="/account/forgot-password"
          homeHref="/"
          imageSrc="/images/bbq-beast-hero.webp"
          imageAlt="BBQ Beast burger from Nasty Burger House"
          panelHeading="BIG BURGERS. BETTER REWARDS."
          panelSubtext="Your next favourite bite is waiting. Sign in and make every order count."
          features={[
            {
              icon: <MdLocalOffer size={20} />,
              title: "Drip Points",
              description: "Keep track of your rewards.",
            },
            {
              icon: <MdReceiptLong size={20} />,
              title: "Order history",
              description: "Find your past orders.",
            },
          ]}
          onSubmit={submit}
          error={error}
          submitting={submitting}
        />
      </main>
    </div>
  );
}
