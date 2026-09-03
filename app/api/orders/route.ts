import { validateOrderPayload } from "../../lib/order";
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

  // Phase 3 validates the complete order on the server. It deliberately does
  // not persist, charge or send the order until a payment/POS provider is chosen.
  const orderId = `NBH-DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  return Response.json(
    {
      ok: true,
      status: "demo",
      orderId,
      subtotal: validation.order.subtotal,
      message: "Order validated successfully. No payment was taken.",
    },
    {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
