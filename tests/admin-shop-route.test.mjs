import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Shop appears in the shared desktop and mobile navigation", () => {
  const navigation = source("features/admin/config/navigation.ts");
  assert.match(navigation, /"shop"\s*,/);
  assert.match(navigation, /id: "shop", label: "Shop", href: "\/admin\/shop", icon: Store/);
  assert.match(source("components/admin/layout/admin-desktop-sidebar.tsx"), /import \{ sections/);
  assert.match(source("components/admin/layout/admin-mobile-sidebar.tsx"), /import \{ navigationGroups/);
});

test("Shop has a dedicated authenticated route using the existing control", () => {
  const page = source("app/admin/(workspace)/shop/page.tsx");
  assert.match(page, /verifyAdmin\(\)/);
  assert.match(page, /redirect\("\/admin\/login\?return=\/admin\/shop"\)/);
  assert.match(page, /<AdminShopControl \/>/);
});

test("Dashboard retains sales and no longer mounts the shop control", () => {
  const dashboard = source("app/admin/(workspace)/page.tsx");
  assert.match(dashboard, /<SalesOverview /);
  assert.doesNotMatch(dashboard, /AdminShopControl|admin-shop-control-container/);
});

test("Shop controls preserve the authenticated settings endpoint and modes", () => {
  const control = source("app/components/admin-shop-control.tsx");
  assert.match(control, /fetch\("\/api\/admin\/shop-status"/);
  assert.match(control, /method: "PATCH"/);
  assert.match(control, /body: JSON\.stringify\(\{ mode: selected, hours \}\)/);
  for (const mode of ["auto", "open", "closed"]) {
    assert.ok(control.includes(`mode: "${mode}"`));
  }
});
