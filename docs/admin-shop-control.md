# Admin shop control

On `/admin`, choose Scheduled hours, Open manually, or Close manually. Edit the daily opening and closing times using the clock inputs and choose **Save shop settings**.

- **Scheduled hours** automatically accepts new orders between the saved opening and closing times every day, using `Australia/Sydney` (including daylight saving). Default: 11:30 AM–9:45 PM.
- **Open manually** accepts orders even outside those hours. Changing the saved hours does not cancel the manual override.
- **Close manually** blocks new online checkout creation. Customers can browse the menu; existing orders and previously issued Square payment links are not changed.

Opening time must be earlier than closing time on the same day (overnight operating windows are not supported). The admin API validates and persists edits to `shop_control.opens_at` and `shop_control.closes_at`, alongside mode and update metadata. The secure audit trigger records time as well as mode changes.

The server reads the saved schedule for storefront status, banners, checkout, and `/api/orders` on each new order request. Customer interfaces refresh every 15 seconds and on return to the tab. A database-read failure blocks new checkout rather than permitting unsafely stale schedule data.

**Database rollout:** Apply `supabase/migrations/20261023132000_editable_shop_hours.sql` then `supabase/migrations/20261023145311_shop_opening_1130_default.sql` to the same Supabase project before deploying this feature. The later migration updates the schema default and the existing 11:00 AM scheduled opening, while leaving any already-customized opening time untouched.

**Verification:** Run `node --test tests/*.test.mjs`, `npx next typegen`, `npx tsc --noEmit`, and `npm run build`. Check Sydney opening/closing boundary times, manual overrides, both themes, and mobile widths 320–430 px in a browser. No production deployment without explicit approval.
