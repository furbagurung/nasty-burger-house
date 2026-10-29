import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("rewards API returns a non-interactive availability message before auth or Square calls when disabled", () => {
  const source = read("app/api/account/rewards/route.ts");
  const gate = source.indexOf("if (!enabled) {");
  const identityCall = source.indexOf("await verifiedSquareRewardMember()");
  assert.ok(gate > 0 && identityCall > gate);
  const disabledCase = source.slice(gate, identityCall);
  assert.match(disabledCase, /enabled: false/);
  assert.match(disabledCase, /needsPhoneVerification: false/);
  assert.match(disabledCase, /tiers: \[\]/);
  assert.match(disabledCase, /redeem rewards in-store/);
  assert.match(disabledCase, /"Cache-Control": "no-store"/);
});

test("no phone verification control unless provider setup is explicitly enabled", () => {
  const source = read("app/api/account/rewards/route.ts");
  assert.match(source, /process\.env\.SUPABASE_SMS_VERIFICATION_ENABLED === "true"/);
  assert.match(source, /member\.needsPhoneVerification && smsReady/);
  assert.match(source, /Mobile verification is not available yet/);
});

test("missing SMS provider errors are replaced by safe customer guidance", () => {
  const source = read("app/components/checkout-reward-picker.tsx");
  assert.match(source, /sms provider\|phone provider\|phone_provider_disabled/);
  assert.match(source, /SMS verification is unavailable right now/);
  assert.doesNotMatch(source, /setNotice\(error instanceof Error \? error\.message/);
});
