import test from 'node:test';
import assert from 'node:assert/strict';
import { wasResendEmailAlreadyAccepted } from '../app/lib/email/resend-idempotency.ts';

test('treats Resend same-key/different-body 409 as a previously accepted email', () => {
  const error = JSON.stringify({
    name: 'invalid_idempotent_request',
    message: "This idempotency key has been used with this HTTP method and endpoint within the last 24 hours, but the request body was modified and doesn't match the original request.",
    statusCode: 409,
  });
  assert.equal(wasResendEmailAlreadyAccepted(409, error), true);
});

test('does not swallow concurrent sends; Square must retry them', () => {
  assert.equal(wasResendEmailAlreadyAccepted(409, JSON.stringify({ name: 'concurrent_idempotent_requests' })), false);
});

test('does not treat unrelated or malformed 409 errors as an accepted email', () => {
  assert.equal(wasResendEmailAlreadyAccepted(409, JSON.stringify({ name: 'other_conflict' })), false);
  assert.equal(wasResendEmailAlreadyAccepted(409, 'not-json'), false);
  assert.equal(wasResendEmailAlreadyAccepted(409, 'null'), false);
  assert.equal(wasResendEmailAlreadyAccepted(409, '{}'), false);
});

test('does not hide authentication, validation, rate-limit, or provider errors', () => {
  for (const status of [400, 401, 403, 422, 429, 500, 503]) {
    assert.equal(wasResendEmailAlreadyAccepted(status, JSON.stringify({ name: 'invalid_idempotent_request' })), false);
  }
});
