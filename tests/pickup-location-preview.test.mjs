import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (name) => readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
const mapLink = "https://maps.app.goo.gl/PMtpCoAYnScYeiy28";

test("all pickup directions use the owner-provided map link", () => {
  const service = source("app/data/service.ts");
  const findUs = source("app/components/find-us-section.tsx");
  assert.ok(service.includes(mapLink));
  assert.match(findUs, /serviceConfiguration\.mapUrl/);
  assert.match(findUs, /href=\{GOOGLE_MAPS_URL\}/);
  assert.doesNotMatch(findUs, /-35\.2373611|149\.0648333/);
});

test("the previous Belconnen location does not appear in customer pickup UI", () => {
  const service = source("app/data/service.ts");
  const findUs = source("app/components/find-us-section.tsx");
  const mobile = source("app/components/mobile-home-location.tsx");
  assert.doesNotMatch(service, /Belconnen ACT 2617/);
  assert.doesNotMatch(findUs, /Belconnen ACT 2617/);
  assert.doesNotMatch(mobile, /Belconnen ACT 2617/);
});

test("Google Maps iframe replaces illustration and preserves the exact directions link", () => {
  const findUs = source("app/components/find-us-section.tsx");
  const css = source("app/find-us-section.css");
  assert.match(findUs, /<iframe/);
  assert.match(findUs, /src=\{embedUrl\}/);
  assert.match(findUs, /loading="lazy"/);
  assert.match(findUs, /title="Google Maps showing the current Nasty Burger House pickup location"/);
  assert.match(findUs, /href=\{GOOGLE_MAPS_URL\}/);
  assert.match(findUs, /rel="noopener noreferrer"/);
  assert.match(findUs, /className="find-us-section__map-link"/);
  assert.match(css, /--nb-dark-border/);
  assert.match(css, /--nb-dark-focus/);
  assert.doesNotMatch(findUs, /Illustrated preview|find-us-section__map-art/);
});

test("iframe URL resolves only from the owner Maps link, not an old hardcoded pin", () => {
  const mapResolver = source("app/lib/google-maps-embed.ts");
  const apiRoute = source("app/api/pickup-map/route.ts");
  assert.match(mapResolver, /serviceConfiguration\.mapUrl/);
  assert.match(mapResolver, /maps\.app\.goo\.gl/);
  assert.match(mapResolver, /embedUrlFromGoogleMapsLink/);
  assert.match(mapResolver, /redirect: "manual"/);
  assert.match(mapResolver, /embed.searchParams.set\("output", "embed"\)/);
  assert.match(apiRoute, /resolveOwnerPickupEmbed/);
  assert.doesNotMatch(mapResolver, /-35\.2373611|149\.0648333/);
});

test("admin ordering and service hours are left untouched", () => {
  const service = source("app/data/service.ts");
  assert.match(service, /opensAt: "11:30"/);
  assert.match(service, /closesAt: "21:45"/);
  assert.match(service, /timezone: "Australia\/Sydney"/);
});

test("Find Us has one visible CTA and no redundant pickup location block", () => {
  const findUs = source("app/components/find-us-section.tsx");
  const css = source("app/find-us-section.css");
  assert.match(findUs, /Find the truck\./);
  assert.match(findUs, /Open map <span aria-hidden="true">↗<\/span>/);
  assert.match(findUs, /title="Google Maps showing the current Nasty Burger House pickup location"/);
  assert.match(findUs, /aria-label="Open the exact Nasty Burger House pickup location in Google Maps \(new tab\)"/);
  assert.equal((findUs.match(/href=\{GOOGLE_MAPS_URL\}/g) ?? []).length, 1);
  assert.doesNotMatch(findUs, /Pickup spot|Check our latest pin\.|Directions <span|find-us-section__location/);
  assert.doesNotMatch(css, /find-us-section__copy > a|find-us-section__location/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /max-width: 920px/);
});
