import test from "node:test";
import assert from "node:assert/strict";
import { applyScheduledClosures, isValidShopClosures, shopDate, closureReopeningDate } from "../app/lib/shop-control.ts";
const hours = { opensAt: "11:30", closesAt: "21:45" };
const status = { mode: "open", acceptingOrders: true, statusTone: "open", statusLabel: "Open", notice: "Open" };
const closure = { id: "holiday", start: "2026-12-25", end: "2026-12-26", reason: "" };
test("inclusive closure dates expire automatically", () => {
  for (const date of ["2026-12-25", "2026-12-26"]) assert.equal(applyScheduledClosures(status, "auto", hours, [closure], date).acceptingOrders, false);
  for (const date of ["2026-12-24", "2026-12-27"]) assert.equal(applyScheduledClosures(status, "auto", hours, [closure], date).acceptingOrders, true);
  assert.equal(applyScheduledClosures({...status, acceptingOrders: false}, "auto", hours, [closure], "2026-12-27").acceptingOrders, false);
});
test("scheduled closure overrides force open but preserves emergency closure", () => {
  assert.equal(applyScheduledClosures(status, "open", hours, [closure], closure.start).acceptingOrders, false);
  assert.equal(applyScheduledClosures(status, "closed", hours, [closure], "2026-12-27").acceptingOrders, false);
});
test("Sydney calendar boundaries and validation", () => {
  assert.equal(shopDate(new Date("2026-12-24T13:00:00Z")), "2026-12-25");
  assert.equal(shopDate(new Date("2026-07-01T14:00:00Z")), "2026-07-02");
  assert.equal(isValidShopClosures([closure]), true);
  assert.equal(isValidShopClosures([{...closure, start: "2026-02-30"}]), false);
  assert.equal(isValidShopClosures([closure, {...closure, id: "other"}]), false);
  assert.equal(closureReopeningDate(closure, [closure, {...closure, id: "other", start: "2026-12-27", end: "2026-12-28"}]), "2026-12-29");
});
