"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { readSignedInCustomerProfile } from "../lib/customer-store";
import { getBrowserClientOrNull } from "../lib/supabase/client";

type CustomerIdentity = {
  name: string;
  email: string;
};

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
      void refreshCustomer();
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
      className="mobile-account-avatar"
      href={customer ? "/account" : "/account/sign-in"}
      aria-label={customer ? "Open my account" : "Sign in to your account"}
    >
      <Avatar size="lg" className="mobile-account-avatar__avatar">
        <AvatarFallback className="mobile-account-avatar__fallback">
          {initial || <UserRound size={21} strokeWidth={1.85} aria-hidden="true" />}
        </AvatarFallback>
      </Avatar>
    </Link>
  );
}
