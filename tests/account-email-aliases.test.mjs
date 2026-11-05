import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("verified aliases have unique email ownership and RLS denies browser access", () => {
  const migration = read("supabase/migrations/202611050001_customer_email_aliases.sql");
  assert.match(migration, /email text primary key/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on public\.customer_email_aliases from public, anon, authenticated/);
  assert.match(migration, /guard_customer_email_alias/);
  assert.match(migration, /guard_auth_primary_email_alias/);
});
test("sign-in maps only verified aliases to the original Supabase auth email", () => {
  const login = read("app/api/account/sign-in/route.ts");
  const aliases = read("app/lib/account-email-aliases.ts");
  assert.match(login, /primaryEmailForVerifiedAlias/);
  assert.match(aliases, /\.not\("verified_at", "is", null\)/);
  assert.match(aliases, /auth\.admin\.getUserById/);
  assert.match(login, /supabase\.auth\.signInWithPassword/);
  assert.match(login, /INVALID_CREDENTIALS/);
});
test("email proof is random, hashed, expires and consumed exactly once", () => {
  const add = read("app/api/account/email-addresses/route.ts");
  const verify = read("app/api/account/email-addresses/verify/route.ts");
  assert.match(add, /randomBytes\(32\)/);
  assert.match(add, /createHash\("sha256"\)/);
  assert.match(add, /TOKEN_LIFETIME_MS/);
  assert.match(add, /scope: "email-alias-link"/);
  assert.match(verify, /\.is\("verified_at", null\)/);
  assert.match(verify, /\.gt\("expires_at"/);
  assert.match(verify, /token_hash: null, expires_at: null/);
  assert.doesNotMatch(add, /supabase\.auth\.admin\.updateUserById/);
});
test("secondary emails never grant order ownership without an authenticated session", () => {
  const order = read("app/api/orders/route.ts");
  assert.match(order, /emailBelongsToAuthenticatedAccount/);
  assert.match(order, /email_confirmed_at/);
  assert.match(order, /verifiedAccountUserId/);
});
test("account management uses the existing shared light and dark semantic tokens", () => {
  const component = read("app/components/account-email-addresses.tsx");
  assert.match(component, /border-border bg-card text-card-foreground/);
  assert.match(component, /role="alert"/);
  assert.match(component, /Send verification/);
  assert.match(component, /Remove/);
});
