# Nasty Burger House — Menu Management (Phase 2A)

**Current scope:** Admin-only editing of draft changes to the existing menu catalogue. No live prices, checkout totals, Square payment links, or availability are changed by this feature.

## Why draft-first

`app/data/menu.ts` is currently the source of truth for the customer website **and** for checkout/order validation. Public pages and cart logic import that module directly; changing only an admin database table without migrating those consumers together could allow prices to disagree. Therefore **Menu Management intentionally cannot publish** until the public catalogue, cart display, server-side order validation and Square checkout all use one authoritative published snapshot.

The `/admin/menu` route is real, not a placeholder. It requires existing `verifyAdmin()` membership and uses the persistent admin layout and content-only loading skeleton.

## Available features

- Browse products directly from `app/data/menu.ts` without duplicating canonical IDs.
- Search by name, ID, category, description; filter by category.
- Inspect draft price, availability, status, category, existing product photos.
- Edit draft name, description, price (AUD), existing bundled photo, featured flag and availability. **Save to Supabase**.
- Detect concurrent edits with an optimistic `version` check; outdated saves return HTTP 409.
- Maintain an automatic database history row on every draft insert/update.
- Show a clear setup/error state and disable editing until the database migration is applied.

**Not included:** New product creation, deleting products, category editing, modifiers, combo rules, image uploads, publish/revert, Square catalog synchronization. Product IDs and order modifiers remain immutable.

## Prerequisite: apply the migration

Apply `supabase/migrations/202610090001_admin_menu_drafts.sql` in Supabase **before** trying to save drafts. This is an explicit database operation and should not be performed on production without the owner's approval.

It creates `public.menu_item_drafts`, `public.menu_item_draft_history` and the audit trigger. Both tables have RLS enabled with no customer policies; `anon` and `authenticated` are denied. Draft reads and saves use the **server-only** Supabase secret key after verifying the current admin in `admin_users`. Do not expose `SUPABASE_SECRET_KEY` to client code.

## Code map

```text
app/admin/(workspace)/menu/page.tsx         Protected server page
features/admin/menu/types.ts                Shared draft validation/types
features/admin/menu/server.ts               Server-only draft storage and versioning
features/admin/menu/components/menu-management.tsx
                                            shadcn table + mobile list + edit Sheet
app/api/admin/menu/[itemId]/route.ts         Authorized, validated draft update
supabase/migrations/202610090001_admin_menu_drafts.sql
                                            Tables, permissions, audit trigger
```

## Publish milestone (requires separate approval)

1. Define the **published menu** schema and choose a single authoritative server-side catalogue source.
2. Load published values consistently on Home, category pages, product pages, cart, server-side order validation, order dispatch and Square checkout.
3. Reprice every order on the server and ensure storefront/cart preview matches authoritative published prices. Reject stale/removed/disabled items safely.
4. Plan caching/revalidation, storefront availability, modifier consistency and existing carts when a price changes.
5. Add an audited, permission-gated **Publish** action with preview, rollback and verification.
6. Test live product/box/combo flows end-to-end *before* enabling publishing.

## Local verification

- Run `npm run lint` and `npm run build`.
- Admin unauthorized/anonymous PUT requests are rejected.
- Before migration: /admin/menu shows setup-required and Edit is disabled.
- After migration: save a draft, refresh, verify persistence, edit in second session and test 409 conflict.
- Test invalid ID, overlong text, negative/malformed price, external image URL, missing admin, request too large and service interruptions.
- Check audit rows in `menu_item_draft_history`, light/dark text contrast, collapsed sidebar, mobile Sheet, keyboard navigation.
- Confirm **public** Home/Menu/Product prices and Square checkout remain exactly unchanged after draft edits.

**No deployment without explicit approval.**
