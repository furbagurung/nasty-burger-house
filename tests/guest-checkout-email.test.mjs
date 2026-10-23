import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith(".") && !/\.[a-z]+$/.test(specifier)) {
      specifier += ".ts";
    }
    return next(specifier, context);
  },
});

const { validateOrderPayload } = await import("../app/lib/order.ts");

function guestOrder(email) {
  return {
    requestId: "guest-email-123456",
    customer: { name: "Guest Customer", ...(email === undefined ? {} : { email }), phone: "0412345678" },
    notes: "",
    pickupMethod: "asap",
    paymentMethod: "square_checkout",
    cart: [{
      lineId: "og-nasty-guest",
      itemId: "og-nasty",
      quantity: 1,
      combo: false,
      modifiers: [],
      removedIngredients: [],
      boxBurgers: [],
      boxDrinks: [],
    }],
    clientSubtotal: 19,
  };
}

test("guest checkout requires an email address even when name, phone and cart are valid", () => {
  for (const email of [undefined, "", " ", "\t  "]) {
    const result = validateOrderPayload(guestOrder(email));
    assert.equal(result.ok, false);
    assert.ok(result.errors.some(message => /email address is required/i.test(message)));
  }
});

test("guest checkout rejects malformed email before creating a Square order", () => {
  for (const email of ["test", "guest@domain", "guest@@example.com", "guest @example.com"]) {
    const result = validateOrderPayload(guestOrder(email));
    assert.equal(result.ok, false);
    assert.ok(result.errors.some(message => /valid email address/i.test(message)));
  }
});

test("guest checkout accepts a valid email and normalizes it for Square", () => {
  const result = validateOrderPayload(guestOrder("  Guest.Customer@Example.COM  "));
  assert.equal(result.ok, true, result.ok ? undefined : result.errors.join("; "));
  assert.equal(result.order.customer.email, "guest.customer@example.com");
});
