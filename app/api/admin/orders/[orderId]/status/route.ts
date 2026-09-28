import { verifyAdmin } from "../../../../../lib/admin-auth";
import { consumeRateLimit } from "../../../../../lib/rate-limit";

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

  const mutationLimit = await consumeRateLimit({
    scope: "admin-order-status",
    key: `admin:${auth.user.id}`,
    limit: 60,
    windowSeconds: 300,
  });

  if (!mutationLimit.ok) {
    return Response.json(
      { ok: false, error: "Too many admin requests. Please try again shortly." },
      {
        status: mutationLimit.status,
        headers: mutationLimit.retryAfter
          ? { "Retry-After": String(mutationLimit.retryAfter), "Cache-Control": "no-store" }
          : { "Cache-Control": "no-store" },
      },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 2_000) {
    return Response.json(
      { ok: false, error: "Invalid request body." },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
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

  const decodedOrderId = decodeURIComponent(orderId);
  const { data: currentOrder, error: currentOrderError } = await auth.admin
    .from("orders")
    .select("id,status")
    .eq("id", decodedOrderId)
    .maybeSingle();

  if (currentOrderError) {
    console.error("[NBH admin status lookup failed]", currentOrderError);
    return Response.json(
      { ok: false, error: "Could not update the order." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!currentOrder) {
    return Response.json(
      { ok: false, error: "Order not found." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { data, error } = await auth.admin
    .from("orders")
    .update({ status: statusValue })
    .eq("id", decodedOrderId)
    .select("id,status,updated_at")
    .maybeSingle();

  if (error) {
    console.error("[NBH admin status update failed]", error);
    return Response.json({ ok: false, error: "Could not update the order." }, { status: 500 });
  }
  if (!data) {
    return Response.json(
      { ok: false, error: "Order not found." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (currentOrder.status !== statusValue) {
    const { error: auditError } = await auth.admin.from("admin_audit_log").insert({
      actor_user_id: auth.user.id,
      action: "order.status_changed",
      target_type: "order",
      target_id: data.id,
      details: {
        from: currentOrder.status,
        to: statusValue,
      },
    });

    if (auditError) {
      console.error("[NBH admin audit log failed]", auditError);
    }
  }

  // The database trigger synchronises pending/available/void Drip Points from
  // the status transition, so no client-supplied point adjustment is accepted.
  return Response.json(
    { ok: true, order: data },
    { headers: { "Cache-Control": "no-store" } },
  );
}
