import { verifyAdmin } from "../../../../../lib/admin-auth";

const allowedStatuses = new Set([
  "received",
  "preparing",
  "ready",
  "completed",
  "cancelled",
]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    const status =
      auth.reason === "unauthenticated"
        ? 401
        : auth.reason === "forbidden"
          ? 403
          : 503;
    return Response.json({ ok: false, reason: auth.reason }, { status });
  }

  const { orderId } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const statusValue =
    body && typeof body === "object" && "status" in body
      ? String(body.status)
      : "";

  if (!allowedStatuses.has(statusValue)) {
    return Response.json({ ok: false, error: "Invalid order status." }, { status: 422 });
  }

  const { data, error } = await auth.admin
    .from("orders")
    .update({ status: statusValue })
    .eq("id", decodeURIComponent(orderId))
    .select("id,status,updated_at")
    .maybeSingle();

  if (error) {
    console.error("[NBH admin status update failed]", error);
    return Response.json({ ok: false, error: "Could not update the order." }, { status: 500 });
  }
  if (!data) {
    return Response.json({ ok: false, error: "Order not found." }, { status: 404 });
  }

  // The database trigger synchronises pending/available/void Drip Points from
  // the status transition, so no client-supplied point adjustment is accepted.
  return Response.json({ ok: true, order: data });
}
