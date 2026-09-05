# Nasty Burger House — Supabase production setup

This project uses Supabase Auth + PostgreSQL for customer accounts, order history, Drip Points, reviews and the `/admin` order-control dashboard.

## 1. Create the Supabase project

Create a Supabase project and open the project's **Connect** dialog. Add these values to `.env.local` locally and to the deployment environment later:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

`SUPABASE_SECRET_KEY` is server-only. Never expose it in a `NEXT_PUBLIC_` variable or send it to the browser.

## 2. Apply the database migrations

Apply the SQL files in `supabase/migrations/` in filename order:

```text
supabase/migrations/202609050001_customer_platform.sql
supabase/migrations/202609050002_permission_hardening.sql
```

For the first setup, the files can be pasted into the Supabase SQL Editor and run in that order. They create and secure:

- customer profiles tied to `auth.users`
- admin membership
- orders and order lines
- Drip Points ledger
- reward-redemption records
- verified-order reviews
- Row Level Security policies
- column-level write restrictions
- the 500-point signup trigger
- the order-points lifecycle trigger

### Current Drip Points rule

- account signup: **+500 available points** once
- eligible order earning: **10 points per A$1** of validated order subtotal
- newly placed order: points are **pending**
- order marked `completed`: points become **available**
- order marked `cancelled`: points become **void**
- current reward target: **2,000 available points**

The reward target follows the existing Nasty Rewards message that 500 signup points equals 25% of a free Beast Burger Meal. Confirm the 10-points-per-A$1 earning rate and redemption/expiry rules with the client before production launch.

## 3. Configure Auth URLs

In Supabase Auth URL Configuration:

- Development Site URL: `http://localhost:3001`
- Add `http://localhost:3001/**` as a development redirect URL if needed.
- Add the real production origin before launch.

### Confirm-signup email template

For cookie-based SSR confirmation, update the **Confirm signup** email template link to:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

The application route verifies the token and establishes the cookie-backed session.

Password recovery uses:

```text
/auth/callback?next=/account/reset-password
```

Make sure the corresponding site origin is included in Supabase's allowed redirect URLs.

## 4. Create the first admin

Create the owner's account through `/account/create`, confirm the email, then run this once in the Supabase SQL editor with the owner's real email:

```sql
insert into public.admin_users(user_id)
select id
from auth.users
where lower(email) = lower('owner@example.com')
on conflict do nothing;
```

The owner can then open:

```text
/admin
```

Do not create a public admin-registration UI. Admin rights come only from `public.admin_users`.

## 5. Admin order flow

The `/admin` dashboard reads orders using the server-only secret key only after the signed-in session is verified as an admin.

Status flow:

```text
Received → Preparing → Ready → Completed
                         ↘ Cancelled
```

Changing the order status also changes the Drip Points state through a PostgreSQL trigger. The browser cannot award itself points.

The dashboard polls for new orders and can enable browser notifications while the dashboard is open.

## 6. Optional external kitchen/admin notification

Supabase is the production order source of truth. External webhook notification is an additional delivery channel.

```env
ORDER_WEBHOOK_URL=https://your-secure-order-receiver.example.com
ORDER_WEBHOOK_SECRET=shared-secret
ORDER_NOTIFICATION_EMAIL=orders@example.com
```

A validated order is saved to Supabase first. If the external webhook fails, the order remains in `/admin` and its `admin_notification_status` is marked `failed` instead of losing the order.

`ORDER_NOTIFICATION_EMAIL` is metadata for the receiver; this application does not directly send email by itself. The receiver can use Resend, Postmark, SendGrid, Slack, SMS or another notification service.

## 7. Local install

After pulling the `dev` branch:

```bash
npm install
npm run dev
```

Then test:

1. create customer account
2. confirm email
3. sign in
4. add a menu item to cart
5. checkout
6. open `/admin` as promoted owner
7. progress the order to `Completed`
8. confirm pending Drip Points become available
9. open the customer order receipt and submit a review

## 8. Production checks before launch

- confirm Drip earning/redemption rules with client
- add production Site URL and redirect URLs in Supabase Auth
- configure production env secrets
- configure order webhook/email/SMS destination if required
- create at least one admin account
- test RLS with two different customer accounts
- test cancelled order points are void
- test reviews are rejected until the order is completed
- test admin access is forbidden to ordinary customer accounts
