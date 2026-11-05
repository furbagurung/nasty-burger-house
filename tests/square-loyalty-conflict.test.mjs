import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');

const source = readFileSync(new URL('../app/lib/square/loyalty.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const phone = '+61400111222';
const input = { customerId: 'web-customer', phone, requestId: 'checkout-id' };
const existing = { id: 'pos-loyalty', customer_id: 'pos-customer', mapping: { phone_number: phone } };
class FakeSquareApiError extends Error {
  constructor(status, detail, code = 'BAD_REQUEST') { super(detail); this.status = status; this.errors = [{ code, detail }]; }
}
function loadWithSquare(squareRequest) {
  const exports = {};
  const normalizeAustralianPhone = value => value.startsWith('0') ? '+61' + value.slice(1) : value.trim();
  const context = {
    exports,
    require(id) {
      if (id === 'server-only') return {};
      if (id === 'node:crypto') return { randomUUID: () => 'test-uuid' };
      if (id === '../loyalty') return { DRIP_SIGNUP_BONUS: 500 };
      if (id === './api') return { SquareApiError: FakeSquareApiError, squareRequest };
      if (id === './customers') return { normalizeAustralianPhone };
      throw new Error(`Unexpected dependency ${id}`);
    },
  };
  vm.runInNewContext(js, context);
  return exports;
}
function queryFrom(init) { return JSON.parse(init.body).query; }

test('existing POS loyalty account is reused by phone despite different customer ID', async () => {
  const calls = [];
  const { findOrCreateSquareLoyaltyAccount } = loadWithSquare(async (path, init) => {
    calls.push({ path, query: queryFrom(init) });
    if (path === '/v2/loyalty/accounts/search') return { loyalty_accounts: [existing] };
    throw new Error('Should not create a new loyalty account');
  });
  const result = await findOrCreateSquareLoyaltyAccount(input);
  assert.equal(result.account.id, existing.id);
  assert.equal(result.created, false);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].query.mappings[0].phone_number, phone);
});

test('creates a fresh loyalty account only after phone and customer searches both miss', async () => {
  const calls = [];
  const { findOrCreateSquareLoyaltyAccount } = loadWithSquare(async (path) => {
    calls.push(path);
    if (path.endsWith('/search')) return { loyalty_accounts: [] };
    if (path.endsWith('/programs/main')) return { program: { id: 'loyalty-program' } };
    if (path === '/v2/loyalty/accounts') return { loyalty_account: { id: 'new-loyalty' } };
    throw new Error('Unexpected path: ' + path);
  });
  const result = await findOrCreateSquareLoyaltyAccount(input);
  assert.equal(result.account.id, 'new-loyalty');
  assert.equal(result.created, true);
  assert.equal(calls.filter(path => path.endsWith('/search')).length, 2);
  assert.equal(calls.filter(path => path === '/v2/loyalty/accounts').length, 1);
});

test('handles Square duplicate-phone race by fetching the newly created account', async () => {
  let searches = 0;
  let creates = 0;
  const { findOrCreateSquareLoyaltyAccount } = loadWithSquare(async (path, init) => {
    if (path.endsWith('/search')) {
      const query = queryFrom(init);
      if (query.mappings) return { loyalty_accounts: searches++ ? [existing] : [] };
      return { loyalty_accounts: [] };
    }
    if (path.endsWith('/programs/main')) return { program: { id: 'loyalty-program' } };
    if (path === '/v2/loyalty/accounts') {
      creates++;
      throw new FakeSquareApiError(400, 'Phone number already associated to a loyalty account.');
    }
    throw new Error('Unexpected path: ' + path);
  });
  const result = await findOrCreateSquareLoyaltyAccount(input);
  assert.equal(result.account.id, existing.id);
  assert.equal(result.created, false);
  assert.equal(searches, 2);
  assert.equal(creates, 1);
});

test('unrelated Square 400 errors still propagate', async () => {
  const { findOrCreateSquareLoyaltyAccount } = loadWithSquare(async (path) => {
    if (path.endsWith('/search')) return { loyalty_accounts: [] };
    if (path.endsWith('/programs/main')) return { program: { id: 'loyalty-program' } };
    if (path === '/v2/loyalty/accounts') throw new FakeSquareApiError(400, 'Invalid phone', 'INVALID_PHONE_NUMBER');
    throw new Error('Unexpected path: ' + path);
  });
  await assert.rejects(findOrCreateSquareLoyaltyAccount(input), /Invalid phone/);
});

test('rejects a mismatched phone mapping from a search result', async () => {
  const { findSquareLoyaltyAccountByPhone } = loadWithSquare(async () => ({
    loyalty_accounts: [{ id: 'other-account', mapping: { phone_number: '+61400999888' } }],
  }));
  assert.equal(await findSquareLoyaltyAccountByPhone(phone), null);
});
