import test from 'node:test';
import assert from 'node:assert/strict';
import { applyShopControl, unavailableShopStatus, isShopControlMode } from '../app/lib/shop-control.ts';
const scheduled = { mode: 'preview', acceptingOrders: true, statusTone: 'preview', statusLabel: 'Preview', notice: 'Preview', address: 'Belconnen', timezone: 'Australia/Sydney' };
test('manual closure blocks scheduled-open orders and keeps location', () => {
  const result = applyShopControl(scheduled, 'closed');
  assert.equal(result.acceptingOrders, false); assert.equal(result.mode, 'closed');
  assert.equal(result.address, 'Belconnen'); assert.match(result.notice, /closed/);
});
test('manual opening overrides closed scheduled hours and preview mode', () => {
  const result = applyShopControl({ ...scheduled, acceptingOrders: false, statusTone: 'closed' }, 'open');
  assert.equal(result.acceptingOrders, true); assert.equal(result.mode, 'open'); assert.equal(result.statusTone, 'open');
});
test('auto restores exact scheduled behavior', () => {
  assert.equal(applyShopControl(scheduled, 'auto'), scheduled);
  const closed = { ...scheduled, acceptingOrders: false };
  assert.equal(applyShopControl(closed, 'auto').acceptingOrders, false);
});
test('unavailable status never falls back to open hours', () => {
  assert.equal(unavailableShopStatus(scheduled).acceptingOrders, false);
});
test('only supported modes are accepted', () => {
  for (const mode of ['auto', 'open', 'closed']) assert.equal(isShopControlMode(mode), true);
  for (const mode of ['', null, undefined, false, 'OPEN', {}, ['open']]) assert.equal(isShopControlMode(mode), false);
});
