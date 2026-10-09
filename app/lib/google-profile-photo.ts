import type { User } from "@supabase/supabase-js";

// Supabase provides Google avatars in identity_data and sometimes user_metadata.
// Use the available HTTPS URL directly; no additional OAuth scopes or API calls.
export function googleProfilePhoto(user: User | null | undefined): string | undefined {
  if (!user) return undefined;

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
