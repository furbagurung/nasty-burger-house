"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Auth1 } from "@/components/ui/auth-01";
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
        <Auth1
          badgeText="Nasty customer account"
          heading="Welcome back."
          subheading="Sign in to check your orders, collect Drip Points and keep the good stuff coming."
          emailLabel={productionAuth ? "Email or mobile number" : "Email address"}
          emailPlaceholder={productionAuth ? "you@example.com or 04XX XXX XXX" : "you@example.com"}
          identifierType={productionAuth ? "text" : "email"}
          passwordLabel="Password"
          passwordPlaceholder="Your password"
          showPasswordField={productionAuth}
          submitLabel="Sign in"
          dividerText="or sign in with"
          socialContent={
            productionAuth ? <GoogleAuthButton onError={setError} /> : undefined
          }
          forgotPasswordText="Forgot password?"
          onForgotPassword={() => router.push("/account/forgot-password")}
          homeHref="/"
          bottomPromptText="New to Nasty?"
          bottomPromptLinkText="Create an account"
          onBottomPromptClick={() => router.push("/account/create")}
          onSubmit={submit}
          error={error}
          submitting={submitting}
        />
      </main>
    </div>
  );
}
