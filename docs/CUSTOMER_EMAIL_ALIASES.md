# Multiple verified login emails — rollout and QA

## Purpose
One Supabase Auth user and customer ID can own up to three additional **verified** login email addresses. Password sign-in with any linked address resolves server-side to the same Supabase Auth user. Orders/reviews remain scoped to the existing user ID, and Square continues to own loyalty balances. This is **not** an automatic merge of independently created Supabase Auth users.

## Deployment order (manual approval required)
1. Review and apply `supabase/migrations/202611050001_customer_email_aliases.sql` to the correct Supabase database **before** deploying app code. Verify RLS, grants, triggers, unique constraints and both auth collision guards.
2. Confirm `RESEND_API_KEY` and `ACCOUNT_EMAIL_FROM` (or existing `ORDER_NOTIFICATION_FROM`) are configured in Vercel Production; the sender must be verified with the email provider.
3. Run `npm ci`, `node --test tests/*.test.mjs`, `npx tsc --noEmit`, `npm run lint`, `npm run build` on the matching code, then explicitly deploy main.
4. Check both Light and Dark modes on 320–430px mobile and desktop; confirm that the account page shows a single list of primary and additional email addresses.

## Manual acceptance tests
- Add a different email from an authenticated, confirmed website account. Check an emailed link arrives and contains a short-lived hash-fragment token.
- Before confirmation, signing in with that secondary email must fail. Click the confirmation button on the link and sign in with the same original account password, then confirm the user ID/order list/Drip Points identity are unchanged.
- Confirm invalid, expired, already consumed and tampered tokens cannot verify. Test removing a verified email and confirm it no longer signs in.
- Adding an existing Auth account's primary email as an alias must be rejected, even if the link reaches the mailbox; test a concurrent signup to a verified alias is blocked.
- New authenticated orders placed using a verified secondary email should associate with the signed-in user ID. Guest orders must not gain a customer association from email or phone alone.
- Square loyalty balance stays Square-authoritative; no bonus or points adjustment is created by email linking. Checkout recipients still receive their receipts at the email used at checkout.
- Admin Customers should combine a Square profile only when its email is the primary email or a **verified alias**; a shared phone number alone must not merge profiles.

## Known boundaries
- Supabase Auth still stores a single primary email. Aliases are private server-managed mappings: the original password is used for all password logins.
- Password-reset mail is sent to the primary email, not an additional alias. OAuth/Google accounts require their own provider login; adding an alias does not automatically link a different Google OAuth identity.
- Two independent Supabase Auth users cannot be combined by adding an email alias. Their verified ownership, orders, reviews, account IDs and any Square customer linkage must be audited and migrated separately, without creating duplicate rewards.
- Email verification links expire after one hour. New aliases are not usable until verified. If the new migration is missing, the new endpoints fail closed.
- No customer records, passwords, Square points or existing login credentials should be changed by the rollout itself.
