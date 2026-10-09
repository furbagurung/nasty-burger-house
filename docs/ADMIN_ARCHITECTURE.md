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
