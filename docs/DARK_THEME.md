# Nasty Burger House — Dark Theme Standard

**Scope:** One shared theme system for the public customer website **and** the admin panel. This document is the source of truth for new components and future dark-mode migrations.

**Implementation:** [`app/theme-dark.css`](../app/theme-dark.css) defines tokens and scoped overrides. [`app/components/appearance-provider.tsx`](../app/components/appearance-provider.tsx) uses `next-themes` to persist a user's choice, and [`app/components/theme-toggle.tsx`](../app/components/theme-toggle.tsx) provides the shared shadcn button. `app/layout.tsx` imports the stylesheet **last** so theme overrides win over older page styles.

## Design rules

1. **No pure black.** The lowest background is `#121212`, not `#000000`. Flat surfaces use neutrals, not black shadows.
2. **Desaturate accents 10–20%.** Use the softened brand accent `#D88B7D` on dark surfaces. Preserve original saturated colours in existing food photography and branded graphics; don't apply a global colour filter.
3. **WCAG AA readability.** Normal meaningful text is at least **4.5:1** against its actual background. Non-text controls / focus indicators target 3:1. Test real layered, hovered and disabled states, not only token pairs.
4. **Elevation by lightness:** Canvas `#121212` → surface `#1E1E1E` → raised `#232323` → hover `#2D2D2D`. Keep shadows absent or minimal.
5. **Text hierarchy:** White at **87% opacity** primary, **60%** secondary and hints, **38%** disabled. Disabled controls have a WCAG contrast exception; never convey meaningful instructions or status through disabled text alone.
6. **Scope theme safely.** Light remains the default. Dark styles activate only with `<html class="dark">`. Do not change all legacy backgrounds globally: existing sections use a mix of class styles, images and custom gradients.

## Semantic token reference

| Purpose | CSS custom property | Dark value |
| --- | --- | --- |
| Canvas | `--nb-dark-canvas` | `#121212` |
| Content surface | `--nb-dark-surface` | `#1E1E1E` |
| Elevated / dialog | `--nb-dark-raised` | `#232323` |
| Hover / selected | `--nb-dark-hover` | `#2D2D2D` |
| Divider / field border | `--nb-dark-border` | `#393939` |
| Primary text | `--nb-dark-text-primary` | `rgb(255 255 255 / 87%)` |
| Secondary / hint | `--nb-dark-text-secondary` | `rgb(255 255 255 / 60%)` |
| Disabled text | `--nb-dark-text-disabled` | `rgb(255 255 255 / 38%)` |
| Brand accent | `--nb-dark-accent` | `#D88B7D` |
| Accent hover | `--nb-dark-accent-hover` | `#E39B8E` |
| Text on filled accent | `--nb-dark-accent-ink` | `#121212` |
| Success | `--nb-dark-success` | `#8BBDA0` |
| Warning | `--nb-dark-warning` | `#E3C38C` |
| Error | `--nb-dark-danger` | `#E69A98` |
| Focus ring | `--nb-dark-focus` | `#E3A494` |

Calculated example contrasts on the *canvas*: primary ~**13.3:1**, secondary ~**6.7:1**, brand accent ~**6.6:1**. Disabled is ~**3.3:1** and must not be used as meaningful readable copy. Actual content over images, overlays or different elevation levels needs separate testing.

## How to use

```tsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function Example() {
  return (
    <Card className="nb-theme-surface">
      <CardContent>
        <h2 className="nb-theme-text-primary">Your Drip Points</h2>
        <p className="nb-theme-text-secondary">Your recent rewards activity</p>
        <Button>View history</Button>
      </CardContent>
    </Card>
  );
}
```

Use **shadcn/ui components** (Card, Button, Input, Sheet, Dialog) and the semantic variables already mapped in `theme-dark.css`, rather than putting hex codes directly into components. Do not rely on opacity on a *container*, which unintentionally fades icons, photos and children; use the text colour tokens instead.

## Switching and persistence

- The shared `ThemeToggle` selects **Light** / **Dark**, saved under `nasty-burger-appearance` by `next-themes`.
- Customer desktop: toggle in the top header.
- Customer mobile: toggle under **More** in the bottom app navigation.
- Admin: toggle in the dashboard top bar. The desktop sidebar and mobile navigation Sheet follow the same Light/Dark selection as the rest of the app.
- Choice is shared when moving between public website and admin on the same origin/browser.
- Initial default is **Light**, and system appearance does not override the explicit user choice.

## Adoption scope and visual QA

The stylesheet includes baseline dark-mode treatment for shared shadcn primitives, customer catalogue/product/account/cart/checkout shells, app navigation and admin surfaces. Legacy styles contain explicit light hex values, so this is **the foundation plus initial integration**, not a claim that every page is fully audited or WCAG-certified.

Before production rollout, in **both Light and Dark**, check:
- Home hero, catalogue, product configuration drawers, basket and every checkout step.
- Customer authentication, Profile, order history/detail, reviews, Drip Points, and mobile bottom navigation.
- Admin login, empty dashboard, Customers search/list, Reviews moderation, mobile Sheet, collapsed/expanded sidebar.
- Dialogs, popovers, toast messages, loading skeletons, overlays, cookie preferences, focus states and disabled states.
- Contrast over images and coloured badges; keyboard navigation; **mobile 320–430px**; desktop widths; no horizontal overflow.
- Functional smoke tests: login, cart, checkout, order links, admin moderation and sign-out.
- Confirm **prefers-reduced-motion** and light theme still work.

**Deployment:** Follow project policy: commit to `main`; deploy manually only after explicit approval. A passing source check is not a browser/build test.
