import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(
  new URL("../app/lib/admin-loyalty-reconciliation.ts", import.meta.url), "utf8",
);

function fixture({ profiles = [], ledger = [], users = [], aliases = [], square = [], directory = {} } = {}) {
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} };
  const mocks = {
    "server-only": {},
    "./supabase/admin": { getAdminClientOrNull: () => ({}) },
    "./square/loyalty": { listAllSquareLoyaltyAccounts: async () => square },
    "./square/api": {
      squareRequest: async (path) => {
        assert.equal(path, "/v2/customers/bulk-retrieve");
        return { responses: Object.fromEntries(
          Object.entries(directory).map(([id, customer]) => [id, { customer }]),
        ) };
      },
    },
  };
  vm.runInNewContext(transpiled, {
    module, exports: module.exports, require: (name) => {
      if (!(name in mocks)) throw new Error("Unexpected dependency: " + name);
      return mocks[name];
    },
    console, Date, Number, String, JSON, Map, Set,
  }, { filename: "admin-loyalty-reconciliation.cjs" });

  const admin = {
    from(table) {
      return {
        select() {
          if (table === "customer_email_aliases") {
            return { not: async () => ({ data: aliases, error: null }) };
          }
          return Promise.resolve({
            data: table === "customers" ? profiles : table === "drip_ledger" ? ledger : [],
            error: null,
          });
        },
      };
    },
    auth: { admin: { listUsers: async () => ({ data: { users }, error: null }) } },
  };
  return { ...module.exports, admin };
}

test("phone normalization only accepts Australian mobiles", () => {
  const { normalizeAuMobile } = fixture();
  assert.equal(normalizeAuMobile("0408 181 367"), "61408181367");
  assert.equal(normalizeAuMobile("+61 408 181 367"), "61408181367");
  assert.equal(normalizeAuMobile("+61234567890"), "");
});

test("verified email differences compare available, not pending, points", async () => {
  const { loadAdminLoyaltyAudit, admin } = fixture({
    profiles: [{ id: "a", name: "Example Member", email: "person@example.com", phone: "0408181367" }],
    ledger: [
      { customer_id: "a", points: 500, points_status: "available" },
      { customer_id: "a", points: 100, points_status: "pending" },
      { customer_id: "a", points: 200, points_status: "void" },
    ],
    users: [{ id: "a", email_confirmed_at: "2026-10-01" }],
    square: [{
      id: "loyalty-a", customer_id: "square-a",
      balance: 1450, mapping: { phone_number: "+61408181367" },
    }],
    directory: {
      "square-a": { given_name: "Example", family_name: "Member",
        email_address: "person@example.com", phone_number: "+61408181367" },
    },
  });
  const audit = await loadAdminLoyaltyAudit(admin);
  assert.equal(audit.confirmedCount, 1);
  assert.equal(audit.differentCount, 1);
  const match = audit.rows.find((row) => row.websiteId === "a");
  assert.equal(match.status, "different");
  assert.equal(match.websitePoints, 500);
  assert.equal(match.pendingWebsitePoints, 100);
  assert.equal(match.squarePoints, 1450);
  assert.equal(match.difference, 950);
});

test("same phone and name remains a review candidate, not an automatic account merge", async () => {
  const { loadAdminLoyaltyAudit, admin } = fixture({
    profiles: [
      { id: "a", name: "Denil Maharjan", email: "one@example.com", phone: "0408181367" },
      { id: "b", name: "Denil Maharjan", email: "two@example.com", phone: "+61408181367" },
      { id: "test1", name: "Test Furba", email: "test1@example.com", phone: "+61234567890" },
      { id: "test2", name: "Test Furba", email: "test2@example.com", phone: "+61234567890" },
    ],
    users: [{ id: "a", email_confirmed_at: null }, { id: "b", email_confirmed_at: "2026-10-01" }],
    square: [{ id: "sqloyal", customer_id: "sqcus", balance: 1000, mapping: { phone_number: "+61408181367" } }],
    directory: { sqcus: { given_name: "Denil", family_name: "Maharjan", email_address: "pos@example.com" } },
  });
  const audit = await loadAdminLoyaltyAudit(admin);
  assert.equal(audit.duplicatePhones.length, 1);
  assert.equal(audit.duplicatePhones[0].phone, "+61408181367");
  assert.equal(audit.confirmedCount, 0);
  assert.equal(audit.differentCount, 0);
  for (const id of ["a", "b"]) {
    const row = audit.rows.find((entry) => entry.websiteId === id);
    assert.equal(row.status, "review");
    assert.equal(row.match, "phone-and-name");
    assert.equal(row.difference, null);
  }
});

test("Square API failure leaves website balances but no invented comparisons", async () => {
  const { loadAdminLoyaltyAudit, admin } = fixture({
    profiles: [{ id: "a", name: "Customer", email: "person@example.com", phone: "" }],
    ledger: [{ customer_id: "a", points: 500, points_status: "available" }],
    square: [],
  });
  const audit = await loadAdminLoyaltyAudit(admin);
  assert.equal(audit.squareCount, 0);
  assert.equal(audit.rows[0].status, "website-only");
  assert.equal(audit.rows[0].squarePoints, null);
  assert.equal(audit.rows[0].difference, null);
});

test("admin endpoint requires verified admin access", () => {
  const page = readFileSync(
    new URL("../app/admin/(workspace)/customers/loyalty-audit/page.tsx", import.meta.url), "utf8",
  );
  assert.match(page, /verifyAdmin\(\)/);
  assert.match(page, /redirect\("/);
  assert.match(source, /Read-only audit/);
  assert.doesNotMatch(source, /adjustSquareLoyaltyPoints|createSquareLoyaltyAccount|deleteUser/);
});
