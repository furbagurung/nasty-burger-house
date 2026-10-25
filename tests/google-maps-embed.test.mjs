import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(
  new URL("../app/lib/google-maps-embed.ts", import.meta.url),
  "utf8",
);

// Evaluate the resolver without loading Next's server-only module.
// No external fetch occurs during the unit test.
const javascript = source
  .replace('import "server-only";', "")
  .replace(
    'import { serviceConfiguration } from "../data/service";',
    'const serviceConfiguration = {mapUrl: "https://maps.app.goo.gl/PMtpCoAYnScYeiy28"};',
  )
  .replaceAll("export ", "")
  .replaceAll("url: URL", "url")
  .replaceAll("value: string", "value")
  .replaceAll("): string | null", ")")
  .replaceAll("): Promise<string | null>", ")")
  .replaceAll("let resolved: URL;", "let resolved;")
  .replaceAll("let current: URL;", "let current;");

function loadResolver(fetchMock) {
  return vm.runInNewContext(
    javascript + "\n({ embedUrlFromGoogleMapsLink, resolveOwnerPickupEmbed });",
    { URL, AbortSignal, fetch: fetchMock },
  );
}

test("extracts the real pin from Maps place data, not the viewport", () => {
  const { embedUrlFromGoogleMapsLink } = loadResolver(async () => {
    throw new Error("unexpected network request");
  });
  const expanded = "https://www.google.com/maps/place/Nasty+Burger+House/@-35.200,149.000,17z/data=!4m6!8m2!3d-35.234567!4d149.087654";
  const embed = embedUrlFromGoogleMapsLink(expanded);
  assert.equal(
    embed,
    "https://www.google.com/maps?q=-35.234567%2C149.087654&output=embed",
  );
});

test("accepts Google place names and rejects malicious or unknown URLs", () => {
  const { embedUrlFromGoogleMapsLink } = loadResolver(async () => {
    throw new Error("unexpected network request");
  });
  assert.equal(
    embedUrlFromGoogleMapsLink("https://www.google.com/maps/place/Nasty+Burger+House"),
    "https://www.google.com/maps?q=Nasty+Burger+House&output=embed",
  );
  assert.equal(embedUrlFromGoogleMapsLink("https://evil.example/maps/place/Nasty+Burger+House"), null);
  assert.equal(embedUrlFromGoogleMapsLink("http://www.google.com/maps?q=foo"), null);
  assert.equal(embedUrlFromGoogleMapsLink("https://maps.app.goo.gl/PMtpCoAYnScYeiy28"), null);
});

test("resolves the existing short link through a Google-owned redirect", async () => {
  let requests = 0;
  const { resolveOwnerPickupEmbed } = loadResolver(async (url, options) => {
    requests++;
    assert.equal(url, "https://maps.app.goo.gl/PMtpCoAYnScYeiy28");
    assert.equal(options.redirect, "manual");
    return {
      headers: { get(name) {
        return name === "location"
          ? "https://www.google.com/maps/place/Nasty+Burger+House/data=!8m2!3d-35.234567!4d149.087654"
          : null;
      } },
    };
  });
  assert.equal(
    await resolveOwnerPickupEmbed(),
    "https://www.google.com/maps?q=-35.234567%2C149.087654&output=embed",
  );
  assert.equal(requests, 1);
});

test("fails closed when the owner short link points to an unrelated host", async () => {
  const { resolveOwnerPickupEmbed } = loadResolver(async () => ({
    headers: { get: () => "https://example.net/location" },
  }));
  assert.equal(await resolveOwnerPickupEmbed(), null);
});
