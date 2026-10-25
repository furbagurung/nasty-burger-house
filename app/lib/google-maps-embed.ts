import "server-only";

import { serviceConfiguration } from "../data/service";

// The owner's existing Maps short link is the only source of truth for pickup.
// Never substitute an old street address or previously used coordinates.
const OWNER_PIN_URL = serviceConfiguration.mapUrl;

function isGoogleMapsUrl(url: URL) {
  return (
    url.protocol === "https:" &&
    (url.hostname === "maps.app.goo.gl" ||
      /^(?:www\.|maps\.)?google\.com(?:\.au)?$/.test(url.hostname))
  );
}

function validCoordinates(value: string): string | null {
  const match = /^(-?\d{1,3}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)$/.exec(value.trim());
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return null;
  }
  return `${lat},${lng}`;
}

export function embedUrlFromGoogleMapsLink(value: string): string | null {
  let resolved: URL;
  try {
    resolved = new URL(value);
  } catch {
    return null;
  }
  if (!isGoogleMapsUrl(resolved) || resolved.hostname === "maps.app.goo.gl") return null;

  // Actual place coordinates in the Maps data string take priority over the
  // viewport centre (@lat,lng), which may be far away from the marker.
  const data = decodeURIComponent(resolved.pathname + resolved.search);
  const placeCoordinates = /!3d(-?\d{1,3}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/.exec(data);
  const dest = resolved.searchParams.get("destination");
  const query = resolved.searchParams.get("q") ?? resolved.searchParams.get("query");
  const placeSlug = /\/maps\/place\/([^/]+)/.exec(resolved.pathname);
  const placeName = placeSlug
    ? decodeURIComponent(placeSlug[1]).replace(/\+/g, " ").trim()
    : null;

  const target =
    (placeCoordinates && validCoordinates(`${placeCoordinates[1]},${placeCoordinates[2]}`)) ||
    (dest && (validCoordinates(dest) || dest.trim())) ||
    (query && (validCoordinates(query) || query.trim())) ||
    (placeName && placeName !== "null" ? placeName : null);

  if (!target || target.length > 240) return null;
  const embed = new URL("https://www.google.com/maps");
  embed.searchParams.set("q", target);
  embed.searchParams.set("output", "embed");
  return embed.toString();
}

export async function resolveOwnerPickupEmbed(): Promise<string | null> {
  if (!OWNER_PIN_URL) return null;

  // Resolve Google short-link redirects on the server (not in the browser).
  // Restrict every hop to Google-owned Maps hosts to prevent arbitrary fetches.
  let current: URL;
  try {
    current = new URL(OWNER_PIN_URL);
  } catch {
    return null;
  }
  if (!isGoogleMapsUrl(current)) return null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const directEmbed = embedUrlFromGoogleMapsLink(current.toString());
    if (directEmbed) return directEmbed;

    try {
      const response = await fetch(current.toString(), {
        method: "GET",
        redirect: "manual",
        headers: { Accept: "text/html" },
        signal: AbortSignal.timeout(4500),
        cache: "no-store",
      });
      const location = response.headers.get("location");
      if (!location) return embedUrlFromGoogleMapsLink(response.url);
      const next = new URL(location, current);
      if (!isGoogleMapsUrl(next)) return null;
      current = next;
    } catch {
      return null;
    }
  }
  return embedUrlFromGoogleMapsLink(current.toString());
}
