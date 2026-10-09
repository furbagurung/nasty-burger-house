"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { readSignedInCustomerProfile } from "../lib/customer-store";
import { getBrowserClientOrNull } from "../lib/supabase/client";

type CustomerIdentity = {
  name: string;
  email: string;
  imageUrl?: string;
};

// Google places the profile picture in its identity metadata. Supabase may
// also copy it into user_metadata, so check both without requesting extra
// Google permissions or storing the photo on our servers.
function googleProfilePhoto(user: User): string | undefined {
  const googleIdentity = user.identities?.find((identity) => identity.provider === "google");
  const googleData = googleIdentity?.identity_data;

  const candidateUrls = [
    googleData?.avatar_url,
    googleData?.picture,
    user.user_metadata?.avatar_url,
    user.user_metadata?.picture,
  ];

  return candidateUrls.find(
    (value): value is string =>
      typeof value === "string" && /^https:\/\//i.test(value),
  );
}

// Customer avatar for the homepage's compact mobile header.
// Full site navigation remains available from the mobile bottom "More" tab.
export default function MobileAccountAvatar() {
  const [customer, setCustomer] = useState<CustomerIdentity | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = getBrowserClientOrNull();

    async function refreshCustomer() {
      const localProfile = readSignedInCustomerProfile();

      if (!supabase) {
        if (active) {
          setCustomer(localProfile ? { name: localProfile.name, email: localProfile.email } : null);
        }
        return;
      }

      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!active) return;
        if (error || !user) {
          setCustomer(null);
          return;
        }

        const metadataName = user.user_metadata?.name;
        setCustomer({
          imageUrl: googleProfilePhoto(user),
          name: typeof metadataName === "string" && metadataName.trim()
            ? metadataName.trim()
            : localProfile?.name ?? "",
          email: user.email ?? "",
        });
      } catch {
        if (active) setCustomer(null);
      }
    }

    void refreshCustomer();
    const { data: authListener } = supabase?.auth.onAuthStateChange(() => {
      // Call getUser outside the auth callback to avoid Supabase's auth lock.
      queueMicrotask(() => {
        if (active) void refreshCustomer();
      });
    }) ?? { data: { subscription: null } };

    window.addEventListener("storage", refreshCustomer);
    window.addEventListener("focus", refreshCustomer);
    window.addEventListener("nasty-customer-updated", refreshCustomer);

    return () => {
      active = false;
      authListener.subscription?.unsubscribe();
      window.removeEventListener("storage", refreshCustomer);
      window.removeEventListener("focus", refreshCustomer);
      window.removeEventListener("nasty-customer-updated", refreshCustomer);
    };
  }, []);

  const initial = (customer?.name.trim() || customer?.email.trim() || "")
    .charAt(0)
    .toUpperCase();

  return (
    <Link
      className={`mobile-account-avatar${customer ? " is-signed-in" : ""}`}
      href={customer ? "/account" : "/account/sign-in"}
      aria-label={customer ? "Open my account" : "Sign in to your account"}
    >
      <Avatar size="lg" className="mobile-account-avatar__avatar">
        {customer?.imageUrl && (
          <AvatarImage src={customer.imageUrl} alt="" referrerPolicy="no-referrer" />
        )}
        <AvatarFallback className="mobile-account-avatar__fallback">
          {initial || <UserRound size={21} strokeWidth={1.85} aria-hidden="true" />}
        </AvatarFallback>
      </Avatar>
    </Link>
  );
}
