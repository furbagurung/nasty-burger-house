/**
 * Resend keeps successful idempotent email requests for 24 hours.
 * This specific conflict means the same key was previously accepted with a
 * different payload (for example, after Square updated the payment record).
 * Sending with a new key would notify the kitchen twice for one paid order.
 */
export function wasResendEmailAlreadyAccepted(status: number, responseBody: string): boolean {
  if (status !== 409) return false;

  try {
    const error = JSON.parse(responseBody) as { name?: unknown } | null;
    return error?.name === "invalid_idempotent_request";
  } catch {
    return false;
  }
}
