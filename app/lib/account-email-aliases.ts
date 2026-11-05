import "server-only";
import { getAdminClientOrNull } from "./supabase/admin";

export function normalizeAccountEmail(value: string) {
  const email = value.trim().toLowerCase();
  return email.length <= 160 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

/**
 * Resolve only verified additional email aliases. Never expose this lookup to
 * unauthenticated clients: sign-in still requires the account's actual password.
 */
export async function primaryEmailForVerifiedAlias(email: string): Promise<string | null> {
  const normalized = normalizeAccountEmail(email);
  const admin = getAdminClientOrNull();
  if (!normalized || !admin) return null;

  const { data, error } = await admin.from("customer_email_aliases")
    .select("user_id").eq("email", normalized).not("verified_at", "is", null)
    .maybeSingle();
  if (error || !data?.user_id) return null;

  const { data: owner, error: ownerError } = await admin.auth.admin.getUserById(data.user_id);
  if (ownerError || !owner.user?.email || !owner.user.email_confirmed_at) return null;
  return normalizeAccountEmail(owner.user.email) || null;
}

export async function emailBelongsToAuthenticatedAccount(
  userId: string, primaryEmail: string, candidateEmail: string,
) {
  const candidate = normalizeAccountEmail(candidateEmail);
  if (!candidate) return false;
  if (candidate === normalizeAccountEmail(primaryEmail)) return true;
  const admin = getAdminClientOrNull();
  if (!admin) return false;
  const { data, error } = await admin.from("customer_email_aliases")
    .select("email").eq("email", candidate).eq("user_id", userId)
    .not("verified_at", "is", null).maybeSingle();
  return !error && Boolean(data);
}
