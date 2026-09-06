import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export function validateSquareWebhookSignature(
  rawBody: string,
  signature: string | null,
) {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY?.trim() || "";
  const notificationUrl =
    process.env.SQUARE_WEBHOOK_NOTIFICATION_URL?.trim() || "";

  if (!signatureKey || !notificationUrl || !signature) return false;

  const expected = createHmac("sha256", signatureKey)
    .update(`${notificationUrl}${rawBody}`, "utf8")
    .digest("base64");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(signature, "utf8");
  if (expectedBuffer.length !== actualBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
