import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

test("linking an Australian number is optional and never opens a blocking loyalty modal", () => {
  const account = read("app/components/account-profile-page.tsx");
  assert.match(account, /account-loyalty-inline/);
  assert.match(account, /Optional for now/);
  assert.match(account, /Maybe later/);
  assert.match(account, /nbh-loyalty-link-dismissed:/);
  assert.doesNotMatch(account, /account-loyalty-modal-backdrop/);
  assert.doesNotMatch(account, /Required to activate Square POS Loyalty/);
});

test("customer can still link a number using existing profile save path", () => {
  const account = read("app/components/account-profile-page.tsx");
  assert.match(account, /onSubmit=\{submitPhoneModal\}/);
  assert.match(account, /await saveProfileDetails\("modal"\)/);
  assert.match(account, /updateCurrentCustomer\(/);
  assert.match(account, /New Square members only/);
});

test("checkout only displays Square-confirmed loyalty balance", () => {
  const picker = read("app/components/checkout-reward-picker.tsx");
  assert.match(picker, /loyalty\.source === "square"/);
  assert.match(picker, /loyalty\.enrolled/);
  assert.match(picker, /setSquareBalance\(null\)/);
  assert.doesNotMatch(picker, /2,400/);
  assert.match(picker, /\/api\/account\/loyalty/);
});

test("redemption remains gated and in-store messaging is accurate", () => {
  const picker = read("app/components/checkout-reward-picker.tsx");
  const api = read("app/api/account/rewards/route.ts");
  assert.match(picker, /response\?\.enabled === true/);
  assert.match(picker, /Redeem in-store for now/);
  assert.match(picker, /aria-valuenow=\{available\}/);
  assert.match(picker, /aria-valuemax=\{DRIP_REWARD_TARGET\}/);
  assert.match(api, /process\.env\.SQUARE_ONLINE_REDEMPTION_ENABLED === "true"/);
});

test("loyalty UI follows shared light and dark tokens", () => {
  const css = read("app/loyalty-ui.css");
  const layout = read("app/layout.tsx");
  assert.match(css, /var\(--foreground\)/);
  assert.match(css, /var\(--card\)/);
  assert.match(css, /var\(--ring\)/);
  assert.match(css, /\.dark \.account-loyalty-inline/);
  assert.match(css, /\.dark \.checkout-page/);
  assert.ok(layout.indexOf('import "./loyalty-ui.css";') < layout.indexOf('import "./theme-dark.css";'));
});
