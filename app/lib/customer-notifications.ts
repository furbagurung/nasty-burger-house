import "server-only";

import type { PaidOrderNotification } from "./square/paid-order-notifications";
import { renderCustomerPaidOrderEmail } from "./email/paid-order-template";
import { wasResendEmailAlreadyAccepted } from "./email/resend-idempotency";

type CustomerEmailResult =
  | { ok: true }
  | { ok: false; reason: "missing-email" | "not-configured" | "delivery-failed" };

export async function sendCustomerPaidOrderEmail(payload: PaidOrderNotification): Promise<CustomerEmailResult> {
  const email = payload.customer.email.trim();
  // Square checkout lets buyers edit their email; use its final, verified
  // fulfillment recipient, not an untrusted webhook field.
  if (!email || email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, reason: "missing-email" };
  }
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.ORDER_NOTIFICATION_FROM?.trim();
  if (!apiKey || !from) {
    return { ok: false, reason: "not-configured" };
  }
  const { html, text } = renderCustomerPaidOrderEmail(payload);
  const supportEmail = process.env.SQUARE_MERCHANT_SUPPORT_EMAIL?.trim();
  const replyTo = supportEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)
    ? supportEmail
    : undefined;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Separate from restaurant alerts; stable across Square retry events.
        "Idempotency-Key": `nasty-customer-paid-${payload.squareOrderId}`,
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `Order confirmed & paid · ${payload.orderId}`,
        html,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      if (wasResendEmailAlreadyAccepted(response.status, errorBody)) {
        console.info("[NBH customer email previously accepted]", {
          squareOrderId: payload.squareOrderId,
        });
        return { ok: true };
      }
      // Never log customer email or the message body.
      console.error("[NBH customer confirmation failed]", response.status, errorBody);
      return { ok: false, reason: "delivery-failed" };
    }
    return { ok: true };
  } catch (error) {
    console.error("[NBH customer confirmation failed]", error);
    return { ok: false, reason: "delivery-failed" };
  }
}
