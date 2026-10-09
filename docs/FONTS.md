# Nasty Burger House — Font System

**Purpose:** Record which typefaces belong to the customer brand versus the admin SaaS workspace. Use this alongside [TYPOGRAPHY.md](./TYPOGRAPHY.md) and [DARK_THEME.md](./DARK_THEME.md).

## Approved typefaces

| Area | Typeface | Usage | Defined in |
| --- | --- | --- | --- |
| **Admin panel** | **Inter** | All authenticated admin pages, top bar, desktop sidebar, mobile sidebar, tables, forms, account/login and admin-only footer | `app/admin-typography.css` |
| Customer website | **DM Sans** | Current public site body and UI type; do not change during admin work | `app/globals.css` |
| Customer brand/display | **Bowlby One SC** | Existing food/brand display typography on public pages only | `app/globals.css` |
| Existing monospace | **Geist Mono** | Monospace utility where explicitly needed | `app/layout.tsx` |

**Decision:** Do **not** use Bowlby One SC or DM Sans for admin interface typography. They remain in the public customer site unless a separate public redesign is approved.

## Loading and CSS variables

In `app/layout.tsx` the typefaces are supplied via `next/font/google`. The Inter instance uses:

```tsx
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});
```

The `--font-inter` variable is available at the HTML root so the shadcn mobile `Sheet` portal, which renders outside the admin content tree, can use the same font. Inter is **only referenced by admin-specific CSS** so customer pages are not switched to Inter. `preload: false` avoids a global font preload solely for admin. Next.js processes and self-hosts the Google Font as part of the build; the browser does not need to request the font from Google Fonts at runtime.

```css
.admin-shell.admin-modern {
  font-family: var(--font-inter), Arial, Helvetica, sans-serif;
}
```

Use `--admin-font-family` within admin components; it is already defined on the admin root and mobile Sheet by `app/admin-typography.css`. Fall back to Arial / Helvetica / sans-serif if a font is unavailable.

## Font usage rules

- **Admin UI:** Inter for headlines, descriptions, labels, numbers, buttons, tables, inputs, tooltips, empty states and loaders.
- **Recommended weights:** 400 regular, 500 medium, 600 semibold, 700 bold, 800 extra bold (rarely). Avoid simulated ultra-heavy 900/1000 styles in newly created admin components.
- **Numerical data:** use `font-variant-numeric: tabular-nums;` for quantities and analytics.
- **Never force all public pages to Inter.** Avoid changing global `body`, `--font-sans`, or customer `--font-heading` tokens for an admin-specific request.
- **Never link remote font CSS in the browser.** Follow the existing Next.js `next/font` setup.
- **Avoid manual font-file uploads or copying licensed files** into source code unless specifically authorized.

## Official references

- [Inter on Google Fonts](https://fonts.google.com/specimen/Inter)
- [DM Sans on Google Fonts](https://fonts.google.com/specimen/DM+Sans)
- [Bowlby One SC on Google Fonts](https://fonts.google.com/specimen/Bowlby+One+SC)
- [Geist Mono on Google Fonts](https://fonts.google.com/specimen/Geist+Mono)

All are available through Google Fonts; refer to their published licenses and font metadata for redistribution and licensing details.

## Check after changes

1. Inspect computed font family on `/admin/login`, `/admin`, Customers, Reviews and a new module route.
2. Open the shadcn mobile sidebar and verify Inter, including close, links and logout.
3. Confirm no Bowlby One SC text is used in admin headings or data.
4. Check that customer site branding is visually unchanged.
5. Test direct route load, hydration, font swap and layout shift at 320–430px and desktop widths.
6. Check Light/Dark contrast separately; type family does not replace [DARK_THEME.md](./DARK_THEME.md) contrast rules.

**Deployment remains manual and requires explicit approval.**
