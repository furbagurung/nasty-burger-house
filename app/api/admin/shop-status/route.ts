import { verifyAdmin } from "@/app/lib/admin-auth";
import { readShopControl, readShopStatus } from "@/app/lib/shop-status";
import { isShopControlMode } from "@/app/lib/shop-control";

const headers = { "Cache-Control": "no-store" };
export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.ok) return Response.json({ error: "Admin access required." }, { status: auth.reason === "unauthenticated" ? 401 : 403, headers });
  const control = await readShopControl();
  if (!control) return Response.json({ error: "Shop status could not be loaded. Please retry." }, { status: 503, headers });
  return Response.json({ ...control, status: await readShopStatus() }, { headers });
}
export async function PATCH(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.ok) return Response.json({ error: "Admin access required." }, { status: auth.reason === "unauthenticated" ? 401 : 403, headers });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid request origin." }, { status: 403, headers });
  }
  let mode: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 512) return Response.json({ error: "Request too large." }, { status: 413, headers });
    mode = (JSON.parse(raw) as { mode?: unknown } | null)?.mode;
  } catch { return Response.json({ error: "Invalid request." }, { status: 400, headers }); }
  if (!isShopControlMode(mode)) return Response.json({ error: "Choose scheduled, open, or closed." }, { status: 422, headers });
  const { data, error } = await auth.admin.from("shop_control").update({ mode, updated_by: auth.user.id, updated_at: new Date().toISOString() })
    .eq("id", 1).select("mode,updated_at").single();
  if (error || !data) return Response.json({ error: "Could not save shop status. Please retry." }, { status: 503, headers });
  return Response.json({ mode: data.mode, updatedAt: data.updated_at, status: await readShopStatus() }, { headers });
}
