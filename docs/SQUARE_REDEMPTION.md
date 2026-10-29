# Square Loyalty redemption — Nasty Burger House

## Goal and source of truth

Both the shop's Square POS and the website use the SAME Square Loyalty customer
account, Square program reward tiers and Square points balance. Never maintain
a second spendable points balance or redeem via direct negative points adjustments.
The existing Supabase drip_ledger is historical website activity only.

## Current checkout implementation

- A customer can select one reward in Checkout > Review & pay.
- GET /api/account/rewards loads ONLY active, whole-order reward tiers from Square.
  The website currently sends ad-hoc items, so Square catalog-specific free-item
  rewards must NOT be offered online until the website line items have matching
  Square catalog variation IDs.
- Before a reward is issued, the server requires an authenticated, email-confirmed
  Supabase session, SMS-confirmed Australian mobile number, and exact email/phone
  match to an existing Square Customer Directory and Square Loyalty account.
  A phone typed into guest checkout alone must NEVER authorize redemption.
- Server rechecks Square points and the selected live tier. A stable idempotency
  key reserves the reward against the new Square order and Square applies the
  discount. The server checks that Square returned a real discounted AUD total.
- Payment happens through Square's hosted link. When an order is paid, Square
  automatically marks an order-associated reward REDEEMED. Do not call Redeem
  explicitly or subtract points in Supabase.
- If an online reward issuance/discount fails, the server attempts to release
  the issued reward and invalidate that payment link. Check application logs
  for cleanup errors, since network failures can still require staff attention.
- GET /api/cron/expire-square-rewards runs daily when deployed on Vercel,
  authenticated by CRON_SECRET. It only processes old, still-ISSUED rewards
  on website-created orders marked nbh_reward_checkout=yes. It checks for
  paid/pending Square payments, cancels the unused payment link, then releases
  points. A paid, unknown or ambiguous checkout is never cancelled. Scan
  limits mean old rewards can require manual follow-up. It is deliberately
  conservative to avoid cancelling a valid payment.
- In-store customers redeem through Square POS Rewards using the same account
  and the reward tier rules configured in Square Dashboard.

## Required setup and production release gate

Online reward issuance is OFF unless:

    SQUARE_ONLINE_REDEMPTION_ENABLED=true

Leave this unset in production until ALL checks below pass. While disabled,
checkout shows a brief in-store redemption notice and never prompts for SMS.
The disabled rewards API avoids unnecessary Supabase and Square requests.

Only after an SMS provider has been configured and an Australian test number
has successfully completed phone_change verification, enable this separate
server-only gate:

    SUPABASE_SMS_VERIFICATION_ENABLED=true

Without this flag the phone verification form stays hidden even when the
online redemption flag is enabled. Existing SMS-verified members may still be
eligible based on their stored verified phone numbers. Never bypass phone
verification by trusting checkout input or editable user metadata.

1. Configure an ACTIVE Square Loyalty program with the intended reward tiers
   and the participating NBH location. The website cannot create Square tiers.
2. The advertised 2,000-point free Beast Burger Meal is not necessarily an
   existing Square tier. In Square Dashboard configure a matching tier, or
   update website wording to match the actual reward. If the reward is
   catalog-item-scoped, first map website order items to the Square Catalog;
   this implementation intentionally restricts online redemption to
   whole-purchase tiers.
3. Configure and test a real Supabase Auth SMS provider to support phone_change OTP.
   In Supabase Dashboard > Authentication > Providers > Phone, enable phone
   authentication, select and configure an SMS provider (such as Twilio),
   and verify actual Australian-number delivery and phone confirmation. Do
   not use fake provider credentials or pretend SMS verification succeeds.
   Once verified, set SUPABASE_SMS_VERIFICATION_ENABLED=true.
   Verify that a returning member can link the same verified number without
   creating a duplicate Square customer.
4. Set CRON_SECRET in Vercel and verify unauthorized cron requests return 401.
   Hobby daily cron can release points 24–48 hours after abandonment, not
   immediately. Configure monitoring for non-200 cron responses and investigate
   skipped/failed reservations.
5. SQUARE SANDBOX TRANSACTION PROOF IS MANDATORY: create a real Square
   Sandbox payment link, issue a reward against that checkout-created order,
   and check that Square's HOSTED PAYMENT PAGE shows the exact discounted
   price from GET /v2/orders/{id}. A discounted Order total alone is NOT
   sufficient proof the hosted checkout charged the right amount. If Square
   payment links do not update the buyer-facing total after reward creation,
   this flow must be redesigned (e.g. Square Web Payments SDK); do not enable
   SQUARE_ONLINE_REDEMPTION_ENABLED as a workaround.
6. Complete a paid reward checkout; confirm one REDEEMED reward and exactly
   one deduction on the Square customer balance, not a duplicated adjustment.
7. Attempt another checkout with insufficient points and an already redeemed
   tier; verify neither creates a second discount.
8. Abandon a checkout with an issued reward. Manually cancel its link and
   run the authorized cleanup; verify Square returns locked points and a
   deleted reward. Test cleanup again for idempotency.
9. In Square POS redeem a reward for the same customer; verify the website
   reflects the new balance, then try a website checkout with old balance.
   Confirm the server rejects redemption if points were already used in-store.
10. Test network failure after reward creation and before redirect; inspect
    orphan rewards and cleanup logs. Test with a second customer to ensure
    another person's phone number/email cannot spend their points.
11. Check actual post-payment order status, order completion accrual and
    any refund effects. Square may keep pickup orders OPEN until staff complete
    them; earning should continue to run on the existing order.updated
    COMPLETED webhook. Recheck Square's refund rules for rewarded purchases.
12. Test 320–430px, desktop and Light/Dark using docs/DARK_THEME.md.
    Production deployment always requires the owner's explicit approval.

## Security and support

The app/lib/square/reward-identity.ts matcher is intentionally READ-ONLY;
it does not use the general checkout's find-or-create function to authorize
redemption because that existing function can update an existing Square record
from unverified checkout details. Auditing and hardening that legacy customer
association flow is a separate prerequisite for fully secure loyalty account
management. Do not show a redemption button solely based on customer phone
unless the user has proved phone ownership.

Loyalty API docs:
https://developer.squareup.com/docs/loyalty-api/loyalty-rewards
Checkout API restrictions:
https://developer.squareup.com/docs/checkout-api/guidelines-and-limitations
