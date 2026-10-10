import { squareRequest, getSquareConfig } from "../../../lib/square/api";
import { sendAdminPaidOrderEmail } from "../../../lib/admin-notifications";
import { dispatchOrder } from "../../../lib/order-dispatch";
import {
  createPaidSquareOrderNotifications,
  type SquarePaidPayment,
  type SquarePaidOrder,
} from "../../../lib/square/paid-order-notifications";
import { accumulateSquareLoyaltyPoints } from "../../../lib/square/loyalty";
import { validateSquareWebhookSignature } from "../../../lib/square/webhooks";

type SquareWebhookEvent = {
  event_id?: string;
  type?: string;
  created_at?: string;
  merchant_id?: string;
  location_id?: string;
  data?: {
    type?: string;
    id?: string;
    object?: {
      loyalty_account?: {
        id?: string;
      };
      order_updated?: {
        order_id?: string;
        location_id?: string;
        state?: string;
      };
      payment?: SquarePaidPayment;
    };
  };
};

type RetrieveSquareOrderResponse = {
  order?: {
    id?: string;
    location_id?: string;
    state?: string;
    metadata?: Record<string, string>;
  };
};

async function accrueCompletedOrder(event: SquareWebhookEvent) {
  const orderUpdate = event.data?.object?.order_updated;
  if (event.type !== "order.updated" || orderUpdate?.state !== "COMPLETED") {
    return;
  }

  const orderId = orderUpdate.order_id ?? event.data?.id ?? "";
  if (!orderId) return;

  const result = await squareRequest<RetrieveSquareOrderResponse>(
    `/v2/orders/${encodeURIComponent(orderId)}`,
  );
  const order = result.order;

  if (!order || order.state !== "COMPLETED") return;

  const loyaltyAccountId = order.metadata?.nbh_loyalty_id?.trim() ?? "";
  if (!loyaltyAccountId) {
    // Orders not created by the Nasty Burger website do not carry this metadata,
    // so Square/POS loyalty remains untouched by this website integration.
    return;
  }

  const locationId =
    order.location_id?.trim() ||
    orderUpdate.location_id?.trim() ||
    event.location_id?.trim() ||
    "";

  if (!locationId) {
    throw new Error("Completed Square order is missing its location ID.");
  }

  const accumulation = await accumulateSquareLoyaltyPoints({
    accountId: loyaltyAccountId,
    orderId,
    locationId,
    requestId: `nbh-loyalty-order-${orderId}`,
  });

  const earnedPoints = (accumulation.events ?? []).reduce(
    (total, loyaltyEvent) =>
      total + Math.max(0, loyaltyEvent.accumulate_points?.points ?? 0),
    0,
  );

  console.info("[NBH Square loyalty purchase]", {
    eventId: event.event_id ?? null,
    orderId,
    loyaltyAccountId,
    earnedPoints,
  });
}

/**
 * Square payment.created may already be COMPLETED; payment.updated handles
 * delayed capture. Do not send from checkout creation or order.updated alone.
 * Re-fetch both records using server credentials before trusting payment status.
 */
async function notifyPaidWebsiteOrder(event: SquareWebhookEvent) {
  if (event.type !== "payment.created" && event.type !== "payment.updated") {
    return;
  }
  const receivedPayment = event.data?.object?.payment;
  if (receivedPayment?.status !== "COMPLETED") return;

  const paymentId = receivedPayment.id ?? event.data?.id;
  if (!paymentId) return;

  const paymentResponse = await squareRequest<{ payment?: SquarePaidPayment }>(
    `/v2/payments/${encodeURIComponent(paymentId)}`,
  );
  const payment = paymentResponse.payment;
  if (!payment || payment.id !== paymentId || payment.status !== "COMPLETED" ||
      !payment.order_id) return;

  const orderResponse = await squareRequest<{ order?: SquarePaidOrder }>(
    `/v2/orders/${encodeURIComponent(payment.order_id)}`,
  );
  if (!orderResponse.order) throw new Error("Paid Square order cannot be retrieved.");

  const notification = createPaidSquareOrderNotifications(
    payment, orderResponse.order, getSquareConfig().locationId,
  );
  if (!notification) return; // POS orders, unpaid/partial payments, wrong location

  const [email, webhook] = await Promise.all([
    sendAdminPaidOrderEmail(notification.email),
    dispatchOrder(notification.webhook),
  ]);

  // Square retries failed delivery (with the same stable Resend idempotency
  // key derived from the Square order ID). Unconfigured optional channels
  // do not block payment handling.
  const emailFailed = !email.ok && email.reason === "delivery-failed";
  const webhookFailed = !webhook.ok && webhook.reason === "delivery-failed";
  if (emailFailed || webhookFailed) {
    throw new Error("Paid order notification delivery failed; retry webhook.");
  }

  console.info("[NBH paid order alert]", {
    squareOrderId: notification.email.squareOrderId,
    squarePaymentId: notification.email.paymentId,
    email: email.ok ? "sent" : "not-configured",
    webhook: webhook.ok ? "sent" : "not-configured",
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature");

  if (!validateSquareWebhookSignature(rawBody, signature)) {
    return Response.json(
      { ok: false, error: "Invalid Square webhook signature." },
      { status: 403 },
    );
  }

  let event: SquareWebhookEvent;
  try {
    event = JSON.parse(rawBody) as SquareWebhookEvent;
  } catch {
    return Response.json(
      { ok: false, error: "Invalid webhook payload." },
      { status: 400 },
    );
  }

  // Do not award signup points from loyalty.account.created webhooks:
  // Square also emits this event when members enroll in person at the POS.
  // Website checkout/auth flows grant the one-time bonus only when they
  // themselves create a genuinely new loyalty account. Existing members
  // must retain their current balance without receiving an extra 500.

  try {
    await accrueCompletedOrder(event);
    await notifyPaidWebsiteOrder(event);
  } catch (error) {
    console.error("[NBH Square webhook processing]", error);
    return Response.json(
      { ok: false, error: "Could not process Square payment or loyalty event." },
      { status: 500 },
    );
  }

  console.info("[NBH Square webhook]", {
    eventId: event.event_id ?? null,
    type: event.type ?? null,
    merchantId: event.merchant_id ?? null,
    locationId: event.location_id ?? null,
    objectId: event.data?.id ?? null,
  });

  return Response.json(
    { ok: true },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
