import { verifyAdmin } from "@/app/lib/admin-auth";
import { readShopControl, resolveShopStatus } from "@/app/lib/shop-status";
import { isShopControlMode, isValidShopHours, isValidShopClosures, shopDate, type ShopClosure } from "@/app/lib/shop-control";

const headers = { "Cache-Control": "no-store" };
export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.ok) return Response.json({ error: "Admin access required." }, { status: auth.reason === "unauthenticated" ? 401 : 403, headers });
  const control = await readShopControl();
  if (!control) return Response.json({ error: "Shop status could not be loaded. Please retry." }, { status: 503, headers });
  return Response.json({ ...control, today: shopDate(), status: resolveShopStatus(control) }, { headers });
}
export async function PATCH(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.ok) return Response.json({ error: "Admin access required." }, { status: auth.reason === "unauthenticated" ? 401 : 403, headers });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid request origin." }, { status: 403, headers });
  }
  let input: { mode?: unknown; hours?: unknown; closures?: unknown; updatedAt?: unknown } | null;
  try {
    const raw = await request.text();
    if (raw.length > 32768) return Response.json({ error: "Request too large." }, { status: 413, headers });
    input = JSON.parse(raw);
  } catch { return Response.json({ error: "Invalid request." }, { status: 400, headers }); }
  if (!input || !isShopControlMode(input.mode)) return Response.json({ error: "Choose scheduled, open, or closed." }, { status: 422, headers });
  if (input.hours !== undefined && !isValidShopHours(input.hours)) {
    return Response.json({ error: "Enter valid opening and closing times. Closing must be later than opening." }, { status: 422, headers });
  }
  if (input.closures !== undefined && !isValidShopClosures(input.closures)) return Response.json({ error: "Choose valid, non-overlapping closure dates." }, { status: 422, headers });
  const current = await readShopControl();
  if (!current) return Response.json({ error: "Shop settings unavailable." }, { status: 503, headers });
  if (input.updatedAt !== undefined && input.updatedAt !== current.updatedAt || input.closures !== undefined && input.updatedAt !== current.updatedAt) return Response.json({ error: "Settings changed. Reload and try again." }, { status: 409, headers });
  if (isValidShopClosures(input.closures) && input.closures.some(item => item.start < shopDate() && !current.closures.some(old => old.id === item.id && old.start === item.start && old.end === item.end && old.reason === item.reason))) return Response.json({ error: "New closures cannot start in the past." }, { status: 422, headers });
  const changes: { mode: string; updated_by: string; updated_at: string; opens_at?: string; closes_at?: string; closures?: ShopClosure[] } = {
    mode: input.mode, updated_by: auth.user.id, updated_at: new Date().toISOString(),
  };
  if (input.hours !== undefined && isValidShopHours(input.hours)) {
    changes.opens_at = input.hours.opensAt;
    changes.closes_at = input.hours.closesAt;
  }
  if (isValidShopClosures(input.closures)) changes.closures = input.closures;
  const { data, error } = await auth.admin.from("shop_control").update(changes)
    .eq("id", 1).eq("updated_at", current.updatedAt).select("mode,opens_at,closes_at,updated_at").single();
  if (error || !data) return Response.json({ error: "Could not save shop status. Please retry." }, { status: 503, headers });
  const control = await readShopControl();
  if (!control) return Response.json({ error: "Saved settings could not be verified. Please reload." }, { status: 503, headers });
  return Response.json({ ...control, today: shopDate(), status: resolveShopStatus(control) }, { headers });
}
