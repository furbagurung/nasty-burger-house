# Nasty Burger House — Modular Admin Architecture

**Phase 1:** Structural refactor only. No UI, route, auth, API, data, or business-logic changes.

## Source of truth

Follow [DARK_THEME.md](./DARK_THEME.md), [TYPOGRAPHY.md](./TYPOGRAPHY.md), [FONTS.md](./FONTS.md) and [ADMIN_SIDEBAR_PLAN.md](./ADMIN_SIDEBAR_PLAN.md).

## Directory ownership

```text
app/admin/(workspace)/
  layout.tsx                  Auth-protected persistent sidebar/header/footer
  loading.tsx                 Content-only shadcn Skeleton
  customers/page.tsx          Existing secure data loader
  reviews/page.tsx            Existing secure data loader
  [section]/page.tsx          Protected planned modules

features/admin/
  config/navigation.ts        Typed Overview / Business / Management groups
  customers/components/       Customer client feature (search, filters, metrics)
  reviews/components/         Review client feature (moderation and filters)

components/admin/
  layout/admin-desktop-sidebar.tsx
  layout/admin-mobile-sidebar.tsx
  layout/admin-topbar.tsx
  shared/admin-metric-card.tsx

app/components/
  admin-workspace-header.tsx  Persistent controller/facade
  admin-workspace-footer.tsx  Dedicated admin footer
  admin-customer-dashboard.tsx  Compatibility re-export
  admin-review-dashboard.tsx    Compatibility re-export
  admin-metric-card.tsx         Compatibility re-export

app/lib/                      Existing server-only admin services unchanged
app/api/                      Existing endpoints unchanged
```

### Contracts

- Keep nav order, links, mobile shadcn Sheet, macOS collapse behavior, brand, logout, animations, accessibility, theme toggle and current class names unchanged.
- Keep all auth, Supabase/Square calls and permission checks on the existing server route/data paths.
- Keep Customers filtering/search and Reviews moderation behavior unchanged; no new mock data.
- Keep the shell mounted during tab changes, with Skeleton restricted to the page content.
- Reuse shadcn/ui and existing shared UI; no Bento redesign.
- Only add new modules with verified data/contracts and explicit feature approval.

### Verification

Run `npm run lint`, `npm run build`; test all admin routes, auth redirects, login/logout, Customers and Reviews actions, Light/Dark, keyboard access, collapse/mobile, skeletons and customer checkout. Source checks do not replace running a full build.

**Never deploy without explicit approval.**


## Menu Management: availability-only module

The Menu module now supports only Sold Out / Available. The `features/admin/menu/components/menu-management.tsx` UI, server-only `app/lib/menu-availability.ts`, admin `PATCH /api/admin/menu/[itemId]` and dedicated migration form a single simple availability workflow. No draft editing, publishing, item creation or product-price updates remain.

The public Home/Menu/Product pages use the same status on fresh requests and `POST /api/orders` validates it again before Square checkout. The existing protected shell, navigation, skeletons, Inter typography, Light/Dark themes and unrelated admin features remain intact.

Details: [MENU_MANAGEMENT.md](./MENU_MANAGEMENT.md).


## Phase 3A — read-only Drip Points

`app/admin/(workspace)/drip-points/page.tsx` is a protected, dynamic route under the persistent admin shell. `features/admin/drip-points/server.ts` joins the existing `loadAdminSquareLoyaltyMembers()` customer loader with `getSquareLoyaltyProgram()`. The lightweight server DTO in `features/admin/drip-points/types.ts` drives `components/drip-overview.tsx`, a responsive, searchable and locally paginated read-only view.

No new loyalty ledger, reward assumptions, migrations, balance mutations, point backfills or Square adjustment API endpoints have been added. Square failures are surfaced explicitly instead of displaying fabricated figures. See [DRIP_POINTS_ADMIN.md](./DRIP_POINTS_ADMIN.md).

## Menu grid/list presentation

The existing `features/admin/menu/components/menu-management.tsx` now starts in a responsive image-card **grid** based on the supplied reference. A shadcn button-group switch offers the original **list** presentation. Both call the same authorized Sold Out / Available endpoint; this does not modify any menu or checkout business logic.
