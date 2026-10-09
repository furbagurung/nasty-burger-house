import { menuItems } from "@/app/data/menu";
import { verifyAdmin } from "@/app/lib/admin-auth";
import { isMenuDraftValues } from "@/features/admin/menu/types";
import { saveMenuDraft } from "@/features/admin/menu/server";

const responseHeaders = { "Cache-Control": "no-store" };
const MAX_REQUEST_BYTES = 12_000;

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    const status = auth.reason === "unauthenticated" ? 401 : auth.reason === "forbidden" ? 403 : 503;
    return Response.json({ ok: false, error: "Admin access is required." }, { status, headers: responseHeaders });
  }

  const { itemId } = await params;
  if (!menuItems.some((item) => item.id === itemId)) {
    return Response.json({ ok: false, error: "Product not found." }, { status: 404, headers: responseHeaders });
  }

  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_REQUEST_BYTES) {
    return Response.json({ ok: false, error: "Request is too large." }, { status: 413, headers: responseHeaders });
  }

  let payload: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_REQUEST_BYTES) throw new Error("too-large");
    payload = JSON.parse(text);
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON request." }, { status: 400, headers: responseHeaders });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return Response.json({ ok: false, error: "Invalid menu draft." }, { status: 422, headers: responseHeaders });
  }

  const record = payload as Record<string, unknown>;
  const expectedVersion = record.expectedVersion;
  if (!Number.isInteger(expectedVersion) || (expectedVersion as number) < 0 || (expectedVersion as number) > 2147483640 || !isMenuDraftValues(record.values)) {
    return Response.json({ ok: false, error: "Check all fields, including the price, and try again." }, { status: 422, headers: responseHeaders });
  }

  // Images must be selected from bundled, known files. No arbitrary URLs or
  // uploads are accepted by this endpoint.
  const allowedImages = new Set(menuItems.map((item) => item.image ?? null));
  if (!allowedImages.has(record.values.imagePath)) {
    return Response.json({ ok: false, error: "Choose an existing product image." }, { status: 422, headers: responseHeaders });
  }

  const result = await saveMenuDraft(auth.admin, itemId, auth.user.id, record.values, expectedVersion as number);
  if (!result.ok) {
    return Response.json({
      ok: false,
      error: result.reason === "conflict"
        ? "This draft was changed in another session. Refresh before saving."
        : "Could not save this draft. Verify the menu database migration.",
    }, { status: result.reason === "conflict" ? 409 : 503, headers: responseHeaders });
  }
  return Response.json({ ok: true, product: result.product }, { headers: responseHeaders });
}
