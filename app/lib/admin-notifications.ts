import "server-only";

import type { PaidOrderNotification } from "./square/paid-order-notifications";

type OrderNotificationPayload = PaidOrderNotification;

type EmailNotificationResult =
  | { ok: true }
  | { ok: false; reason: "not-configured" | "delivery-failed" };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

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

function lineDetails(line: OrderNotificationPayload["lines"][number]) {
  return line.details;
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const adminUrl = siteUrl ? `${siteUrl}/admin` : "";
  const rows = payload.lines
    .map((line) => {
      const details = lineDetails(line)
        .map((detail) => `<div style="color:#6f6a63;font-size:13px;margin-top:4px">${escapeHtml(detail)}</div>`)
        .join("");
      return `<tr>
        <td style="padding:14px 0;border-bottom:1px solid #ece9e4;vertical-align:top">
          <strong>${line.quantity}× ${escapeHtml(line.name)}</strong>${details}
        </td>
        <td style="padding:14px 0;border-bottom:1px solid #ece9e4;text-align:right;vertical-align:top;font-weight:700">${money(line.lineTotal)}</td>
      </tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f4f2ee;font-family:Arial,sans-serif;color:#171513">
    <div style="max-width:680px;margin:0 auto;padding:32px 18px">
      <div style="background:#11100f;color:#fff;border-radius:20px 20px 0 0;padding:24px 28px">
        <div style="color:#ff5938;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">Nasty Burger House</div>
        <h1 style="margin:8px 0 0;font-size:34px;line-height:1">Paid pickup order</h1>
      </div>
      <div style="background:#fff;border-radius:0 0 20px 20px;padding:28px">
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start">
          <div>
            <div style="font-size:13px;color:#77716a">Order</div>
            <div style="font-size:24px;font-weight:900">${escapeHtml(payload.orderId)}</div>
          </div>
          <div style="font-size:24px;font-weight:900">${money(payload.total)}</div>
        </div>
        <p style="margin:18px 0 6px"><strong>${escapeHtml(payload.customer.name)}</strong></p>
        <p style="margin:0;color:#66615b;font-size:14px">${escapeHtml(payload.customer.phone)} · ${escapeHtml(payload.customer.email)}</p>
        <p style="margin:6px 0 20px;color:#66615b;font-size:14px">${escapeHtml(payload.locationName)} · ASAP pickup</p>
        <p style="font-weight:700;color:#21694b;margin:0 0 16px">Payment confirmed by Square</p>
        <table role="presentation" style="width:100%;border-collapse:collapse">${rows}</table>
        ${payload.notes ? `<div style="margin-top:20px;padding:14px 16px;border-radius:12px;background:#fff4df"><strong>Customer note</strong><div style="margin-top:5px">${escapeHtml(payload.notes)}</div></div>` : ""}
        ${adminUrl ? `<a href="${escapeHtml(adminUrl)}" style="display:inline-block;margin-top:24px;border-radius:999px;background:#ef3d1d;color:#fff;text-decoration:none;font-weight:800;padding:13px 20px">Open Order Control</a>` : ""}
      </div>
    </div>
  </body>
</html>`;

  const textLines = payload.lines
    .flatMap((line) => [
      `${line.quantity}x ${line.name} — ${money(line.lineTotal)}`,
      ...lineDetails(line).map((detail) => `  ${detail}`),
    ])
    .join("\n");
  const text = [
    `Paid Nasty Burger House pickup order ${payload.orderId}`,
    `${payload.customer.name} · ${payload.customer.phone} · ${payload.customer.email}`,
    `${payload.locationName} · ASAP pickup`,
    "",
    textLines,
    "",
    `Paid: ${money(payload.total)}`,
    payload.notes ? `Note: ${payload.notes}` : "",
    adminUrl ? `Order Control: ${adminUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

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
