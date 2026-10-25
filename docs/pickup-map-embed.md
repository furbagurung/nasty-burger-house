# Live pickup Google Maps embed

The homepage `Find Us` section now uses an interactive Google Maps iframe instead of the old illustrated preview.

## Source of truth

The owner-provided Maps short link in `app/data/service.ts` (`serviceConfiguration.mapUrl`) is the **only authoritative pickup pin**. Do not reuse old Belconnen coordinates or infer a street address from third-party listings.

The browser requests `GET /api/pickup-map`. The server follows only Google-owned HTTPS map redirects from the configured link, extracts an explicit place coordinate or place query, and returns a URL for `https://www.google.com/maps?q=...&output=embed`. No Google Maps API key is needed.

If Google does not provide a resolvable place or coordinates, the embed is intentionally unavailable rather than showing a potentially wrong location. **Get directions** and **Open in Google Maps** always retain the exact owner-supplied link as a fallback.

## Layout and accessibility

- Responsive iframe in the existing `FindUsSection` component. The surrounding layout and mobile navigation remain unchanged.
- External link opens a new tab with `rel="noopener noreferrer"`.
- The iframe has an accessible title, lazy loading, and a loading/unavailable status.
- Dark UI and focus colors use `--nb-dark-*` semantic tokens from `docs/DARK_THEME.md`.
- CSP in `next.config.ts` already allows framing `https://www.google.com`.

## Verification

Run `node --test tests/pickup-location-preview.test.mjs tests/google-maps-embed.test.mjs` and `npm run build`. Then verify the actual owner pin in the embedded Google Map, and check mobile (320–430px) and desktop, keyboard focus, and both appearance modes. An active network connection to Google Maps is necessary for an interactive map. Avoid deploying until explicitly approved.
