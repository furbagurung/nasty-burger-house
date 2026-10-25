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
  paper: "#FFFCF7",
} as const;

const BRAND_ORIGIN = "https://www.nastyburgerhouse.com.au";
const LOGO_URL = `${BRAND_ORIGIN}/logo.webp`;
const BANNER_URL = `${BRAND_ORIGIN}/images/hero-slider/beast-burgers.jpg`;
const ADMIN_ORDERS_URL = `${BRAND_ORIGIN}/admin/orders`;
const CUSTOMER_LOGO_URL = `${BRAND_ORIGIN}/images/email/receipt-logo-cutout.webp`;
const PAPER_TEXTURE_URL = `${BRAND_ORIGIN}/images/email/receipt-paper-texture.webp`;
const PAPER_TOP_URL = `${BRAND_ORIGIN}/images/email/receipt-torn-top.webp`;
const PAPER_BOTTOM_URL = `${BRAND_ORIGIN}/images/email/receipt-torn-bottom.webp`;

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
  const orderId = escapeHtml(payload.orderId);
  const location = escapeHtml(payload.locationName);
  const total = escapeHtml(money(payload.total));
  const when = new Date(payload.paidAt);
  const validTime = !Number.isNaN(when.getTime());
  const date = escapeHtml(validTime ? new Intl.DateTimeFormat("en-AU", {
    timeZone:"Australia/Sydney", day:"2-digit", month:"2-digit", year:"numeric"
  }).format(when) : "Unavailable");
  const time = escapeHtml(validTime ? new Intl.DateTimeFormat("en-AU", {
    timeZone:"Australia/Sydney", hour:"numeric", minute:"2-digit", hour12:true,
    timeZoneName:"short"
  }).format(when) : "Unavailable");
  const itemsSubtotal = payload.lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const rows = payload.lines.map((line) => {
    const details = line.details.filter(Boolean).map(detail =>
      `<div style="margin-top:4px;font:400 12px/18px 'Courier New',Courier,monospace;color:${palette.muted};overflow-wrap:anywhere;">${detailLine(detail)}</div>`
    ).join("");
    return `<tr>
      <td style="vertical-align:top;padding:12px 5px 11px 0;border-bottom:1px dotted ${palette.line};">
        <div style="color:${palette.ink};font:700 14px/20px Arial,Helvetica,sans-serif;overflow-wrap:anywhere;">${escapeHtml(line.name)}</div>${details}
      </td>
      <td align="center" style="vertical-align:top;padding:12px 2px 11px;border-bottom:1px dotted ${palette.line};white-space:nowrap;color:${palette.ink};font:700 13px/19px 'Courier New',Courier,monospace;">${escapeHtml(line.quantity)}</td>
      <td align="right" style="vertical-align:top;padding:12px 0 11px 4px;border-bottom:1px dotted ${palette.line};white-space:nowrap;color:${palette.ink};font:700 13px/19px 'Courier New',Courier,monospace;">${escapeHtml(money(line.lineTotal))}</td>
    </tr>`;
  }).join("");
  const notes = payload.notes.trim() ? `
    <tr><td colspan="3" style="padding:14px 0 0;vertical-align:top;">
      <div style="font:700 12px/20px 'Courier New',Courier,monospace;color:${palette.ink};">PICKUP NOTE</div>
      <div style="font:400 12px/19px 'Courier New',Courier,monospace;color:${palette.muted};overflow-wrap:anywhere;">${detailLine(payload.notes)}</div>
    </td></tr>` : "";

  // Code 39 symbology: 9 alternating bars/spaces per character with 3 wide elements.
  // Decorative fallback is the visible reference below; barcode never replaces the order ID.
  const patterns = new Map(Object.entries({
    "0":"000110100","1":"100100001","2":"001100001","3":"101100000",
    "4":"000110001","5":"100110000","6":"001110000","7":"000100101",
    "8":"100100100","9":"001100100",
    "A":"100001001","B":"001001001","C":"101001000","D":"000011001",
    "E":"100011000","F":"001011000","G":"000001101","H":"100001100",
    "I":"001001100","J":"000011100","K":"100000011","L":"001000011",
    "M":"101000010","N":"000010011","O":"100010010","P":"001010010",
    "Q":"000000111","R":"100000110","S":"001000110","T":"000010110",
    "U":"110000001","V":"011000001","W":"111000000","X":"010010001",
    "Y":"110010000","Z":"011010000","-":"010000101","*":"010010100"
  }));
  const rawOrderId = payload.orderId.toUpperCase();
  const canEncode = /^[A-Z0-9-]{1,16}$/.test(rawOrderId);
  const barcode = canEncode ? `<div aria-hidden="true" style="font-size:0;line-height:0;white-space:nowrap;display:block;text-align:center;padding:9px 0;">
    ${("*"+rawOrderId+"*").split("").map((character,index) => {
      const pattern = patterns.get(character);
      if (!pattern) return "";
      return pattern.split("").map((wide,partIndex) =>
        `<span style="display:inline-block;vertical-align:top;background:${partIndex%2===0?palette.ink:palette.paper};width:${wide==="1"?2.8:1.3}px;height:40px;font-size:0;line-height:0;"></span>`
      ).join("") + (index < rawOrderId.length+1 ? `<span style="display:inline-block;vertical-align:top;background:${palette.paper};width:1.3px;height:40px;font-size:0;"></span>` : "");
    }).join("")}
  </div>` : "";

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only">
  <title>Order confirmed and paid — ${orderId}</title>
  <style>
    :root { color-scheme:light only; }
    .receipt-paper,.receipt-padding { background-color:#FFFCF7!important;color:#282326!important; }
    .receipt-padding a { color:#282326!important; }
    /* Faint paper fibres, plain off-white fallback when gradients are unsupported. */
    .receipt-paper,.receipt-padding { background-image:url('${PAPER_TEXTURE_URL}')!important;background-size:192px 320px!important; }
    @media (prefers-color-scheme: dark) {
      .receipt-paper,.receipt-padding { background-color:#FFFCF7!important;color:#282326!important; }
    .receipt-padding a { color:#282326!important; }
      .receipt-paper .receipt-ink { color:#282326!important; }
      .receipt-paper .receipt-muted { color:#655B60!important; }
      .receipt-paper .receipt-red { color:#AC3342!important; }
    }
    @media only screen and (max-width:620px) {
      .email-outer{padding:22px 8px!important}
      .receipt-padding{padding:23px 15px 21px!important}
      .brand-logo{width:48px!important;height:48px!important}
    }
    @media print {
      body,.email-outer{background:#FFFFFF!important;padding:0!important}
      .receipt-paper{border:0!important;box-shadow:none!important;-webkit-box-shadow:none!important;max-width:80mm!important}
      .receipt-cut-top,.receipt-cut-bottom{display:none!important}
    }
  </style>
</head>
<body bgcolor="#AC3342" style="margin:0;padding:0;background:${palette.red};color:${palette.ink};font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
<div style="display:none!important;opacity:0;visibility:hidden;mso-hide:all;max-height:0;max-width:0;overflow:hidden;">
  Order ${orderId} is confirmed and paid (${total}). Pickup ASAP at ${location}.
</div>
<table role="presentation" bgcolor="#AC3342" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${palette.red};">
  <tr><td align="center" class="email-outer" style="padding:38px 14px;">
    <!--[if mso]><table role="presentation" width="600"><tr><td><![endif]-->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;border-collapse:separate;border-spacing:0;background:${palette.red};">
      <tr><td align="center" style="padding:0 12px 0;">
        <!--[if mso]><table role="presentation" width="415"><tr><td><![endif]-->
        <table role="presentation" class="receipt-paper" bgcolor="#FFFCF7" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="width:100%;max-width:415px;background-color:${palette.paper};background-image:url('${PAPER_TEXTURE_URL}');background-size:192px 320px;color-scheme:light only;border:0;border-collapse:separate;border-spacing:0;box-shadow:10px 20px 28px rgba(18,18,18,.34);-webkit-box-shadow:10px 20px 28px rgba(18,18,18,.34);">
          <tr><td class="receipt-cut-top" bgcolor="#AC3342" height="22" style="height:22px;font-size:0;line-height:0;background:${palette.red};"><img src="${PAPER_TOP_URL}" alt="" width="415" height="22" style="display:block;width:100%;height:22px;border:0;"></td></tr>
          <tr><td align="center" class="receipt-padding" bgcolor="#FFFCF7" background="${PAPER_TEXTURE_URL}" style="padding:30px 27px 31px;background-color:${palette.paper};background-image:linear-gradient(162deg,rgba(99,73,45,.045),transparent 24%,rgba(112,85,57,.035) 45%,transparent 70%),url('${PAPER_TEXTURE_URL}');background-size:100% 100%,192px 320px;color:${palette.ink};color-scheme:light only;">
            <img src="${CUSTOMER_LOGO_URL}" width="126" height="103" alt="Nasty Burger House logo" style="display:block;width:126px;height:103px;max-width:100%;border:0;margin:0 auto 11px;">
            <div style="font:900 28px/33px Impact,'Arial Narrow','Arial Black',Arial,sans-serif;letter-spacing:.01em;color:${palette.ink};">NASTY BURGER HOUSE</div>
            <div style="margin-top:3px;font:700 14px/21px 'Courier New',Courier,monospace;color:${palette.red};">BURGERS &bull; BEAST BOXES &bull; DRINKS</div>
            <div style="margin-top:11px;font:600 15px/22px 'Courier New',Courier,monospace;color:${palette.ink};">${location}</div>
            <div style="margin-top:2px;color:${palette.ink};font:700 14px/21px 'Courier New',Courier,monospace;"><a href="${BRAND_ORIGIN}" style="color:${palette.ink}!important;font:700 14px/21px 'Courier New',Courier,monospace;text-decoration:underline;">nastyburgerhouse.com.au</a></div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:17px 0 13px;border-top:2px dashed ${palette.ink};"><tr><td height="1" style="height:1px;line-height:1px;font-size:1px;">&nbsp;</td></tr></table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font:600 15px/23px 'Courier New',Courier,monospace;color:${palette.ink};">
              <tr><td width="36%" style="vertical-align:top;">Order No:</td><td style="font-weight:700;overflow-wrap:anywhere;">${orderId}</td></tr>
              <tr><td style="vertical-align:top;">Date:</td><td>${date}</td></tr>
              <tr><td style="vertical-align:top;">Time:</td><td>${time}</td></tr>
              <tr><td style="vertical-align:top;">Pickup:</td><td>ASAP</td></tr>
              <tr><td style="vertical-align:top;">Payment:</td><td style="font-weight:700;color:${palette.red};">PAID</td></tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:15px 0 4px;border-top:2px dashed ${palette.ink};"><tr><td height="1" style="height:1px;line-height:1px;font-size:1px;">&nbsp;</td></tr></table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;border-collapse:collapse;font-family:'Courier New',Courier,monospace;">
              <tr>
                <th align="left" width="55%" style="padding:0 5px 6px 0;font:900 18px/24px Impact,'Arial Narrow','Arial Black',Arial,sans-serif;color:${palette.ink};">ITEM</th>
                <th align="center" width="13%" style="padding:0 2px 6px;font:900 18px/24px Impact,'Arial Narrow','Arial Black',Arial,sans-serif;color:${palette.ink};">QTY</th>
                <th align="right" width="32%" style="padding:0 0 6px 2px;font:900 18px/24px Impact,'Arial Narrow','Arial Black',Arial,sans-serif;color:${palette.ink};">AMT</th>
              </tr>
              ${rows}
              ${notes}
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:15px;border-top:2px dashed ${palette.ink};">
              <tr><td height="1" style="height:1px;line-height:1px;font-size:1px;">&nbsp;</td></tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font:400 13px/22px 'Courier New',Courier,monospace;color:${palette.ink};">
              <tr><td style="padding:4px 0;">Subtotal</td><td align="right" style="white-space:nowrap;">${escapeHtml(money(itemsSubtotal))}</td></tr>
              <tr>
                <td style="padding:9px 0 0;font:900 28px/34px Impact,'Arial Narrow','Arial Black',Arial,sans-serif;color:${palette.red};">TOTAL</td>
                <td align="right" style="padding:9px 0 0;white-space:nowrap;font:900 29px/34px Impact,'Arial Narrow','Arial Black',Arial,sans-serif;color:${palette.red};">${total}</td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 15px;border-top:2px dashed ${palette.ink};">
              <tr><td height="1" style="height:1px;line-height:1px;font-size:1px;">&nbsp;</td></tr>
            </table>
            <div style="font:700 15px/23px 'Courier New',Courier,monospace;color:${palette.ink};">THANK YOU FOR EATING WITH US!</div>
            <div style="margin-top:4px;font:400 14px/21px 'Courier New',Courier,monospace;color:${palette.ink};">
              Please show this receipt at pickup.
            </div>
            ${barcode}
            <div style="font:700 12px/18px 'Courier New',Courier,monospace;letter-spacing:.10em;color:${palette.ink};overflow-wrap:anywhere;">${orderId}</div>
          </td></tr>
          <tr><td class="receipt-cut-bottom" bgcolor="#AC3342" height="22" style="height:22px;font-size:0;line-height:0;background:${palette.red};"><img src="${PAPER_BOTTOM_URL}" alt="" width="415" height="22" style="display:block;width:100%;height:22px;border:0;"></td></tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td></tr>
    </table>
    <!--[if mso]></td></tr></table><![endif]-->
  </td></tr>
</table>
</body>
</html>`;
  const textLines = payload.lines.flatMap((line) => [
    `${line.quantity} x ${line.name} - ${money(line.lineTotal)}`,
    ...line.details.filter(Boolean).map(detail => `  ${detail}`),
  ]);
  const text = [
    "NASTY BURGER HOUSE — ORDER CONFIRMED & PAID",
    `Thanks, ${payload.customer.name.trim().split(/\s+/)[0] || "there"}! Your payment is confirmed.`,
    `Order No: ${payload.orderId}`,
    `Date: ${date}`,
    `Time: ${time}`,
    `Pickup: ${payload.locationName} - ASAP`,
    "Payment: PAID VIA SQUARE",
    "",
    "ITEMS",
    ...textLines,
    payload.notes.trim()?`Pickup note: ${payload.notes}`:"",
    "",
    `Items subtotal: ${money(itemsSubtotal)}`,
    `TOTAL PAID: ${money(payload.total)}`,
    "",
    "Thank you for eating with us! Keep this receipt for pickup.",
    "Payment confirmed; your order is not necessarily ready to collect.",
    "Square may email a separate payment receipt.",
    BRAND_ORIGIN,
  ].filter(Boolean).join("\n");
  return {html,text};
}
