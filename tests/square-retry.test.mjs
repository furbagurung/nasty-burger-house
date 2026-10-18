import test from 'node:test';
import assert from 'node:assert/strict';
import { withSquare429Retry } from '../app/lib/square/retry.ts';
import { getCheckoutRequestId, clearCheckoutRequestId } from '../app/lib/checkout-attempt.ts';

class SquareTestError extends Error {
  constructor(status, retryAfterMs) { super('test'); this.status = status; this.retryAfterMs = retryAfterMs; }
}
test('transient 429s retry twice with increasing delays', async () => {
  const delays = []; let attempts = 0;
  const result = await withSquare429Retry(async () => {
    if (++attempts < 3) throw new SquareTestError(429);
    return 'ok';
  }, { sleep: async ms => delays.push(ms), random: () => 0 });
  assert.equal(result, 'ok'); assert.deepEqual(delays, [500, 1000]);
});
test('400 is never retried', async () => {
  let attempts = 0;
  await assert.rejects(withSquare429Retry(async () => { attempts++; throw new SquareTestError(400); }), e => e.status === 400);
  assert.equal(attempts, 1);
});
test('429 is capped at two retries', async () => {
  let attempts = 0;
  await assert.rejects(withSquare429Retry(async () => { attempts++; throw new SquareTestError(429); }, { sleep: async () => {} }));
  assert.equal(attempts, 3);
});
test('honors Retry-After if within budget and skips excessive wait', async () => {
  const delays = []; let count = 0;
  await withSquare429Retry(async () => { if (!count++) throw new SquareTestError(429, 2000); return true; }, { sleep: async ms => delays.push(ms), random: () => 0 });
  assert.deepEqual(delays, [2000]);
  let attempts = 0;
  await assert.rejects(withSquare429Retry(async () => { attempts++; throw new SquareTestError(429, 10_000); }));
  assert.equal(attempts, 1);
});
test('same checkout payload reuses request ID, changed payload gets a new ID', () => {
  const data = new Map();
  globalThis.window = { sessionStorage: { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k) } };
  const first = getCheckoutRequestId('cart-a');
  const again = getCheckoutRequestId('cart-a');
  const changed = getCheckoutRequestId('cart-b');
  assert.equal(first.requestId, again.requestId);
  assert.notEqual(first.requestId, changed.requestId);
  clearCheckoutRequestId();
  const restarted = getCheckoutRequestId('cart-b');
  assert.notEqual(changed.requestId, restarted.requestId);
});
