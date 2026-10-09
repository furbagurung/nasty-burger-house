import { menuItems } from "@/app/data/menu";
import { verifyAdmin } from "@/app/lib/admin-auth";
import { readMenuAvailability } from "@/app/lib/menu-availability";

const headers = { "Cache-Control": "no-store" };

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    const status = auth.reason === "unauthenticated" ? 401 : auth.reason === "forbidden" ? 403 : 503;
    return Response.json({ ok: false, error: "Admin access required." }, { status, headers });
  }

  // A cookie-authenticated state change must be initiated from this origin.
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ ok: false, error: "Invalid request origin." }, { status: 403, headers });
  }
  const { itemId } = await params;
  if (!menuItems.some((item) => item.id === itemId)) {
    return Response.json({ ok: false, error: "Menu item not found." }, { status: 404, headers });
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 512) return Response.json({ ok: false, error: "Request too large." }, { status: 413, headers });
    body = JSON.parse(raw);
  } catch {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400, headers });
  }
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      typeof (body as Record<string, unknown>).soldOut !== "boolean") {
    return Response.json({ ok: false, error: "Choose Sold out or Available." }, { status: 422, headers });
  }

  const ready = await readMenuAvailability();
  if (!ready.ok) {
    return Response.json({ ok: false, error: ready.reason === "setup-required"
      ? "Apply the menu availability SQL migration before updating products."
      : "Menu availability could not be checked. Try again." },
      { status: 503, headers });
  }

  const soldOut = (body as { soldOut: boolean }).soldOut;
  const { error } = await auth.admin.from("menu_availability").upsert({
    item_id: itemId,
    is_sold_out: soldOut,
    updated_by: auth.user.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: "item_id" });

  if (error) {
    console.error("[NBH sold-out update failed]", error.code);
    return Response.json({ ok: false, error: "Could not save availability. Try again." }, { status: 503, headers });
  }

  return Response.json({ ok: true, itemId, soldOut }, { headers });
}
