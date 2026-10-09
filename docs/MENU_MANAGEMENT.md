# Nasty Burger House — Sold Out Management

Only one change can be made from the admin Menu screen: **Sold out ⇄ Available**.
There is no draft editor, price editing, photo editing, product creation or publishing.

## How it works

- The authenticated admin visits `/admin/menu`, searches/filters the existing catalogue, and clicks **Mark sold out** or **Mark available** on an item. A responsive photo **grid** is the default; the Grid / List switch also provides the original table and compact mobile list.
- The status is saved immediately to a dedicated Supabase `menu_availability` table via an admin-only server endpoint. An audit trigger records who changed it and when.
- The customer-facing Home/Menu/Product pages read the same status on a fresh page visit and display Sold out. Product purchase buttons are removed for sold-out items.
- Combo drinks and Beast Box burger/drink options use availability too.
- **Before creating a Square checkout**, the server checks availability again and rejects sold-out line items or sold-out combo/box components. Older saved carts cannot bypass the check.
- Names, prices, photos, original menu IDs and checkout total calculations remain unchanged.

## One-time setup

Apply only `supabase/migrations/202610090002_menu_availability.sql` to your Supabase database **with your approval**. This migration is separate from the old unused drafts migration. No draft storage is required.

The SQL creates `menu_availability` and `menu_availability_audit`, enables RLS, and prevents the public roles from directly reading or editing availability. Only server-side service credentials read it; only `verifyAdmin()`-approved administrators can call the mutation API.

If the migration has not been applied, the admin screen shows a setup note and disables toggles. The public site continues to use the original all-available state, preserving preexisting checkout functionality. If availability fails due to a transient service error after setup, the checkout API rejects the order safely rather than risking an unavailable-item purchase.

## Source locations

```text
app/admin/(workspace)/menu/page.tsx
features/admin/menu/components/menu-management.tsx
app/lib/menu-availability.ts
app/api/admin/menu/[itemId]/route.ts          PATCH
app/api/menu/availability/route.ts            GET (read-only)
supabase/migrations/202610090002_menu_availability.sql
```

Live status is also applied to `app/page.tsx`, `app/menu/[category]/page.tsx`, `app/product/[item]/page.tsx`, `app/components/order-experience.tsx`, `app/components/product-detail-page.tsx`, and `app/api/orders/route.ts`.

## Verification

1. Run `npm run lint` and `npm run build` in the checked-out project.
2. Before applying SQL, verify the setup warning and disabled admin controls.
3. Apply SQL with approval, refresh `/admin/menu`, mark an item sold out, refresh again, and confirm persistence.
4. Open its menu listing and product page in a new browser session; verify Sold out and no add-to-cart action.
5. Try a saved cart containing that item; the checkout API must reject it before Square payment.
6. Mark a **drink** sold out: verify combos and boxes cannot select it, and older carts with that drink cannot check out.
7. Mark a **burger** sold out: verify box selection also excludes it.
8. Restore status and verify ordering works again.
9. Confirm audit rows, non-admin PATCH=403/401, keyboard controls, admin Light/Dark contrast, 320–430px mobile and desktop layouts.

**No automatic deployment and no unapproved production database changes.**
