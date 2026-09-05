import { validateOrderPayload } from "../../lib/order";
import {
  createOrderDispatchPayload,
  createOrderId,
  dispatchOrder,
} from "../../lib/order-dispatch";
import { getServiceStatus } from "../../lib/service";

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

  const orderId = createOrderId(validation.order.requestId);
  const orderPayload = createOrderDispatchPayload(
    validation.order,
    serviceStatus,
    orderId,
  );
  const dispatch = await dispatchOrder(orderPayload);

  if (!dispatch.ok) {
    if (dispatch.reason === "not-configured") {
      // Temporary launch fallback: allow Pay on Pickup checkout to complete
      // while the kitchen/order webhook is still being connected. The full
      // order is emitted to server logs so test orders remain inspectable.
      console.warn("[NBH temporary order fallback]", orderPayload);

      return Response.json(
        {
          ok: true,
          status: "accepted-temporarily",
          orderId,
          subtotal: validation.order.subtotal,
          paymentMethod: validation.order.paymentMethod,
          paymentStatus: "unpaid",
          dispatchMode: "temporary-fallback",
          message: "Pickup order accepted. Pay when you collect.",
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
      subtotal: validation.order.subtotal,
      paymentMethod: validation.order.paymentMethod,
      paymentStatus: "unpaid",
      message: "Pickup order received. Pay when you collect.",
    },
    {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
