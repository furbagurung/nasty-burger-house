import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { squarePickupStatus } from "../app/lib/square/pickup-status.ts";

const pickup = (state, orderState = "OPEN") => ({
  state: orderState,
  fulfillments: [{ type: "PICKUP", state }],
});

test("Square pickup states map to customer-friendly order progress", () => {
  assert.equal(squarePickupStatus(pickup("PROPOSED")), "received");
  assert.equal(squarePickupStatus(pickup("RESERVED")), "preparing");
  assert.equal(squarePickupStatus(pickup("PREPARED")), "ready");
  assert.equal(squarePickupStatus(pickup("COMPLETED")), "completed");
  assert.equal(squarePickupStatus(pickup("CANCELED")), "cancelled");
  assert.equal(squarePickupStatus(pickup("FAILED")), "cancelled");
  assert.equal(squarePickupStatus({ state: "COMPLETED" }), "completed");
  assert.equal(squarePickupStatus({ state: "OPEN" }), "received");
});

test("cancellation overrides previously prepared pickup state", () => {
  assert.equal(squarePickupStatus(pickup("PREPARED", "CANCELED")), "cancelled");
});

test("history sync verifies logged-in identity and paid Square transaction", () => {
  const source = readFileSync(new URL("../app/api/account/orders/sync/route.ts", import.meta.url), "utf8");
  assert.match(source, /auth\.auth\.getUser\(\)/);
  assert.match(source, /order\.metadata\?\.nbh_user_id !== user\.id/);
  assert.match(source, /payment\.status !== "COMPLETED"/);
  assert.match(source, /recordPaidSquareCustomerOrder\(payment, order\)/);
});

test("paid order rows are owner-readable but never client-writable", () => {
  const migration = readFileSync(new URL("../supabase/migrations/202611040001_square_customer_orders.sql", import.meta.url), "utf8");
  assert.match(migration, /enable row level security/);
  assert.match(migration, /grant select on table public\.customer_square_orders to authenticated/);
  assert.doesNotMatch(migration, /grant (insert|update|delete|all) on table public\.customer_square_orders to authenticated/i);
  assert.match(migration, /customer_id = \(select auth\.uid\(\)\)/);
});
