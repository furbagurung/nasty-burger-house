import { calculateEarnedDripPoints } from "../../lib/loyalty";
import { validateOrderPayload } from "../../lib/order";
import {
  createOrderDispatchPayload,
  createOrderId,
  dispatchOrder,
} from "../../lib/order-dispatch";
import {
  persistOrderToSupabase,
  updateOrderNotificationStatus,
} from "../../lib/order-persistence";
import { getServiceStatus } from "../../lib/service";
import { getAdminClientOrNull } from "../../lib/supabase/admin";
import { getServerClientOrNull } from "../../lib/supabase/server";

const MAX_REQUEST_BYTES = 50_000;

export async function POST(request: Request) {
  const serviceStatus = getServiceStatus();
  if (!serviceStatus.acceptingOrders) {
    return Response.json(
      { ok: false, errors: [serviceStatus.notice] },
      {
        status: 409,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return Response.json(
      { ok: false, errors: ["The order request is too large."] },
      { status: 413 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { ok: false, errors: ["The order request could not be read."] },
      { status: 400 },
    );
  }

  const validation = validateOrderPayload(payload);
  if (!validation.ok) {
    return Response.json(validation, {
      status: 422,
      headers: { "Cache-Control": "no-store" },
    });
  }

  // Membership and customer ownership are derived from the verified Supabase
  // session. Client-supplied customerId/dripMember values are never trusted.
  let customerId: string | null = null;
  const serverSupabase = await getServerClientOrNull();
  if (serverSupabase) {
    const {
      data: { user },
    } = await serverSupabase.auth.getUser();

    if (user) {
      customerId = user.id;

      // The auth trigger normally creates the row. This upsert only repairs a
      // missing profile if the migration was applied after a user already existed.
      const admin = getAdminClientOrNull();
      if (admin) {
        const { data: existingProfile } = await admin
          .from("customers")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!existingProfile) {
          await admin.from("customers").upsert(
            {
              id: user.id,
              name: validation.order.customer.name,
              email: user.email ?? validation.order.customer.email,
              phone: validation.order.customer.phone,
            },
            { onConflict: "id" },
          );
        }
      }
    }
  }

  const orderId = createOrderId(validation.order.requestId);
  const authenticatedOrder = {
    ...validation.order,
    customerId: customerId ?? undefined,
    dripMember: Boolean(customerId),
  };
  const earnedDripPoints = customerId
    ? calculateEarnedDripPoints(authenticatedOrder.subtotal)
    : 0;
  const orderPayload = createOrderDispatchPayload(
    authenticatedOrder,
    serviceStatus,
    orderId,
  );

  // Supabase is the production source of truth. Once an order is written there,
  // a notification delivery failure must not make the stored order disappear.
  const persistence = await persistOrderToSupabase(orderPayload, customerId);
  if (!persistence.ok && persistence.reason === "write-failed") {
    console.error("[NBH Supabase order persistence failed]", persistence.detail);
    return Response.json(
      {
        ok: false,
        errors: ["We could not save the order. Please try again."],
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const dispatch = await dispatchOrder(orderPayload);
  const adminNotification = dispatch.ok
    ? "sent"
    : dispatch.reason === "not-configured"
      ? "not-configured"
      : "failed";

  if (persistence.ok) {
    await updateOrderNotificationStatus(orderId, adminNotification);

    if (!dispatch.ok) {
      console.warn("[NBH order notification unavailable]", {
        orderId,
        reason: dispatch.reason,
      });
    }

    return Response.json(
      {
        ok: true,
        status: persistence.existing ? "already-submitted" : "submitted",
        orderId,
        subtotal: authenticatedOrder.subtotal,
        paymentMethod: authenticatedOrder.paymentMethod,
        paymentStatus: "unpaid",
        earnedDripPoints,
        dripPointsStatus: customerId ? "pending" : null,
        adminNotification,
        storageMode: "supabase",
        message: "Pickup order received. Pay when you collect.",
      },
      {
        status: persistence.existing ? 200 : 201,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  // Local/preview fallback while Supabase credentials are not configured.
  if (!dispatch.ok) {
    if (dispatch.reason === "not-configured") {
      console.warn("[NBH temporary order fallback]", orderPayload);

      return Response.json(
        {
          ok: true,
          status: "accepted-temporarily",
          orderId,
          subtotal: authenticatedOrder.subtotal,
          paymentMethod: authenticatedOrder.paymentMethod,
          paymentStatus: "unpaid",
          earnedDripPoints,
          adminNotification: "not-configured",
          dispatchMode: "temporary-fallback",
          storageMode: "local-fallback",
          message: "Pickup order accepted in preview mode. Pay when you collect.",
        },
        {
          status: 201,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    return Response.json(
      {
        ok: false,
        errors: ["We could not send the order to the kitchen. Please try again."],
        adminNotification: "failed",
      },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  return Response.json(
    {
      ok: true,
      status: "submitted",
      orderId,
      subtotal: authenticatedOrder.subtotal,
      paymentMethod: authenticatedOrder.paymentMethod,
      paymentStatus: "unpaid",
      earnedDripPoints,
      adminNotification: "sent",
      storageMode: "local-fallback",
      message: "Pickup order received. Pay when you collect.",
    },
    {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
