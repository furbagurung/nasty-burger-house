import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

let mode = 'auto'; let databaseFails = false; let authOk = true; let writes = 0;
const client = { from() {
  let updated;
  const query = {
    select() { return query; }, eq() { return query; },
    update(value) { updated = value; return query; },
    async single() {
      if (databaseFails) return { error: { code: 'unavailable' } };
      if (updated) { mode = updated.mode; writes++; }
      return { data: { mode, updated_at: '2026-10-23T00:00:00Z' }, error: null };
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
const request = (body, origin = 'https://example.com') => new Request('https://example.com/api/admin/shop-status', {
  method: 'PATCH', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
test('admin API authorization, origin, validation, save/read, and failure behavior', async () => {
  authOk = false;
  assert.equal((await GET()).status, 401);
  assert.equal((await PATCH(request({ mode: 'closed' }))).status, 401);
  authOk = true;
  assert.equal((await PATCH(request({ mode: 'closed' }, 'https://other.com'))).status, 403);
  assert.equal((await PATCH(request({ mode: 'invalid' }))).status, 422);
  assert.equal(writes, 0);
  const closed = await PATCH(request({ mode: 'closed' }));
  assert.equal(closed.status, 200);
  assert.equal((await closed.json()).status.acceptingOrders, false);
  assert.equal((await (await GET()).json()).mode, 'closed');
  const open = await PATCH(request({ mode: 'open' }));
  assert.equal((await open.json()).status.acceptingOrders, true);
  assert.equal(writes, 2);
  databaseFails = true;
  assert.equal((await PATCH(request({ mode: 'closed' }))).status, 503);
  assert.equal((await readShopStatus()).acceptingOrders, false);
  assert.equal(writes, 2);
});

const { getServiceStatus } = await import('../app/lib/service.ts');
test('scheduled hours respect Sydney opening and closing boundaries', () => {
  // Sydney is AEDT (UTC+11) on this date.
  assert.equal(getServiceStatus(undefined, new Date('2026-10-22T23:59:00Z')).acceptingOrders, false);
  assert.equal(getServiceStatus(undefined, new Date('2026-10-23T00:00:00Z')).acceptingOrders, true);
  assert.equal(getServiceStatus(undefined, new Date('2026-10-23T10:44:00Z')).acceptingOrders, true);
  assert.equal(getServiceStatus(undefined, new Date('2026-10-23T10:45:00Z')).acceptingOrders, false);
});
