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

// Separate buyer-only confirmation, using the admin template's shared brand, escaping and date helpers.
export function renderCustomerPaidOrderEmail(payload: PaidOrderNotification) {
  const id = escapeHtml(payload.orderId);
  const customer = escapeHtml(payload.customer.name.trim().split(/\s+/)[0] || "there");
  const location = escapeHtml(payload.locationName);
  const date = escapeHtml(paidTime(payload.paidAt));
  const total = escapeHtml(money(payload.total));
  const itemTotal = payload.lines.reduce((n, item) => n + item.lineTotal, 0);
  const subtotalRow = Math.abs(itemTotal - payload.total) < .01
    ? `<tr><td style="padding:16px 0 5px;color:${palette.ink};font:400 14px/21px Arial,sans-serif;">Subtotal</td><td align="right" style="padding:16px 0 5px;color:${palette.ink};font:700 14px/21px Arial,sans-serif;">${total}</td></tr>` : "";
  const items = payload.lines.map((line) => `
    <tr>
      <td style="padding:14px 4px 14px 0;border-bottom:1px dashed ${palette.line};vertical-align:top;color:${palette.ink};font:700 14px/20px Arial,sans-serif;overflow-wrap:break-word;">
        ${escapeHtml(line.name)}
        ${line.details.filter(Boolean).map(d=>`<div style="margin-top:4px;color:${palette.muted};font:400 12px/18px Arial,sans-serif;">${detailLine(d)}</div>`).join("")}
      </td>
      <td width="40" align="center" style="padding:14px 3px;border-bottom:1px dashed ${palette.line};width:40px;vertical-align:top;color:${palette.ink};font:700 14px/20px Arial,sans-serif;">${escapeHtml(line.quantity)}</td>
      <td width="90" align="right" style="padding:14px 0 14px 3px;border-bottom:1px dashed ${palette.line};width:90px;white-space:nowrap;vertical-align:top;color:${palette.ink};font:700 14px/20px Arial,sans-serif;">${escapeHtml(money(line.lineTotal))}</td>
    </tr>`).join("");
  const notes = payload.notes.trim() ? `<div style="padding-top:18px;margin-top:15px;border-top:1px dashed ${palette.muted};font:400 13px/20px Arial,sans-serif;color:${palette.ink};"><strong>Pickup note:</strong> ${detailLine(payload.notes)}</div>` : "";
  // Decorative thermal-receipt stripes, not a scannable payment barcode.
  const stripes = [...payload.orderId.slice(0,18)].map((c,i)=> {
    const n=c.charCodeAt(0)+i*7;
    return `<span style="display:inline-block;width:${1+n%3}px;height:40px;background:${palette.ink};vertical-align:top;"></span><span style="display:inline-block;width:${1+(n>>2)%3}px;height:40px;background:${palette.surface};vertical-align:top;"></span><span style="display:inline-block;width:${1+(n>>4)%3}px;height:40px;background:${palette.ink};vertical-align:top;"></span><span style="display:inline-block;width:2px;height:40px;background:${palette.surface};vertical-align:top;"></span>`;
  }).join("");
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>Nasty Burger House receipt · ${id}</title>
<style>
@media only screen and (max-width:620px){.email-outer{padding:10px 6px!important}.email-body{padding:22px 10px!important}.receipt-inset{padding:22px 16px!important}.brand-logo{width:47px!important;height:47px!important}.brand-title{font-size:15px!important}.receipt-heading{font-size:21px!important;line-height:27px!important}.receipt-total{font-size:26px!important}}
@media print{body,.email-outer,.email-body{margin:0!important;padding:0!important;background:#FFFFFF!important}.email-hero,.email-intro,.email-footer{display:none!important}.receipt-paper{max-width:80mm!important;width:80mm!important;border:0!important;box-shadow:none!important}.receipt-inset{padding:12px!important}}
</style></head>
<body style="margin:0;padding:0;background:${palette.canvas};color:${palette.ink};font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
<div style="display:none!important;opacity:0;visibility:hidden;max-height:0;max-width:0;overflow:hidden;mso-hide:all;">Order ${id} confirmed and paid: ${total}. Pickup at ${location}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${palette.canvas};"><tr><td class="email-outer" align="center" style="padding:28px 12px;">
<!--[if mso]><table role="presentation" width="600"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${palette.canvas};border-collapse:separate;border-spacing:0;">
<tr><td class="email-hero" style="padding:19px 22px;background:${palette.charcoal};">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
<td width="64" style="width:64px;vertical-align:middle;"><img class="brand-logo" src="${LOGO_URL}" width="56" height="56" alt="Nasty Burger House logo" style="display:block;width:56px;height:56px;border:0;"></td>
<td style="padding-left:10px;vertical-align:middle;"><div class="brand-title" style="color:#FFFFFF;font:700 19px/25px Arial,sans-serif;">NASTY BURGER HOUSE</div><div style="margin-top:4px;color:#E39B8E;font:700 11px/17px Arial,sans-serif;">BURGERS &bull; BEAST BOXES &bull; DRINKS</div></td>
</tr></table></td></tr>
<tr><td class="email-hero" style="background:${palette.charcoal};"><img src="${BANNER_URL}" width="600" alt="Nasty Burger House burgers" style="display:block;width:100%;height:auto;max-width:600px;border:0;"></td></tr>
<tr><td class="email-hero" height="4" style="background:${palette.red};height:4px;font-size:1px;line-height:4px;">&nbsp;</td></tr>
<tr><td class="email-body" style="padding:31px 24px 34px;background:${palette.canvas};">
<div class="email-intro" style="margin:0 0 26px;text-align:center;">
<h1 style="margin:0;color:${palette.ink};font:700 27px/34px Arial,sans-serif;">Your order confirmation</h1>
<p style="margin:10px 0 0;color:${palette.muted};font:400 15px/23px Arial,sans-serif;">Thanks, ${customer}! We've received your paid order and will get it ready for pickup.</p>
</div>
<table class="receipt-paper" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:442px;background:${palette.surface};border:1px solid ${palette.line};border-collapse:separate;border-spacing:0;">
<tr><td style="height:8px;border-top:5px dashed ${palette.canvas};font-size:1px;line-height:1px;">&nbsp;</td></tr>
<tr><td class="receipt-inset" style="padding:24px 29px 26px;background:${palette.surface};">
<div style="text-align:center;">
<img src="${LOGO_URL}" width="76" height="76" alt="Nasty Burger House" style="display:block;width:76px;height:76px;margin:0 auto 10px;border:0;">
<div style="color:${palette.ink};font:900 20px/27px Arial,sans-serif;">NASTY BURGER HOUSE</div>
<div style="margin:5px 0 10px;color:${palette.red};font:700 12px/18px Arial,sans-serif;">BURGERS &bull; BEAST BOXES &bull; DRINKS</div>
<div style="color:${palette.ink};font:400 13px/20px 'Courier New',monospace;">${location}, ACT</div>
<div style="color:${palette.ink};font:400 12px/19px Arial,sans-serif;">nastyburgerhouse.com.au</div>
</div>
<div style="margin:19px 0 17px;border-top:2px dashed ${palette.muted};font-size:1px;line-height:1px;">&nbsp;</div>
<h2 class="receipt-heading" style="margin:0 0 15px;text-align:center;color:${palette.red};font:900 23px/29px Arial,sans-serif;">ORDER CONFIRMED &amp; PAID</h2>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="color:${palette.ink};font:400 13px/22px 'Courier New',monospace;">
<tr><td style="width:88px;padding:2px 5px 2px 0;vertical-align:top;">ORDER NO.</td><td style="padding:2px 0;font-weight:700;overflow-wrap:anywhere;">${id}</td></tr>
<tr><td style="padding:2px 5px 2px 0;vertical-align:top;">PAID AT</td><td style="padding:2px 0;">${date}</td></tr>
<tr><td style="padding:2px 5px 2px 0;vertical-align:top;">PICKUP</td><td style="padding:2px 0;">${location} &middot; ASAP</td></tr>
<tr><td style="padding:2px 5px 2px 0;vertical-align:top;">PAYMENT</td><td style="padding:2px 0;color:${palette.red};font-weight:700;">PAID VIA SQUARE</td></tr>
</table>
<div style="margin:20px 0 14px;border-top:2px dashed ${palette.muted};font-size:1px;line-height:1px;">&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
<tr><th scope="col" align="left" style="padding:0 4px 8px 0;text-align:left;color:${palette.ink};font:900 13px/19px Arial,sans-serif;">ITEM</th><th scope="col" width="40" align="center" style="padding:0 3px 8px;text-align:center;color:${palette.ink};font:900 13px/19px Arial,sans-serif;">QTY</th><th scope="col" width="90" align="right" style="padding:0 0 8px 3px;text-align:right;color:${palette.ink};font:900 13px/19px Arial,sans-serif;">AMT</th></tr>
${items}
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${subtotalRow}
<tr><td style="padding-top:7px;color:${palette.red};font:900 20px/32px Arial,sans-serif;">TOTAL PAID</td><td align="right" class="receipt-total" style="padding-top:7px;white-space:nowrap;color:${palette.red};font:900 29px/34px Arial,sans-serif;">${total}</td></tr>
</table>
${notes}
<div style="margin:20px 0 18px;border-top:2px dashed ${palette.muted};font-size:1px;line-height:1px;">&nbsp;</div>
<div style="text-align:center;color:${palette.ink};font:900 16px/24px Arial,sans-serif;">THANK YOU!</div>
<div style="margin-top:6px;text-align:center;color:${palette.muted};font:400 13px/20px Arial,sans-serif;">Thank you for eating with us!<br>Keep this receipt for pickup.</div>
<div role="presentation" aria-hidden="true" style="margin:17px 0 8px;text-align:center;white-space:nowrap;font-size:0;line-height:0;overflow:hidden;">${stripes}</div>
<div style="text-align:center;color:${palette.ink};font:700 12px/19px 'Courier New',monospace;letter-spacing:.08em;overflow-wrap:anywhere;">${id}</div>
<div style="margin-top:13px;text-align:center;color:${palette.muted};font:400 11px/18px Arial,sans-serif;">Payment confirmed. This does not mean the order is ready for collection.</div>
</td></tr>
<tr><td style="height:8px;border-bottom:5px dashed ${palette.canvas};font-size:1px;line-height:1px;">&nbsp;</td></tr>
</table>
<div class="email-footer" style="padding:22px 4px 0;text-align:center;color:${palette.muted};font:400 12px/19px Arial,sans-serif;">Square may email a separate payment receipt.<br><a href="${BRAND_ORIGIN}" style="display:inline-block;margin-top:9px;color:${palette.red};font:700 13px/20px Arial,sans-serif;text-decoration:underline;">Visit Nasty Burger House</a></div>
</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body></html>`;
  const plainItems = payload.lines.flatMap(line=>[`${line.quantity}x ${line.name} — ${money(line.lineTotal)}`,...line.details.filter(Boolean).map(d=>`  ${d}`)]);
  const text = ["NASTY BURGER HOUSE — ORDER CONFIRMED & PAID",`Thanks, ${payload.customer.name.trim().split(/\s+/)[0] || "there"}!`,`Order: ${payload.orderId}`,`Paid: ${paidTime(payload.paidAt)}`,`Pickup: ${payload.locationName} — ASAP`,"Payment: PAID VIA SQUARE","","ITEMS",...plainItems,"",...(subtotalRow?[`Subtotal: ${money(payload.total)}`]:[]),`TOTAL PAID: ${money(payload.total)}`,payload.notes.trim()?`Pickup note: ${payload.notes}`:"","Thank you for eating with us!","Keep this receipt for pickup; this does not mean your order is ready.","Square may send a separate payment receipt.",BRAND_ORIGIN].filter(Boolean).join("\n");
  return {html,text};
}
