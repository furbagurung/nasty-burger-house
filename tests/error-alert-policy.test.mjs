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
test('Hooked product page Instagram unload errors are ignored without masking app failures', () => {
  const hookedTrace = `Error: ${message}\n    at sendDataToNative (${logger}:1:11722)\n    at sendBeforeUnloadMessage (${logger}:1:15376)\n    at ${logger}:1:20806`;
  assert.equal(browserNoiseReason({
    source: 'client',
    message,
    stack: hookedTrace,
    metadata: { filename: logger, line: 1, column: 11722 },
  }), 'instagram-navigation-instrumentation');
  assert.equal(browserNoiseReason({
    source: 'react',
    message,
    stack: hookedTrace,
  }), undefined);
  assert.equal(browserNoiseReason({
    source: 'client',
    message: 'Checkout failed',
    stack: hookedTrace,
  }), undefined);
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

const braveIOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6.1 Mobile/15E148 Safari/604.1 Brave';
const walletMessage = "undefined is not an object (evaluating 'window.ethereum.selectedAddress = undefined')";
const walletError = {
  source: 'client', name: 'TypeError', message: walletMessage,
  path: '/menu/burgers', userAgent: braveIOS,
  metadata: { filename: 'https://www.nastyburgerhouse.com.au/menu/burgers', line: 1, column: 16 },
};
test('suppress exact reported Brave iOS wallet injection, on both canonical domains', () => {
  assert.equal(browserNoiseReason(walletError), 'brave-ios-wallet-instrumentation');
  assert.equal(browserNoiseReason({ ...walletError, metadata: { ...walletError.metadata, filename: 'https://nastyburgerhouse.com.au/menu/burgers' } }), 'brave-ios-wallet-instrumentation');
});
test('suppress only opaque Brave iOS window script errors', () => {
  assert.equal(browserNoiseReason({ source: 'client', name: 'WindowError', message: 'Script error.', userAgent: braveIOS, path: '/menu/burgers', metadata: {} }), 'brave-ios-opaque-script-error');
  assert.equal(browserNoiseReason({ source: 'client', name: 'WindowError', message: 'Script error.', userAgent: braveIOS, metadata: { filename: '', line: undefined } }), 'brave-ios-opaque-script-error');
});
test('keep real website errors, other browsers, and imprecise wallet matches alertable', () => {
  assert.equal(browserNoiseReason({ ...walletError, userAgent: 'Mozilla/5.0 Chrome' }), undefined);
  assert.equal(browserNoiseReason({ ...walletError, metadata: { filename: 'https://evil.example/a.js', line: 1, column: 16 } }), undefined);
  assert.equal(browserNoiseReason({ ...walletError, metadata: { ...walletError.metadata, column: 99 } }), undefined);
  assert.equal(browserNoiseReason({ ...walletError, message: 'Checkout failed' }), undefined);
  assert.equal(browserNoiseReason({ ...walletError, message: 'Cannot read properties of undefined' }), undefined);
  for (const source of ['react', 'server', 'checkout']) {
    assert.equal(browserNoiseReason({ ...walletError, source }), undefined);
    assert.equal(browserNoiseReason({ source, name: 'WindowError', message: 'Script error.', userAgent: braveIOS, metadata: {} }), undefined);
  }
  assert.equal(browserNoiseReason({ source: 'client', name: 'WindowError', message: 'Script error.', userAgent: braveIOS, metadata: { filename: 'https://www.nastyburgerhouse.com.au/app.js', line: 1 } }), undefined);
  assert.equal(browserNoiseReason({ source: 'client', name: 'TypeError', message: 'Script error.', userAgent: braveIOS, metadata: {} }), undefined);
  assert.equal(browserNoiseReason({ source: 'client', name: 'WindowError', message: 'Script error.', userAgent: 'Firefox on Android', metadata: {} }), undefined);
});
