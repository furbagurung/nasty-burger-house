# Nasty Burger House — Admin Drip Points (Phase 3A)

## Approved scope: read-only Square Loyalty dashboard

`/admin/drip-points` now displays **real Square Loyalty data**, not placeholder figures:

- Searchable Square-enrolled loyalty members: name, email/phone where available, available balance, lifetime points, enrolment date.
- A single flat summary row: member count, combined available/lifetime balances, and number of Square reward tiers.
- Reward program status and reward tiers actually returned by `GET /v2/loyalty/programs/main`. If Square has no tiers, show an explicit empty state rather than inventing rewards.
- Compact member list on mobile and table on desktop, with 20-member client-side pagination.
- Clear connection/error states when member or program data cannot be loaded.

## Data and permission boundary

The protected server page verifies `verifyAdmin()` before calling **read-only** `loadDripOverview()`. The loader reuses the existing Square Customer joining logic from `app/lib/admin-customers.ts` without fetching website orders or the full customer directory. It reads program configuration with the existing `getSquareLoyaltyProgram()` helper.

No browser has access to Square API credentials. No new permissions/role system, loyalty database tables, APIs that write points, or migrations are required. It uses the configured Square environment (Sandbox or Production).

This module does **not** create/reconcile points, grant signup bonuses, alter customer balances, change earning rules, redeem rewards, or backfill accounts. Those actions require a separate owner/manager permission model, verified Square reward contract, audit design, and explicit approval.

The existing Customers integration maps omitted Square balance/lifetime fields to zero for its original UI. The Drip Points wrapper now preserves absent values as **unknown**, and does not report a partial aggregate as a verified total. Do not interpret the admin report as independently reconciled website ledger figures. Square program rules may differ from website marketing copy (such as 10 points/A$1, 2,000-point target); this screen only shows actual program reward tiers.

## Code ownership

```text
app/admin/(workspace)/drip-points/page.tsx
features/admin/drip-points/
  types.ts
  server.ts
  components/drip-overview.tsx
app/lib/admin-customers.ts          Existing Square member joining function
app/lib/square/loyalty.ts           Existing read-only Square program helper
```

The persistent admin layout, Inter font, Light/Dark theme, all ten nav entries, and the content-only shadcn Skeleton are unchanged.

## Verification checklist

1. Run `npm run lint` and `npm run build`.
2. Open `/admin/drip-points` as an authenticated admin, and test unauthenticated redirect.
3. Check Square Loyalty active program returns actual tiers (not website assumed rewards).
4. Search by member name, email, phone and Square customer ID; verify counts, page navigation, 20-per-page limit and empty search.
5. Test Square temporarily disconnected/unauthorized: render an error, not zero totals or fake tiers.
6. Test 320–430px mobile layout, desktop table, keyboard interaction, text zoom, Light/Dark contrast and no public-site changes.
7. Verify nobody can adjust points or issue rewards through this module.
8. Separately verify Menu grid is default, List view works on mobile/desktop, status filters work and Sold Out updates persist and still block ordering.

**No deployment without explicit approval.**
