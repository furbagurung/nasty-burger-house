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
    object?: unknown;
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

  // Square is now the source of truth. This endpoint intentionally keeps
  // processing lightweight and acknowledges verified events quickly. Add
  // seller-specific automations here later (loyalty, notifications, analytics).
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
