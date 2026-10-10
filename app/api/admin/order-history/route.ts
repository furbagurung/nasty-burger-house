import { verifyAdmin } from "@/app/lib/admin-auth";
import { loadRestaurantOrderPage } from "@/app/lib/admin-square-order-history";

export async function GET(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return Response.json(
      { ok: false, error: "Admin access required." },
      {
        status: auth.reason === "unauthenticated" ? 401 : auth.reason === "forbidden" ? 403 : 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const search = new URL(request.url).searchParams;
  const cursor = search.get("cursor") || undefined;
  const customerId = search.get("customer") || undefined;
  if (
    (cursor && (cursor.length > 2048 || /[\x00-\x1F]/.test(cursor))) ||
    (customerId && !/^[A-Za-z0-9_-]{1,128}$/.test(customerId))
  ) {
    return Response.json(
      { ok: false, error: "Invalid order history filter." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const page = await loadRestaurantOrderPage({ cursor, customerId });
    return Response.json(
      { ok: true, ...page },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[NBH admin order history request failed]", error);
    return Response.json(
      { ok: false, error: "Could not load order history." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
