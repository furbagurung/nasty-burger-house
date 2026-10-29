import "server-only";

import { createClient } from "../supabase/server";
import { squareRequest } from "./api";
import { normalizeAustralianPhone } from "./customers";
import { findSquareLoyaltyAccountByCustomerId } from "./loyalty";

type SquareCustomer = {
  id?: string;
  email_address?: string;
  phone_number?: string;
};
type MembershipResult =
  | { ok: false; reason: string; authenticated: boolean; needsPhoneVerification?: boolean }
  | { ok: true; accountId: string; squareCustomerId: string; balance: number; verifiedPhone: string; verifiedEmail: string };

export async function verifiedSquareRewardMember(
  checkoutContact?: { email: string; phone: string },
): Promise<MembershipResult> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || !user.email) {
    return { ok: false, authenticated: false, reason: "Sign in to redeem Drip Points." };
  }
  const email = user.email.trim().toLowerCase();
  if (!user.email_confirmed_at) {
    return { ok: false, authenticated: true, reason: "Confirm your email before redeeming." };
  }
  const phone = normalizeAustralianPhone(user.phone ?? "");
  if (!user.phone_confirmed_at || !/^\+614\d{8}$/.test(phone)) {
    return {
      ok: false, authenticated: true, needsPhoneVerification: true,
      reason: "Verify your Australian mobile number by SMS before redeeming.",
    };
  }
  if (checkoutContact && (
    checkoutContact.email.trim().toLowerCase() !== email ||
    normalizeAustralianPhone(checkoutContact.phone) !== phone
  )) {
    return {
      ok: false, authenticated: true,
      reason: "Use the verified email and mobile number from your account to redeem.",
    };
  }
  // This is deliberately READ-ONLY. The ordinary guest checkout customer
  // creation path can update a Square customer from an unverified phone.
  // That flow must never authorize a reward or transfer someone else's points.
  const result = await squareRequest<{ customers?: SquareCustomer[] }>("/v2/customers/search", {
    method: "POST",
    body: JSON.stringify({
      limit: 20,
      query: { filter: { email_address: { exact: email } } },
    }),
  });
  const customer = (result.customers ?? []).find(
    (entry) => entry.id &&
      entry.email_address?.trim().toLowerCase() === email &&
      normalizeAustralianPhone(entry.phone_number ?? "") === phone,
  );
  if (!customer?.id) {
    return {
      ok: false, authenticated: true,
      reason: "Your verified contact details do not match a Square Loyalty member. Ask staff to link your membership.",
    };
  }
  const account = await findSquareLoyaltyAccountByCustomerId(customer.id);
  if (!account?.id ||
      normalizeAustralianPhone(account.mapping?.phone_number ?? "") !== phone) {
    return {
      ok: false, authenticated: true,
      reason: "No Square Loyalty account is linked to your verified mobile number.",
    };
  }
  return {
    ok: true,
    accountId: account.id,
    squareCustomerId: customer.id,
    balance: account.balance ?? 0,
    verifiedPhone: phone,
    verifiedEmail: email,
  };
}
