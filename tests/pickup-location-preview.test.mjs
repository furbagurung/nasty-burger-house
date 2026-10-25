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

test("map preview is clearly illustrative and opens the exact link", () => {
  const findUs = source("app/components/find-us-section.tsx");
  assert.match(findUs, /Illustrated preview/);
  assert.match(findUs, /Open Maps for the exact pin/);
  assert.match(findUs, /rel="noopener noreferrer"/);
  assert.match(findUs, /className="find-us-section__map-preview"/);
  assert.doesNotMatch(findUs, /<iframe/);
});

test("admin ordering and service hours are left untouched", () => {
  const service = source("app/data/service.ts");
  assert.match(service, /opensAt: "11:30"/);
  assert.match(service, /closesAt: "21:45"/);
  assert.match(service, /timezone: "Australia\/Sydney"/);
});
