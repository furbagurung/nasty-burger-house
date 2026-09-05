import { verifyAdmin } from "../../../lib/admin-auth";
import { loadAdminOrders } from "../../../lib/admin-orders";

export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    const status =
      auth.reason === "unauthenticated"
        ? 401
        : auth.reason === "forbidden"
          ? 403
          : 503;
    return Response.json(
      { ok: false, reason: auth.reason },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const orders = await loadAdminOrders(auth.admin);
    return Response.json(
      { ok: true, orders },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[NBH admin order feed failed]", error);
    return Response.json(
      { ok: false, reason: "query-failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
