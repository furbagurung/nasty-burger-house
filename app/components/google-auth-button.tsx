"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { getBrowserClientOrNull } from "../lib/supabase/client";

type GoogleAuthButtonProps = {
  label?: string;
  onError?: (message: string) => void;
};

const OAUTH_RETURN_COOKIE = "nbh_oauth_return";

function safeReturnPath() {
  const requested =
    new URLSearchParams(window.location.search).get("return") ?? "/account";
  return requested.startsWith("/") && !requested.startsWith("//")
    ? requested
    : "/account";
}

export default function GoogleAuthButton({
  label = "Continue with Google",
  onError,
}: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);

  async function continueWithGoogle() {
    const supabase = getBrowserClientOrNull();
    if (!supabase) {
      onError?.("Google sign in is unavailable right now.");
      return;
    }

    setLoading(true);
    onError?.("");

    try {
      const siteUrl = (
        process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
      ).replace(/\/$/, "");
      const next = safeReturnPath();

      document.cookie = `${OAUTH_RETURN_COOKIE}=${encodeURIComponent(next)}; Path=/; Max-Age=600; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;

      const redirectTo = `${siteUrl}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) {
        console.warn("[NBH Google auth]", { code: error.code });
        onError?.("We could not open Google sign in. Please try again.");
        setLoading(false);
      }
    } catch {
      onError?.("We could not open Google sign in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <button
      className="account-google-button"
      type="button"
      onClick={() => void continueWithGoogle()}
      disabled={loading}
    >
      <span className="account-google-icon" aria-hidden="true">
        <FcGoogle size={20} focusable="false" />
      </span>
      <span>{loading ? "Opening Google…" : label}</span>
    </button>
  );
}
