import { sendAdminOrderEmail } from "../../lib/admin-notifications";
import { validateOrderPayload } from "../../lib/order";
import {
  createOrderDispatchPayload,
  createOrderId,
  dispatchOrder,
} from "../../lib/order-dispatch";
import { getServiceStatus } from "../../lib/service";
import { SquareApiError, squareConfigurationState } from "../../lib/square/api";
import { createSquareCheckout } from "../../lib/square/checkout";
import { findOrCreateSquareCustomer } from "../../lib/square/customers";

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

  const squareState = squareConfigurationState();
  if (!squareState.configured) {
    return Response.json(
      {
        ok: false,
        errors: [
          "Secure online checkout is being connected. Please try again shortly.",
        ],
        square: squareState,
      },
      {
        status: 503,
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
  const squareOrder = {
    ...validation.order,
    customerId: undefined,
    dripMember: false,
  };
  const orderPayload = createOrderDispatchPayload(
    squareOrder,
    serviceStatus,
    orderId,
  );

  try {
    const customer = await findOrCreateSquareCustomer({
      ...validation.order.customer,
      requestId: validation.order.requestId,
    });
    const checkout = await createSquareCheckout(orderPayload, customer);

    // Square is the commerce source of truth. Existing email/webhook alerts are
    // retained only as optional operational notifications and never block checkout.
    void Promise.all([
      dispatchOrder(orderPayload),
      sendAdminOrderEmail(orderPayload),
    ]).then(([webhookDispatch, emailDispatch]) => {
      if (!webhookDispatch.ok && !emailDispatch.ok) {
        console.warn("[NBH optional order alert unavailable]", {
          orderId,
          webhook: webhookDispatch.reason,
          email: emailDispatch.reason,
        });
      }
    });

    return Response.json(
      {
        ok: true,
        status: "payment-required",
        orderId,
        squareOrderId: checkout.squareOrderId,
        squareCustomerId: customer.id,
        paymentLinkId: checkout.paymentLinkId,
        checkoutUrl: checkout.checkoutUrl,
        subtotal: validation.order.subtotal,
        paymentMethod: "square_checkout",
        paymentStatus: "pending",
        earnedDripPoints: 0,
        dripPointsStatus: null,
        storageMode: "square",
        message: "Continue to Square to securely pay for your pickup order.",
      },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("[NBH Square checkout failed]", error);

    const status =
      error instanceof SquareApiError && error.status >= 400 && error.status < 500
        ? 502
        : 503;

    return Response.json(
      {
        ok: false,
        errors: [
          "We could not start the secure Square checkout. Please try again.",
        ],
      },
      {
        status,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
