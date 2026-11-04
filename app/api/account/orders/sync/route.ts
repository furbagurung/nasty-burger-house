import { consumeRateLimit, requestIp } from "../../../../lib/rate-limit";
import { getServerClientOrNull } from "../../../../lib/supabase/server";
import { getSquareConfig, squareRequest } from "../../../../lib/square/api";
import { recordPaidSquareCustomerOrder } from "../../../../lib/square/customer-order-sync";
import type {
  SquarePaidOrder,
  SquarePaidPayment,
} from "../../../../lib/square/paid-order-notifications";

type OrderWithTenders = SquarePaidOrder & {
  tenders?: Array<{ payment_id?: string }>;
};

export async function POST(request: Request) {
  const auth = await getServerClientOrNull();
  if (!auth) return Response.json({ ok: false, error: "Account service unavailable." }, { status: 503 });

  const { data: { user }, error: authError } = await auth.auth.getUser();
  if (authError || !user) {
    return Response.json({ ok: false, error: "Sign in to save orders to My Orders." }, { status: 401 });
  }

  const ip = requestIp(request);
  if (ip) {
    const limit = await consumeRateLimit({
      scope: "square-order-history-sync",
      key: user.id + ":" + ip,
      limit: 30,
      windowSeconds: 300,
    });
    if (!limit.ok && limit.status === 429) {
      return Response.json({ ok: false, error: "Too many checks." }, { status: 429 });
    }
  }

  let body: { squareOrderId?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const squareOrderId = typeof body.squareOrderId === "string" ? body.squareOrderId.trim() : "";
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(squareOrderId)) {
    return Response.json({ ok: false, error: "Invalid Square order ID." }, { status: 422 });
  }

  try {
    const { order } = await squareRequest<{ order?: OrderWithTenders }>(
      "/v2/orders/" + encodeURIComponent(squareOrderId),
    );
    if (!order || order.id !== squareOrderId ||
        order.location_id !== getSquareConfig().locationId ||
        order.metadata?.nbh_user_id !== user.id) {
      return Response.json({ ok: false, error: "This order is not linked to your account." }, { status: 403 });
    }

    // Do not mark orders paid based on redirect parameters or the browser.
    // Fetch the corresponding Square payment using server-only credentials.
    const paymentId = order.tenders?.find((tender) => tender.payment_id)?.payment_id;
    if (!paymentId) {
      return Response.json({ ok: false, error: "Payment is still being confirmed." }, { status: 409 });
    }
    const { payment } = await squareRequest<{ payment?: SquarePaidPayment }>(
      "/v2/payments/" + encodeURIComponent(paymentId),
    );
    if (!payment || payment.status !== "COMPLETED" || payment.order_id !== squareOrderId) {
      return Response.json({ ok: false, error: "Payment is still being confirmed." }, { status: 409 });
    }

    const result = await recordPaidSquareCustomerOrder(payment, order);
    if (!result.linked) {
      return Response.json({ ok: false, error: "Could not link the verified order." }, { status: 409 });
    }
    return Response.json({ ok: true, orderId: result.orderId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[NBH customer Square order sync]", error);
    return Response.json({ ok: false, error: "Could not sync order history." }, { status: 502 });
  }
}
