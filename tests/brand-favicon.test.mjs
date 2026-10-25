import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), "utf8");

test("Google gets a PNG favicon larger than 48 pixels", () => {
  const icon = read("app/icon.tsx");
  assert.match(icon, /width: 192, height: 192/);
  assert.match(icon, /contentType = "image\/png"/);
  assert.match(icon, /renderNastyBrandIcon\(size\.width\)/);
});

test("favicon and Apple icon both reuse the current brand artwork", () => {
  const renderer = read("app/lib/brand-icon.tsx");
  assert.match(renderer, /"public", "logo\.webp"/);
  assert.match(renderer, /data:image\/webp;base64/);
  assert.match(renderer, /new ImageResponse\(/);
  const apple = read("app/apple-icon.tsx");
  assert.match(apple, /width: 180, height: 180/);
  assert.match(apple, /contentType = "image\/png"/);
  assert.match(apple, /renderNastyBrandIcon\(size\.width\)/);
});

test("favicon renderer follows the shared dark canvas colour", () => {
  const renderer = read("app/lib/brand-icon.tsx");
  assert.match(renderer, /backgroundColor: "#121212"/);
});

test("existing favicon and customer and admin metadata remain intact", () => {
  const layout = read("app/layout.tsx");
  assert.match(layout, /Nasty Burger House \| Order Pickup Online/);
});
