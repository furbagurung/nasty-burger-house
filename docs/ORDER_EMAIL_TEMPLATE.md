# Nasty Burger House — Paid order email

## Purpose

The restaurant email is an **operational notification for verified paid Square website orders only**. The Square webhook still verifies payment and decides whether to send it. The email template does not create orders or initiate any payment.

## Source files

- `app/lib/email/paid-order-template.ts` — branded HTML email and plain-text alternative.
- `app/lib/admin-notifications.ts` — Resend sender, recipients, subject, and idempotency.
- `app/api/square/webhooks/route.ts` — verifies Square payment before notification.
- `docs/DARK_THEME.md` — brand palette and readability requirements.

## Current brand assets

The email uses **absolute HTTPS URLs** because Gmail/Outlook cannot load relative paths:

| Element | Repository file | Public URL |
| --- | --- | --- |
| Logo | `public/logo.webp` | `https://www.nastyburgerhouse.com.au/logo.webp` |
| Header banner | `public/images/hero-slider/beast-burgers.jpg` | `https://www.nastyburgerhouse.com.au/images/hero-slider/beast-burgers.jpg` |

To change an image, update `LOGO_URL` or `BANNER_URL` in the template file. Use an existing public asset, hosted on the production domain. For maximum **legacy Outlook** compatibility, replace the WebP logo with a **PNG** version and update its URL; the text brand name remains legible if an image is blocked.

## Styling

The template uses a ~600px table-based layout and inline styles for email compatibility. Email clients do not load the site's `theme-dark.css` or shadcn styles. The palette in `paid-order-template.ts` mirrors the project tokens: deep charcoal `#1E1E1E`, light red `#AC3342`, blush `#F8E2E5`, legible text, and a confirmed-payment success treatment. Avoid pure black and verify WCAG AA contrast.

Typography uses Arial/Helvetica fallback because web-loaded Inter is unreliable in email. Keep prominent text selectable and readable even when images are blocked. Keep the total, customer contact, notes, and line items in HTML rather than putting them into the banner image.

## Send behavior

The existing `sendAdminPaidOrderEmail` flow keeps the same email configuration, including comma-separated `ORDER_NOTIFICATION_EMAIL` recipients and the stable Resend idempotency key based on Square's order ID. Styling changes do **not** restore emails at checkout creation.

## Before deployment

1. Run `git pull origin main` and `npm run build`.
2. Confirm the public logo and banner URLs return images in a browser.
3. Test a paid order in Square Sandbox and inspect HTML and plain-text email in Gmail/mobile and Outlook.
4. Test a checkout abandoned before payment; it must **not** send a restaurant email.
5. Re-send a Square webhook in the idempotency window; it should not duplicate an already delivered email.
6. Confirm colors, responsive behavior, escaped customer notes, and links.
7. Deploy manually **only after explicit approval**.
