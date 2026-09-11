import { squareRequest } from "../../../lib/square/api";
import {
  accumulateSquareLoyaltyPoints,
  ensureSquareSignupBonus,
} from "../../../lib/square/loyalty";
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

  if (event.type === "loyalty.account.created") {
    const loyaltyAccountId =
      event.data?.object?.loyalty_account?.id ?? event.data?.id ?? "";

    if (loyaltyAccountId) {
      try {
        const bonus = await ensureSquareSignupBonus(loyaltyAccountId);
        console.info("[NBH Square loyalty signup bonus]", {
          eventId: event.event_id ?? null,
          loyaltyAccountId,
          applied: bonus.applied,
        });
      } catch (error) {
        console.error("[NBH Square loyalty signup bonus]", error);
        return Response.json(
          { ok: false, error: "Could not apply Square Loyalty signup bonus." },
          { status: 500 },
        );
      }
    }
  }

  try {
    await accrueCompletedOrder(event);
  } catch (error) {
    console.error("[NBH Square loyalty purchase]", error);
    return Response.json(
      { ok: false, error: "Could not apply Square Loyalty purchase points." },
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
