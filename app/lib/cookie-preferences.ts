export const COOKIE_STORAGE_KEY = "nasty-burger-cookie-preferences";

export type CookiePreferences = {
  analytics: boolean;
  marketing: boolean;
};

export const DEFAULT_COOKIE_PREFERENCES: CookiePreferences = {
  analytics: false,
  marketing: false,
};

export function parseCookiePreferences(raw: string | null): CookiePreferences | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !value ||
      typeof value !== "object" ||
      !("analytics" in value) ||
      !("marketing" in value) ||
      typeof value.analytics !== "boolean" ||
      typeof value.marketing !== "boolean"
    ) return null;
    return { analytics: value.analytics, marketing: value.marketing };
  } catch {
    return null;
  }
}

export function filterConsentEvent<T>(
  preferences: CookiePreferences | null,
  event: T,
): T | null {
  return preferences?.analytics === true ? event : null;
}
