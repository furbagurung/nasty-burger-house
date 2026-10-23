import test from 'node:test';
import assert from 'node:assert/strict';
import { browserNoiseReason } from '../app/lib/error-alert-policy.ts';

const message = 'Error invoking postMessage: Java object is gone';
const logger = 'iabjs://navigation_performance_logger_android';
const trace = `Error: ${message}\n    at sendDataToNative (${logger}:1:11722)\n    at sendJsBlockingTimeMessage (${logger}:1:16303)`;

test('both reported paths suppress the exact Instagram instrumentation failure', () => {
  for (const path of ['/', '/menu/burgers']) {
    assert.equal(browserNoiseReason({ source: 'client', message, stack: trace, metadata: { filename: logger, path } }), 'instagram-navigation-instrumentation');
  }
});
test('filename-only and rejection stack-only reports are recognized', () => {
  assert.ok(browserNoiseReason({ source: 'client', message, metadata: { filename: logger } }));
  assert.ok(browserNoiseReason({ source: 'client', message, stack: trace }));
});
test('similar application errors and unrelated Instagram errors still alert', () => {
  assert.equal(browserNoiseReason({ source: 'client', message }), undefined);
  assert.equal(browserNoiseReason({ source: 'client', message, stack: 'at checkout (https://example.com/app.js:1:2)' }), undefined);
  assert.equal(browserNoiseReason({ source: 'client', message: 'Cannot read properties of undefined', stack: trace }), undefined);
  assert.equal(browserNoiseReason({ source: 'client', message: `${message} ${logger}` }), undefined);
});
test('critical sources always alert, even with matching noise text', () => {
  for (const source of ['react', 'server', 'checkout']) {
    assert.equal(browserNoiseReason({ source, message, stack: trace }), undefined);
    assert.equal(browserNoiseReason({ source, message: 'ResizeObserver loop limit exceeded' }), undefined);
  }
});
test('only exact routine ResizeObserver warnings skip email', () => {
  for (const message of ['ResizeObserver loop limit exceeded', 'ResizeObserver loop completed with undelivered notifications.', 'ResizeObserver loop completed with undelivered notifications']) {
    assert.equal(browserNoiseReason({ source: 'client', message }), 'resize-observer-notification');
  }
  assert.equal(browserNoiseReason({ source: 'client', message: 'ResizeObserver is not defined' }), undefined);
});
