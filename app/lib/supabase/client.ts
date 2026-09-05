import { createBrowserClient } from "@supabase/ssr";

export function isSupabaseBrowserConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase browser credentials are not configured.");
  }

  return createBrowserClient(url, publishableKey);
}

export function getBrowserClientOrNull() {
  return isSupabaseBrowserConfigured() ? createClient() : null;
}
