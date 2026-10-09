# Nasty Burger House — Admin Typography Standard

**Scope:** The Nasty Burger House admin dashboard, admin login, all Overview / Business / Management routes, mobile shadcn Sheet and admin-only footer.

**Font:** **Inter** (Google Fonts). **Never use Bowlby One SC in the admin panel.** Customer-facing brand typography is managed separately in [FONTS.md](./FONTS.md).

**Source CSS:** [`app/admin-typography.css`](../app/admin-typography.css). This file defines reusable admin-only tokens and applies them to the real components already in use. Add new typography here rather than creating unique sizes and weights on every page.

## Type scale

| Role | CSS token | Size | Weight | Usage |
| --- | --- | --- | --- | --- |
| Page title | `--admin-type-page` | 20px / 1.25rem | 600 | Topbar title, primary page hierarchy |
| Section heading | `--admin-type-section` | 18px / 1.125rem | 600 | Table/list sections, cards when needed |
| Large body | `--admin-type-body-lg` | 16px / 1rem | 400–600 | Explanatory content, accessible text |
| Body | `--admin-type-body` | 14px / 0.875rem | 400 | Standard content and form descriptions |
| Sidebar nav | `--admin-type-nav` | 13px / 0.8125rem | 600 | Expanded sidebar, mobile Sheet links |
| Caption / metadata | `--admin-type-caption` | 12px / 0.75rem | 500 | Timestamps, hints, secondary data |
| Section labels | `--admin-type-label` | 12px / 0.75rem | 700 | OVERVIEW / BUSINESS / MANAGEMENT |
| Large display / KPI | `--admin-type-display` | 24–32px / 1.5–2rem | 600–700 | Genuine KPIs, when data is available |

Existing legacy admin content may use smaller sizes: the scale above is the **standard for new UI**, not a claim that every older selector has already been refactored.

## Weight and line-height tokens

| Token | Value | Usage |
| --- | --- | --- |
| `--admin-font-weight-regular` | 400 | Body text |
| `--admin-font-weight-medium` | 500 | Supporting details |
| `--admin-font-weight-semibold` | 600 | Navigation, headings, controls |
| `--admin-font-weight-bold` | 700 | Brand names and rare emphasis |
| `--admin-font-weight-extrabold` | 800 | Exceptional emphasis only |
| `--admin-leading-tight` | 1.25 | Short headings |
| `--admin-leading-body` | 1.55 | Paragraphs and explanatory text |
| `--admin-leading-data` | 1.4 | Compact figures and metadata |

**Letter spacing:** page titles `-0.025em`, section titles `-0.015em`, normal body `normal`, uppercase group labels `0.06em`. Avoid excessive all-caps or unusually tightly spaced table text.

## Usage example

```tsx
export function AdminSummaryIntro() {
  return (
    <section aria-labelledby="admin-summary-heading">
      <h2 id="admin-summary-heading" className="admin-type-section">
        Customer activity
      </h2>
      <p className="admin-type-body">
        Review your latest customer interactions.
      </p>
      <p className="admin-type-caption">
        Times are shown in Australia/Sydney.
      </p>
    </section>
  );
}
```

These are typography utilities, not layout components. Continue using existing shadcn/ui primitives such as `Card`, `Button`, `Input`, `Label`, `Table`, and `Skeleton` as appropriate.

## Design and accessibility

- **Always follow [DARK_THEME.md](./DARK_THEME.md)** for palette, Light/Dark behavior, elevation and contrast.
- Standard meaningful text needs **WCAG AA 4.5:1** contrast with its actual background. Size/weight alone cannot compensate for insufficient contrast.
- Disabled text uses the established **38%** token and should not convey essential information on its own.
- Do not use all-caps display fonts in the admin. The Nasty Burger House logo artwork can retain its branding.
- Ensure text wraps without truncating important information on mobile; titles, table cells and labels must handle longer content.
- Avoid fixed heights on text-bearing cards that break when browser text is enlarged. Respect browser zoom and system reduced-motion preferences.
- Use **tabular numerals** for monetary amounts, quantities and reporting columns. Align numerical data appropriately in tables.
- Never invent metrics merely to populate a dashboard. The Dashboard page can remain blank until real data exists.

## Implementation and migration

The admin root `.admin-shell.admin-modern`, login/error root `.admin-access-page`, and the portalled mobile sidebar `.admin-jobtracker-mobile-drawer` all use Inter. Headings formerly set to DM Sans in `admin-jobtracker.css`, and the main admin body in `admin-modern.css`, now use Inter as well.

Existing customer `body` and `--font-heading` defaults remain unchanged. Font loading is described in [FONTS.md](./FONTS.md).

Before releasing changes, test `/admin/login`, `/admin`, `/admin/analytics`, `/admin/customers`, `/admin/reviews`, a Business and a Management route, the collapsed sidebar, the mobile Sheet, skeleton loading, form validation, and the admin footer in **both** Light and Dark.

**Required:** `npm run build` and browser verification before production. Never deploy without explicit approval.
