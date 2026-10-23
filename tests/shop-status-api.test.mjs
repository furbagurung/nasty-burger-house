import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

let mode = 'auto'; let opensAt = '11:30'; let closesAt = '21:45';
let databaseFails = false; let authOk = true; let writes = 0;
const client = { from() {
  let updated;
  const query = {
    select() { return query; }, eq() { return query; },
    update(value) { updated = value; return query; },
    async single() {
      if (databaseFails) return { error: { code: 'unavailable' } };
      if (updated) {
        mode = updated.mode;
        opensAt = updated.opens_at ?? opensAt;
        closesAt = updated.closes_at ?? closesAt;
        writes++;
      }
      return { data: { mode, opens_at: opensAt, closes_at: closesAt, updated_at: '2026-10-23T00:00:00Z' }, error: null };
    },
  };
  return query;
} };
globalThis.__shopTestClient = client;
globalThis.__shopTestAuth = async () => authOk ? { ok: true, user: { id: 'test-admin' }, admin: client } : { ok: false, reason: 'unauthenticated' };
registerHooks({ resolve(specifier, context, next) {
  if (specifier === 'server-only') return { url: 'data:text/javascript,export {}', shortCircuit: true };
  if (specifier.endsWith('/admin-auth')) return { url: 'data:text/javascript,export const verifyAdmin = (...args) => globalThis.__shopTestAuth(...args)', shortCircuit: true };
  if (specifier.endsWith('/supabase/admin')) return { url: 'data:text/javascript,export const getAdminClientOrNull = () => globalThis.__shopTestClient', shortCircuit: true };
  if (specifier.startsWith('@/')) specifier = pathToFileURL(`${process.cwd()}/${specifier.slice(2)}.ts`).href;
  else if (specifier.startsWith('.') && !/\.[a-z]+$/.test(specifier)) specifier += '.ts';
  return next(specifier, context);
} });
const { GET, PATCH } = await import('../app/api/admin/shop-status/route.ts');
const { readShopStatus } = await import('../app/lib/shop-status.ts');
const { getServiceStatus } = await import('../app/lib/service.ts');
const request = (body, origin = 'https://example.com') => new Request('https://example.com/api/admin/shop-status', {
  method: 'PATCH', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
test('admin authorization, validation, saved schedule and safe failure', async () => {
  authOk = false;
  assert.equal((await GET()).status, 401);
  assert.equal((await PATCH(request({ mode: 'closed' }))).status, 401);
  authOk = true;
  assert.equal((await PATCH(request({ mode: 'closed' }, 'https://other.com'))).status, 403);
  for (const hours of [{ opensAt: '22:00', closesAt: '11:00' }, { opensAt: '12:30', closesAt: '12:30' }, { opensAt: '25:00', closesAt: '21:00' }]) {
    assert.equal((await PATCH(request({ mode: 'auto', hours }))).status, 422);
  }
  assert.equal((await PATCH(request({ mode: 'invalid' }))).status, 422);
  assert.equal(writes, 0);
  const changed = await PATCH(request({ mode: 'auto', hours: { opensAt: '10:30', closesAt: '20:15' } }));
  assert.equal(changed.status, 200);
  const snapshot = await changed.json();
  assert.deepEqual(snapshot.hours, { opensAt: '10:30', closesAt: '20:15' });
  assert.equal((await (await GET()).json()).hours.closesAt, '20:15');
  assert.equal(writes, 1);
  const closed = await PATCH(request({ mode: 'closed' }));
  assert.equal((await closed.json()).status.acceptingOrders, false);
  const open = await PATCH(request({ mode: 'open' }));
  assert.equal((await open.json()).status.acceptingOrders, true);
  assert.equal((await (await GET()).json()).hours.opensAt, '10:30');
  assert.equal(writes, 3);
  databaseFails = true;
  assert.equal((await PATCH(request({ mode: 'closed' }))).status, 503);
  assert.equal((await readShopStatus()).acceptingOrders, false);
  assert.equal(writes, 3);
});
test('scheduled hours respect Sydney daylight saving and boundary cutoffs', () => {
  // Sydney is AEDT (UTC+11) on 23 October 2026.
  assert.equal(getServiceStatus(undefined, new Date('2026-10-23T00:29:00Z')).acceptingOrders, false);
  assert.equal(getServiceStatus(undefined, new Date('2026-10-23T00:30:00Z')).acceptingOrders, true);
  assert.equal(getServiceStatus(undefined, new Date('2026-10-23T10:44:00Z')).acceptingOrders, true);
  assert.equal(getServiceStatus(undefined, new Date('2026-10-23T10:45:00Z')).acceptingOrders, false);
});
test('updated schedule changes open/closed labels and cutoff times', () => {
  const settings = {
    mode: 'preview', locationName: 'Belconnen', address: 'Belconnen ACT',
    mapUrl: null, tradingHours: 'daily',
    orderHours: { opensAt: '10:30', closesAt: '20:15' },
    prepTimeMinutes: { minimum: 10, maximum: 15 },
    timezone: 'Australia/Sydney', closedMessage: 'Closed',
  };
  const before = getServiceStatus(settings, new Date('2026-10-22T23:29:00Z'));
  assert.equal(before.acceptingOrders, false);
  assert.match(before.statusLabel, /10:30 AM/);
  assert.equal(getServiceStatus(settings, new Date('2026-10-22T23:30:00Z')).acceptingOrders, true);
  const after = getServiceStatus(settings, new Date('2026-10-23T09:15:00Z'));
  assert.equal(after.acceptingOrders, false);
  assert.match(after.notice, /8:15 PM/);
});
