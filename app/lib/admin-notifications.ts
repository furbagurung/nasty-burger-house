import "server-only";

import type { PaidOrderNotification } from "./square/paid-order-notifications";
import { renderPaidOrderEmail } from "./email/paid-order-template";

type OrderNotificationPayload = PaidOrderNotification;

type EmailNotificationResult =
  | { ok: true }
  | { ok: false; reason: "not-configured" | "delivery-failed" };

function notificationRecipients(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "AUD",
  }).format(value);
}

export function getAdminNotificationConfig() {
  return {
    emailConfigured: Boolean(
      process.env.RESEND_API_KEY?.trim() &&
        process.env.ORDER_NOTIFICATION_EMAIL?.trim() &&
        process.env.ORDER_NOTIFICATION_FROM?.trim(),
    ),
    webhookConfigured: Boolean(process.env.ORDER_WEBHOOK_URL?.trim()),
  };
}

export async function sendAdminPaidOrderEmail(
  payload: OrderNotificationPayload,
): Promise<EmailNotificationResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = notificationRecipients(process.env.ORDER_NOTIFICATION_EMAIL);
  const from = process.env.ORDER_NOTIFICATION_FROM?.trim();

  if (!apiKey || to.length === 0 || !from) {
    return { ok: false, reason: "not-configured" };
  }

  const { html, text } = renderPaidOrderEmail(payload);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `nasty-paid-square-${payload.squareOrderId}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject: `Paid Nasty order ${payload.orderId} · ${money(payload.total)}`,
        html,
        text,
        ...(payload.customer.email ? { reply_to: payload.customer.email } : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error("[NBH admin email failed]", response.status, await response.text());
      return { ok: false, reason: "delivery-failed" };
    }

    return { ok: true };
  } catch (error) {
    console.error("[NBH admin email failed]", error);
    return { ok: false, reason: "delivery-failed" };
  }
}
