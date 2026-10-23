# Admin shop control

On `/admin`, select an ordering mode and choose **Save shop status**.

- **Scheduled hours** uses the existing daily 11:00 AM–9:45 PM Australia/Sydney ordering window.
- **Open manually** accepts new online orders even outside scheduled hours.
- **Close manually** blocks new checkout creation. Menu browsing, existing orders, and previously issued Square payment links remain available.

Manual choices persist until changed. Reloading the dashboard reads the saved setting. The storefront announcement and checkout refresh every 15 seconds and when returning to the tab. `/api/orders` reads the setting on each new checkout request. Database-read failures pause new checkout creation rather than falling back to scheduled-open hours.

`shop_control` stores one row; mode changes are recorded atomically by a trigger in `shop_control_audit`. Browser/database roles have no direct access. The server API checks admin membership and same-origin mutation requests. The migration defaults to `auto`, preserving current business behavior before deployment.

Validation: `node --test tests/*.test.mjs`; `npx next typegen`; `npx tsc --noEmit`.
