/** Keep the same Square idempotency key after network errors and page refreshes. */
const KEY = 'nasty-square-checkout-attempt-v1';
const VALID_FOR_MS = 30 * 60 * 1000;

export type CheckoutAttempt = { signature: string; requestId: string; createdAt: number };

export function getCheckoutRequestId(signature: string, inMemory?: CheckoutAttempt | null): CheckoutAttempt {
  const now = Date.now();
  if (inMemory?.signature === signature && now - inMemory.createdAt < VALID_FOR_MS && now >= inMemory.createdAt) return inMemory;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as CheckoutAttempt;
      if (saved.signature === signature &&
          typeof saved.requestId === 'string' &&
          /^[a-f0-9-]{36}$/i.test(saved.requestId) &&
          Number.isFinite(saved.createdAt) &&
          saved.createdAt <= now &&
          now - saved.createdAt < VALID_FOR_MS) return saved;
    }
  } catch {
    // Storage access may be disabled; the caller still has an in-memory guard.
  }
  const current = { signature, requestId: crypto.randomUUID(), createdAt: now };
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Checkout should not fail just because storage is disabled.
  }
  return current;
}

export function clearCheckoutRequestId(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Browser storage is optional.
  }
}
