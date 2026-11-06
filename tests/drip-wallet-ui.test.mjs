import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("signed-in Drip wallet keeps Square balance and website activity separate", () => {
  const page = read("app/components/drip-points-page.tsx");
  assert.match(page, /setBalance\(square\?\.balance \?\? activity\.balance\)/);
  assert.match(page, /Website orders and bonuses/);
  assert.match(page, /Square balance can also include in-store activity/);
  assert.match(page, /aria-valuenow=\{Math\.min\(Math\.max\(0, balance\), DRIP_REWARD_TARGET\)\}/);
});

test("rewards do not imply that online redemption is enabled", () => {
  const page = read("app/components/drip-points-page.tsx");
  assert.match(page, /Online redemption is not available yet/);
  assert.match(page, /eligibility is confirmed in-store/);
  assert.match(page, /href="\/menu\/burgers"/);
  assert.match(page, /href="#drip-rewards"/);
});

test("activity expands without truncating the underlying ledger", () => {
  const page = read("app/components/drip-points-page.tsx");
  assert.match(page, /showAllActivity \? ledger : ledger\.slice\(0, 3\)/);
  assert.match(page, /setShowAllActivity\(\(current\) => !current\)/);
  assert.match(page, /entry\.status === "void"/);
});

test("wallet respects theme tokens and shared mobile navigation", () => {
  const page = read("app/components/drip-points-page.tsx");
  const css = read("app/drip-points-wallet.css");
  const layout = read("app/layout.tsx");
  assert.match(page, /<MobileBottomNav active="drip" \/>/);
  assert.match(page, /@\/components\/ui\/card/);
  assert.match(css, /var\(--nb-dark-surface\)/);
  assert.match(css, /var\(--nb-dark-accent\)/);
  assert.match(css, /min-width: 900px/);
  assert.ok(layout.indexOf('import "./drip-points-wallet.css";') < layout.indexOf('import "./theme-dark.css";'));
});
