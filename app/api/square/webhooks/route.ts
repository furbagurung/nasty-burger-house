import { ensureSquareSignupBonus } from "../../../lib/square/loyalty";
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
    };
  };
};

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
