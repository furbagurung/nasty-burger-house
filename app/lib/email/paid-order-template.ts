import "server-only";

import type { PaidOrderNotification } from "../square/paid-order-notifications";

// Email clients do not resolve website CSS variables, so keep one set of
// email-safe colours aligned with docs/DARK_THEME.md (and the light brand red).
const palette = {
  canvas: "#F4F2F0",
  surface: "#FFFFFF",
  charcoal: "#1E1E1E",
  ink: "#282326",
  muted: "#655B60",
  line: "#EFE2E3",
  red: "#AC3342",
  blush: "#F8E2E5",
  green: "#21694B",
  greenBg: "#E8F3ED",
} as const;

const BRAND_ORIGIN = "https://www.nastyburgerhouse.com.au";
const LOGO_URL = `${BRAND_ORIGIN}/logo.webp`;
const BANNER_URL = `${BRAND_ORIGIN}/images/hero-slider/beast-burgers.jpg`;
const ADMIN_ORDERS_URL = `${BRAND_ORIGIN}/admin/orders`;

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value);
}

function paidTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function detailLine(value: string) {
  return escapeHtml(value).replaceAll("\n", "<br>");
}

export function renderPaidOrderEmail(payload: PaidOrderNotification) {
  const safeOrderId = escapeHtml(payload.orderId);
  const safeCustomerName = escapeHtml(payload.customer.name);
  const safeEmail = escapeHtml(payload.customer.email);
  const safePhone = escapeHtml(payload.customer.phone);
  const safeLocation = escapeHtml(payload.locationName);
  const safePaidTime = escapeHtml(paidTime(payload.paidAt));
  const total = money(payload.total);

  const rows = payload.lines.map((line) => {
    const details = line.details
      .filter(Boolean)
      .map((detail) => `<div style="color:${palette.muted};font-size:13px;line-height:19px;margin-top:5px;overflow-wrap:break-word;">${detailLine(detail)}</div>`)
      .join("");
    return `
      <tr>
        <td style="padding:15px 0;border-bottom:1px solid ${palette.line};vertical-align:top;font-family:Arial,Helvetica,sans-serif;">
          <div style="color:${palette.ink};font-size:15px;font-weight:700;line-height:21px;">${escapeHtml(line.quantity)} &times; ${escapeHtml(line.name)}</div>
          ${details}
        </td>
        <td align="right" style="padding:15px 0 15px 10px;border-bottom:1px solid ${palette.line};vertical-align:top;white-space:nowrap;color:${palette.ink};font:700 15px/21px Arial,Helvetica,sans-serif;">
          ${escapeHtml(money(line.lineTotal))}
        </td>
      </tr>`;
  }).join("");

  const notesBlock = payload.notes.trim()
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0 0;background:${palette.blush};border-radius:10px;"><tr><td style="padding:15px 17px;">
        <div style="font:700 13px/20px Arial,Helvetica,sans-serif;color:${palette.red};">CUSTOMER NOTES</div>
        <div style="font:400 14px/22px Arial,Helvetica,sans-serif;color:${palette.ink};overflow-wrap:break-word;">${detailLine(payload.notes)}</div>
      </td></tr></table>`
    : "";

  // Tables, inline styles and absolute HTTPS image URLs are used deliberately
  // for email client support; the plain-text alternative never depends on images.
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Paid order ${safeOrderId}</title>
  <style>
    @media only screen and (max-width:620px) {
      .email-outer { padding:12px 8px !important; }
      .email-inset { padding:23px 20px !important; }
      .email-title { font-size:25px !important; line-height:30px !important; }
      .email-total { font-size:28px !important; }
      .email-logo { width:48px !important; height:48px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${palette.canvas};color:${palette.ink};font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none!important;opacity:0;visibility:hidden;mso-hide:all;max-height:0;max-width:0;overflow:hidden;">
    Payment confirmed: ${escapeHtml(total)} for order ${safeOrderId}. Pickup at ${safeLocation}.
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${palette.canvas};">
    <tr><td align="center" class="email-outer" style="padding:30px 15px;">
      <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"><tr><td><![endif]-->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:600px;background:${palette.surface};border:1px solid ${palette.line};border-collapse:separate;border-spacing:0;">

        <tr><td class="email-inset" style="padding:21px 28px;background:${palette.charcoal};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="62" style="width:62px;vertical-align:middle;">
                <img class="email-logo" src="${LOGO_URL}" width="56" height="56" alt="Nasty Burger House logo" style="display:block;width:56px;height:56px;max-width:100%;border:0;border-radius:8px;">
              </td>
              <td style="padding-left:8px;vertical-align:middle;">
                <div style="font:700 16px/22px Arial,Helvetica,sans-serif;letter-spacing:.02em;color:#FFFFFF;">NASTY BURGER HOUSE</div>
                <div style="margin-top:4px;font:700 10px/16px Arial,Helvetica,sans-serif;letter-spacing:.13em;color:#D88B7D;">RESTAURANT ORDER ALERT</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="background:${palette.charcoal};">
          <img src="${BANNER_URL}" width="600" alt="Nasty Burger House signature burgers" style="display:block;width:100%;height:auto;max-width:600px;border:0;">
        </td></tr>
        <tr><td height="4" style="height:4px;background:${palette.red};font-size:1px;line-height:4px;">&nbsp;</td></tr>

        <tr><td class="email-inset" style="padding:30px 32px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td>
              <div style="font:700 11px/18px Arial,Helvetica,sans-serif;color:${palette.red};letter-spacing:.1em;">NEW ORDER</div>
              <h1 class="email-title" style="margin:7px 0 14px;color:${palette.ink};font:700 29px/36px Arial,Helvetica,sans-serif;">Payment confirmed.</h1>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px;background:${palette.greenBg};border-radius:7px;"><tr><td style="padding:8px 11px;color:${palette.green};font:700 12px/18px Arial,Helvetica,sans-serif;">PAID VIA SQUARE</td></tr></table>
            </td></tr>
          </table>

          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${palette.canvas};border:1px solid ${palette.line};border-radius:10px;">
            <tr><td style="padding:19px 20px;">
              <div style="font:700 11px/18px Arial,Helvetica,sans-serif;letter-spacing:.08em;color:${palette.muted};">AMOUNT PAID</div>
              <div class="email-total" style="margin:4px 0 13px;font:700 34px/40px Arial,Helvetica,sans-serif;color:${palette.ink};">${escapeHtml(total)}</div>
              <div style="font:400 13px/21px Arial,Helvetica,sans-serif;color:${palette.muted};overflow-wrap:break-word;">
                <strong style="color:${palette.ink};">Order</strong> ${safeOrderId}<br>
                <strong style="color:${palette.ink};">Paid</strong> ${safePaidTime}
              </div>
            </td></tr>
          </table>

          <h2 style="margin:28px 0 12px;font:700 17px/24px Arial,Helvetica,sans-serif;color:${palette.ink};">Customer &amp; pickup</h2>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font:400 14px/23px Arial,Helvetica,sans-serif;color:${palette.ink};">
            <tr><td style="padding:5px 0;color:${palette.muted};width:86px;vertical-align:top;">Name</td><td style="padding:5px 0;font-weight:700;overflow-wrap:break-word;">${safeCustomerName}</td></tr>
            ${payload.customer.phone ? `<tr><td style="padding:5px 0;color:${palette.muted};vertical-align:top;">Phone</td><td style="padding:5px 0;overflow-wrap:break-word;">${safePhone}</td></tr>` : ""}
            ${payload.customer.email ? `<tr><td style="padding:5px 0;color:${palette.muted};vertical-align:top;">Email</td><td style="padding:5px 0;overflow-wrap:break-word;">${safeEmail}</td></tr>` : ""}
            <tr><td style="padding:5px 0;color:${palette.muted};vertical-align:top;">Pickup</td><td style="padding:5px 0;overflow-wrap:break-word;">${safeLocation} &middot; ASAP</td></tr>
          </table>

          <h2 style="margin:29px 0 6px;font:700 17px/24px Arial,Helvetica,sans-serif;color:${palette.ink};">Order summary</h2>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;">${rows}</table>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding:17px 0;color:${palette.ink};font:700 16px/24px Arial,Helvetica,sans-serif;">Total paid</td>
              <td align="right" style="padding:17px 0;color:${palette.ink};font:700 18px/24px Arial,Helvetica,sans-serif;white-space:nowrap;">${escapeHtml(total)}</td>
            </tr>
          </table>
          ${notesBlock}

          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:25px;">
            <tr><td align="center" bgcolor="${palette.red}" style="background:${palette.red};border-radius:8px;">
              <a href="${ADMIN_ORDERS_URL}" style="display:inline-block;padding:14px 23px;border-radius:8px;color:#FFFFFF;text-decoration:none;font:700 14px/20px Arial,Helvetica,sans-serif;">Open Admin Orders</a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td class="email-inset" style="padding:20px 32px 25px;background:${palette.canvas};border-top:1px solid ${palette.line};">
          <div style="color:${palette.muted};font:400 12px/19px Arial,Helvetica,sans-serif;">Automated restaurant notification &middot; Sent after Square confirms payment.</div>
          <div style="margin-top:6px;color:${palette.ink};font:700 12px/19px Arial,Helvetica,sans-serif;">Nasty Burger House &middot; ${safeLocation}</div>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>`;

  const textLines = payload.lines
    .flatMap((line) => [
      `${line.quantity}x ${line.name} — ${money(line.lineTotal)}`,
      ...line.details.map((detail) => `  ${detail}`),
    ])
    .join("\n");
  const text = [
    `NASTY BURGER HOUSE — PAID ORDER`,
    `Order: ${payload.orderId}`,
    `Payment confirmed by Square: ${total}`,
    `Paid: ${paidTime(payload.paidAt)}`,
    `Customer: ${payload.customer.name}`,
    payload.customer.phone ? `Phone: ${payload.customer.phone}` : "",
    payload.customer.email ? `Email: ${payload.customer.email}` : "",
    `Pickup: ${payload.locationName} — ASAP`,
    "",
    "ITEMS",
    textLines,
    "",
    `Total paid: ${total}`,
    payload.notes ? `Customer note: ${payload.notes}` : "",
    `Admin Orders: ${ADMIN_ORDERS_URL}`,
  ].filter((line) => line !== "").join("\n");

  return { html, text };
}
