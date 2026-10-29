import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

test("profile uses a mobile membership header with real balance and existing reward link", () => {
  const profile = source("app/components/account-profile-page.tsx");
  assert.match(profile, /account-profile-mobile-card/);
  assert.match(profile, /href="\/account\/drip-points"/);
  assert.match(profile, /balance\.toLocaleString\(\)/);
  assert.match(profile, /DRIP_REWARD_TARGET/);
  assert.match(profile, /role="progressbar"/);
  assert.match(profile, /profilePhoto/);
  assert.match(profile, /account-overview-grid account-saas-stats/);
});

test("mobile account menu keeps profile, orders, reviews, password actions intact", () => {
  const profile = source("app/components/account-profile-page.tsx");
  const password = source("app/components/account-change-password.tsx");
  assert.match(profile, /setProfileOpen\(/);
  assert.match(profile, /onSubmit=\{submit\}/);
  assert.match(profile, /href="\/account\/orders"/);
  assert.match(profile, /href="\/account\/reviews"/);
  assert.match(profile, /<AccountChangePassword \/>/);
  assert.match(profile, /account-security__toggle-text/);
  assert.match(password, /account-security__mobile-chevron/);
  assert.match(password, /aria-label=\{open \? "Cancel password change" : "Change password"\}/);
});

test("mobile logout reuses same sign-out logic as desktop", () => {
  const shell = source("app/components/account-dashboard-shell.tsx");
  assert.match(shell, /signOutCurrentCustomer\(\)/);
  assert.match(shell, /router\.push\("\/account\/sign-in"\)/);
  assert.match(shell, /pathname === "\/account" && \([\s\S]*?account-profile-mobile-logout/);
  assert.match(shell, /onClick=\{\(\) => void signOut\(\)\}/);
  assert.match(shell, /Account & Settings/);
});

test("only mobile screen receives flat title-only setting rows with WCAG focus", () => {
  const css = source("app/account-profile-mobile.css");
  const layout = source("app/layout.tsx");
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /account-security__intro > p\s*\{\s*display: none/);
  assert.match(css, /account-security__toggle:focus-visible/);
  assert.match(css, /var\(--ring\)/);
  assert.match(css, /var\(--foreground\)/);
  assert.match(css, /\.dark \.account-saas-layout-page--profile/);
  assert.match(css, /account-profile-mobile-logout/);
  assert.ok(layout.includes('import "./account-profile-mobile.css";'));
});

test("mobile profile shows labels only while retaining informative expanded form feedback", () => {
  const profile = source("app/components/account-profile-page.tsx");
  const css = source("app/account-profile-mobile.css");
  assert.match(profile, /Your activity/);
  assert.match(profile, /Account &amp; security/);
  assert.match(profile, /Security<\/div>/);
  assert.match(css, /account-manage-card__form/);
  assert.match(css, /account-security__form/);
});
