import { getServerClientOrNull } from "../../../../lib/supabase/server";
import { refreshSquareCustomerOrderStatus } from "../../../../lib/square/customer-order-sync";
import { consumeRateLimit, requestIp } from "../../../../lib/rate-limit";

/** Recovery path when a Square order webhook is delayed or missed. */
export async function POST(request: Request) {
  const auth = await getServerClientOrNull();
  if (!auth) return Response.json({ ok: false }, { status: 503 });
  const { data: { user }, error: authError } = await auth.auth.getUser();
  if (authError || !user) return Response.json({ ok: false }, { status: 401 });

  const ip = requestIp(request);
  if (ip) {
    const limit = await consumeRateLimit({
      scope: "square-status-refresh",
      key: user.id + ":" + ip,
      limit: 20,
      windowSeconds: 300,
    });
    if (!limit.ok && limit.status === 429) return Response.json({ ok: false }, { status: 429 });
  }

  const { data: active, error } = await auth
    .from("customer_square_orders")
    .select("square_order_id")
    .eq("customer_id", user.id)
    .in("status", ["received", "preparing", "ready"])
    .order("submitted_at", { ascending: false })
    .limit(10);
  if (error) return Response.json({ ok: false }, { status: 503 });

  // No user-supplied Square order IDs. RLS only returns this member's orders.
  const result = await Promise.allSettled(
    (active ?? []).map((entry) => refreshSquareCustomerOrderStatus(entry.square_order_id)),
  );
  const failed = result.filter((entry) => entry.status === "rejected");
  if (failed.length > 0) {
    console.warn("[NBH Square order refresh] Some status updates were delayed.", failed.length);
  }
  return Response.json({ ok: failed.length === 0 }, {
    status: failed.length === 0 ? 200 : 502,
    headers: { "Cache-Control": "no-store" },
  });
}
