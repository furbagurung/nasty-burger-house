import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const home = source("app/components/order-experience.tsx");
const catalogue = source("app/components/menu-category-page.tsx");
const shared = source("app/components/footer-legal-links.tsx");
const homeCss = source("app/footer-dark.css");
const utilityCss = source("app/footer-utility.css");
const admin = source("app/components/admin-workspace-footer.tsx");

function footerMarkup(document, className) {
  const start = document.indexOf(`<footer className="${className}"`);
  assert.ok(start >= 0, `${className} footer must exist`);
  const end = document.indexOf("</footer>", start);
  assert.ok(end > start, `${className} footer should close`);
  return document.slice(start, end + "</footer>".length);
}

test("home footer contains only brand, shared links and retained developer credit", () => {
  const footer = footerMarkup(home, "site-footer");
  assert.match(footer, /<FooterUtilityLinks\s*\/>/);
  assert.match(footer, /Developed by Furba Gurung/);
  assert.match(footer, /© 2026 Nasty Burger House/);
  assert.match(footer, /alt="Nasty Burger House"/);
  assert.doesNotMatch(footer, /Order now|Pickup available|Uber Eats|Drip Points|Beast of the Month|Big flavour|Pickup ordering only/);
});

test("menu footer uses the same minimal shared links and developer credit", () => {
  const footer = footerMarkup(catalogue, "catalogue-footer");
  assert.match(footer, /<FooterUtilityLinks\s*\/>/);
  assert.match(footer, /Developed by Furba Gurung/);
  assert.match(footer, /© 2026 Nasty Burger House/);
  assert.doesNotMatch(footer, /Order online and collect/);
});

test("shared customer footer links include only legal, consent settings and social profiles", () => {
  const links = shared.slice(shared.indexOf("export function FooterUtilityLinks()"),shared.indexOf("export default function FooterLegalLinks()"));
  assert.match(links, /href="\/privacy-policy"/);
  assert.match(links, /href="\/terms-and-conditions"/);
  assert.match(links, /nasty:open-cookie-settings/);
  assert.match(links, /role="group" aria-label="Nasty Burger House social media"/);
  assert.equal((links.match(/rel="noopener noreferrer"/g) ?? []).length, 3);
  for (const social of ["instagram.com/nastyburgerhouse", "tiktok.com/@nastyburgerhouse", "facebook.com/profile.php"]) {
    assert.ok(links.includes(social), `missing ${social}`);
  }
  assert.doesNotMatch(links, /href="\/help-support"|href="\/reviews"|Order now/);
  assert.match(shared, /Developed by Furba Gurung/);
});

test("footer contrast, compact mobile layout and keyboard focus follow dark theme tokens", () => {
  assert.match(homeCss, /--nb-dark-canvas/);
  assert.match(homeCss, /--nb-dark-text-secondary/);
  assert.match(homeCss, /@media \(max-width: 680px\)/);
  assert.match(homeCss, /padding: 1\.4rem 1\.25rem 6\.5rem/);
  assert.match(utilityCss, /--nb-dark-text-secondary/);
  assert.match(utilityCss, /--nb-dark-focus/);
  assert.match(utilityCss, /:focus-visible/);
  assert.match(utilityCss, /width: 2\.75rem/);
  assert.doesNotMatch(homeCss, /#000(?:000)?\b|#050505|#070707/);
  assert.doesNotMatch(utilityCss, /opacity: 0\.(?:3|4|5|6)/);
});

test("admin workspace footer is not changed by customer-site cleanup", () => {
  assert.match(admin, /Admin workspace/);
  assert.match(admin, /View website/);
  assert.doesNotMatch(admin, /FooterUtilityLinks/);
});
