# Nasty Burger House — Admin Sidebar & Route Plan

**Status:** Navigation implemented. Menu and Drip Points now have dedicated modules; the remaining planned sections are read-only placeholders.

## Approved navigation structure

| Group | Tab | Route | Current status |
| --- | --- | --- | --- |
| **Overview** | Dashboard | `/admin` | Existing secure, intentionally blank dashboard |
| | Analytics | `/admin/analytics` | Protected planned-module page; verified reporting data not yet wired |
| | Customers | `/admin/customers` | Existing real customer management |
| | Reviews | `/admin/reviews` | Existing real review moderation |
| **Business** | Menu | `/admin/menu` | Live Sold Out / Available switches; no product editing |
| | Drip Points | `/admin/drip-points` | Phase 3A: read-only Square members, balances and reward tiers |
| | Promotions | `/admin/promotions` | Protected planned-module page |
| **Management** | Reports | `/admin/reports` | Protected planned-module page |
| | Settings | `/admin/settings` | Protected planned-module page |
| | Team & Access | `/admin/team-access` | Protected planned-module page |

**Orders is intentionally excluded from navigation.** The existing backend order processing and APIs remain unchanged. Do not restore the Orders tab unless explicitly requested.

## Technical architecture

- `features/admin/config/navigation.ts`: one source of truth for **Overview / Business / Management**. `components/admin/layout/` owns the desktop sidebar, mobile shadcn Sheet and top bar; `app/components/admin-workspace-header.tsx` is the persistent controller.
- `components/macos-sidebar.tsx`: existing reusable sidebar, now supporting optional group labels, icon-only collapsed mode, keyboard-focus styles and route highlighting.
- `app/admin/(workspace)/[section]/page.tsx`: one small, server-rendered protected route for the **five remaining planned modules** above. Unknown section slugs return 404. Auth is checked server-side with `verifyAdmin()` before a module screen renders.
- `app/admin/(workspace)/page.tsx`, `app/admin/(workspace)/customers/page.tsx`, `app/admin/(workspace)/reviews/page.tsx`: existing explicit routes take precedence; business logic and moderation remain unchanged.
- `app/components/admin-workspace-footer.tsx`: shared admin-only footer on all authenticated admin pages; no public customer footer.
- `app/admin/(workspace)/loading.tsx`: shared shadcn `Skeleton` route fallback for server-side auth/data loading, with matching nav/topbar/content geometry. No mock business data or fake figures.
- `app/admin-navigation.css`: flat grouped sidebar spacing, common planned-page presentation and responsive skeleton. The theme is still controlled by `docs/DARK_THEME.md`.

### One layout, not ten redesigned pages

All admin routes must keep the same sidebar, header, main-content inset, and dedicated admin footer. New sections start with a simple text notice until their data and operations are real, rather than premature Bento cards, pretend KPIs or disabled mock forms.

### Speed and loading rules

1. Keep navigation and the placeholder pages lightweight; avoid per-page copies of the shared layout and avoid unnecessary client fetching.
2. Use real, server-side data only once it exists; do not add costly background polling to inactive routes.
3. Use the existing shadcn `Skeleton` component for route/loading transitions and real async loading states. Never remove current customer/account skeleton loaders.
4. Show actionable empty/error states after loading, never indefinite skeletons.
5. Paginate/filter larger tables server-side when the backend expands, and lazy-load heavy charts only when Analytics/Reports are implemented.
6. Verify keyboard/focus behavior, collapse animation, responsive mobile Sheet, and WCAG AA contrast in **both Light and Dark**.

## Roadmap

### Phase 1 — navigation and route foundation (implemented; needs browser/build checks)
- Overview: Dashboard, Analytics, Customers, Reviews
- Business: Menu, Drip Points, Promotions
- Management: Reports, Settings, Team & Access
- Auth guards, consistent shell, skeleton fallback, admin-only footer

### Phase 2 — real operational modules (requires feature approval)
- Menu: Sold Out / Available status only (implemented; requires menu availability database migration). Checkout blocks unavailable items
- Drip Points: Phase 3A read-only Square balance/member/reward overview implemented. History, adjustment and redemption operations need separate approval.
- Promotions: scheduled offers with validation and rollback

### Phase 3 — real reporting and management (requires feature approval)
- Analytics: genuine verified activity metrics, not estimates or placeholder numbers
- Reports: auditable datasets, exports and filters; differentiate from analytics visual exploration
- Settings: access-checked business, integration and operating-hour controls
- Team & Access: invitation-only accounts, role checks and audit trails

**Important:** Remaining placeholders have no data features. Review/approve each new backend workflow before exposing writes, managing users or changing production configuration.

## Release checklist

Run `npm run lint` and `npm run build`; manually test direct URL navigation to all ten tabs, unauthenticated redirects, unknown routes returning 404, skeleton loading, mobile and desktop, collapsed/expanded sidebar, Light/Dark, existing Customers & Reviews actions, admin sign-out and customer ordering.

**Policy:** Read `docs/DARK_THEME.md` before design edits. Commit approved changes to GitHub `main`. **Never deploy without explicit approval.**


## Persistent workspace layout (navigation performance)

Admin routes use Next.js route group `app/admin/(workspace)/`, which does not
change their public URL paths. The group's server-authenticated `layout.tsx`
owns the desktop sidebar, mobile Sheet, top header and dedicated admin footer.
This layout is preserved during soft navigation between admin tabs.

- Dashboard, Customers, Reviews, Menu, Drip Points and all five remaining planned modules render **only
  their page-specific `<main>` content**, never duplicate the chrome.
- `(workspace)/loading.tsx` uses shadcn Skeleton for **content only** while a
  new route resolves. The sidebar, collapse state and header remain visible.
- `/admin/login` is outside the group, so it stays an isolated login screen.
- The layout verifies admin membership initially; data pages retain per-route
  verification, and planned modules verify access when their route is loaded.
- `app/admin-typography.css` overrides legacy global `!important` Bowlby
  font rules **only in admin screens**, using Inter for headings and controls.


## Phase 1 modular refactor

The architecture and maintenance boundaries are described in [ADMIN_ARCHITECTURE.md](./ADMIN_ARCHITECTURE.md). Existing Customers and Reviews client components now live under `features/admin/` and reuse `components/admin/shared/admin-metric-card.tsx`. Backward-compatible re-exports remain at their original import paths. Server auth, APIs, CSS, skeleton loaders, markup, and routes remain unchanged.
