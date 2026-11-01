import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith(".") && !/\.[a-z]+$/.test(specifier)) {
      specifier += ".ts";
    }
    return next(specifier, context);
  },
});

const { menuItems, modifierChoices, glutenFreeBunPrice } = await import("../app/data/menu.ts");
const { calculateLineUnitPrice, calculateCartSubtotal, validateOrderPayload, describeBoxBurgers } =
  await import("../app/lib/order.ts");
const { cartConfigurationKey, mergeIdenticalCartLines } = await import("../app/lib/cart-lines.ts");

function lineFor(itemId, changes = {}) {
  const item = menuItems.find((candidate) => candidate.id === itemId);
  assert.ok(item, itemId);
  return {
    lineId: "bun-" + itemId,
    itemId,
    quantity: 1,
    combo: false,
    modifiers: [],
    removedIngredients: [],
    boxBurgers: item.boxConfig ? Array(item.boxConfig.burgerCount).fill("og-nasty") : [],
    boxDrinks: item.boxConfig ? Array(item.boxConfig.drinkCount).fill("Coke") : [],
    ...changes,
  };
}

function payload(cart) {
  return {
    requestId: "bun-test-request-123456",
    customer: { name: "Bun Test", email: "test@example.com", phone: "0412345678" },
    notes: "",
    pickupMethod: "asap",
    paymentMethod: "square_checkout",
    cart,
    clientSubtotal: calculateCartSubtotal(cart),
  };
}

test("all burgers, including Monster Cheese, offer a $3 per-burger bun upgrade", () => {
  assert.equal(glutenFreeBunPrice, 3);
  const burgers = menuItems.filter((item) => item.category === "burgers" || item.id === "monster-cheese");
  assert.ok(burgers.length >= 6);
  for (const item of burgers) {
    assert.equal(calculateLineUnitPrice(lineFor(item.id, { bun: "regular" }), item), item.price);
    assert.equal(calculateLineUnitPrice(lineFor(item.id, { bun: "gluten-free" }), item), item.price + 3);
    assert.equal(validateOrderPayload(payload([lineFor(item.id, { bun: "gluten-free" })])).ok, true);
  }
});

test("solo, duo and family boxes charge for each changed bun, including family kid burger", () => {
  const boxes = menuItems.filter((item) => Boolean(item.boxConfig));
  assert.equal(boxes.length, 3);
  for (const box of boxes) {
    const bunCount = box.boxConfig.burgerCount + (box.boxConfig.fixedBurgerIds?.length ?? 0);
    const allGlutenFree = lineFor(box.id, { boxBuns: Array(bunCount).fill("gluten-free") });
    assert.equal(Math.round(calculateLineUnitPrice(allGlutenFree, box) * 100), Math.round((box.price + bunCount * 3) * 100));
    assert.equal(validateOrderPayload(payload([allGlutenFree])).ok, true);
    assert.equal(describeBoxBurgers(allGlutenFree, box).length, bunCount);
    assert.ok(describeBoxBurgers(allGlutenFree, box).every((name) => name.includes("gluten-free bun")));
  }
  assert.deepEqual(menuItems.find((item) => item.id === "family-beast-box").boxConfig.fixedBurgerIds, ["monster-cheese"]);
});

test("cart totals charge each upgraded bun for every quantity and reject tampering", () => {
  const cart = [
    lineFor("og-nasty", { bun: "gluten-free", quantity: 3 }),
    lineFor("solo-beast-box", { boxBuns: ["gluten-free"], quantity: 2 }),
  ];
  assert.equal(calculateCartSubtotal(cart), 141.98);
  assert.equal(validateOrderPayload(payload(cart)).ok, true);
  const forged = { ...payload(cart), clientSubtotal: 19 * 3 + 34.99 * 2 };
  const result = validateOrderPayload(forged);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((message) => /total changed/i.test(message)));
});

test("legacy regular-bun carts still validate and preserve the base price", () => {
  const line = lineFor("duo-beast-box");
  const item = menuItems.find((candidate) => candidate.id === line.itemId);
  assert.equal(calculateLineUnitPrice(line, item), item.price);
  assert.equal(validateOrderPayload(payload([line])).ok, true);
});

test("server rejects invalid bun counts, unsafe choices and old bacon extras", () => {
  assert.ok(!modifierChoices.some((modifier) => modifier.id === "bacon"));
  for (const badLine of [
    lineFor("og-nasty", { bun: "free" }),
    lineFor("duo-beast-box", { boxBuns: ["gluten-free"] }),
    lineFor("og-nasty", { modifiers: [{ id: "bacon", quantity: 1 }] }),
    lineFor("nasty-fries", { bun: "gluten-free" }),
  ]) {
    const result = validateOrderPayload(payload([badLine]));
    assert.equal(result.ok, false);
  }
});

test("cart merges only identical preparations and keeps box bun order", () => {
  const regular = lineFor("og-nasty", { bun: "regular", lineId: "a" });
  const gf = lineFor("og-nasty", { bun: "gluten-free", lineId: "b" });
  assert.notEqual(cartConfigurationKey(regular), cartConfigurationKey(gf));
  const merged = mergeIdenticalCartLines([gf, { ...gf, lineId: "c" }, regular]);
  assert.equal(merged.length, 2);
  assert.equal(merged.find((entry) => entry.bun === "gluten-free").quantity, 2);
  const box = lineFor("duo-beast-box", { boxBuns: ["regular", "gluten-free"] });
  assert.notEqual(cartConfigurationKey(box), cartConfigurationKey({ ...box, boxBuns: ["gluten-free", "regular"] }));
});

test("Square checkout uses server calculated unit prices and includes bun preparation in its line notes", () => {
  const source = readFileSync(new URL("../app/lib/square/checkout.ts", import.meta.url), "utf8");
  assert.match(source, /toCents\(line\.unitPrice\)/);
  assert.match(source, /line\.bun/);
  assert.match(source, /Gluten-free bun/);
  assert.match(source, /line\.beastBox\.burgers/);
  const paid = readFileSync(new URL("../app/lib/square/paid-order-notifications.ts", import.meta.url), "utf8");
  assert.match(paid, /bun: null/);
});

test("shared bun selector is accessible, compact on mobile, and avoids lengthy footer copy", () => {
  const component = readFileSync(new URL("../app/components/bun-choice-selector.tsx", import.meta.url), "utf8");
  const product = readFileSync(new URL("../app/components/product-detail-page.tsx", import.meta.url), "utf8");
  const homepage = readFileSync(new URL("../app/components/order-experience.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../app/product-customization-groups.css", import.meta.url), "utf8");

  assert.match(component, /<fieldset className="product-bun-section">/);
  assert.match(component, /<legend>Choose your bun<\/legend>/);
  assert.match(component, /type="radio"/);
  assert.match(component, /checked=\{selected\}/);
  assert.match(component, /onChange=\{\(\) => onChange\(choice\)\}/);
  assert.match(component, /Gluten-free bun/);
  assert.doesNotMatch(component, /Bun option only|shared preparation/i);
  assert.match(product, /<BunChoiceSelector/);
  assert.match(homepage, /<BunChoiceSelector/);
  assert.doesNotMatch(product, /Other ingredients or shared preparation may contain gluten/);
  assert.doesNotMatch(homepage, /Other ingredients or shared preparation may contain gluten/);
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /\.product-bun-options \{ grid-template-columns: minmax\(0, 1fr\)/);
  for (const token of ["--foreground", "--card", "--hot", "--ring"]) {
    assert.ok(css.includes(`var(${token})`), `Missing theme token ${token}`);
  }
});
