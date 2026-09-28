import { consumeRateLimit, requestIp } from "../../../lib/rate-limit";
import { squareRequest } from "../../../lib/square/api";

type SquareOrderResponse = {
  order?: {
    tenders?: Array<{
      payment_id?: string;
    }>;
  };
};

type SquarePaymentResponse = {
  payment?: {
    status?: string;
  };
};

export async function GET(request: Request) {
  const ip = requestIp(request);
  if (ip) {
    const rateLimit = await consumeRateLimit({
      scope: "square-order-status",
      key: `ip:${ip}`,
      limit: 60,
      windowSeconds: 300,
    });

    if (!rateLimit.ok) {
      return Response.json(
        { ok: false, error: "Too many status checks. Please try again shortly." },
        {
          status: rateLimit.status,
          headers: rateLimit.retryAfter
            ? { "Retry-After": String(rateLimit.retryAfter), "Cache-Control": "no-store" }
            : { "Cache-Control": "no-store" },
        },
      );
    }
  }

  const url = new URL(request.url);
  const squareOrderId = url.searchParams.get("squareOrderId")?.trim();

  if (!squareOrderId || !/^[A-Za-z0-9_-]{6,128}$/.test(squareOrderId)) {
    return Response.json(
      { ok: false, error: "Missing Square order ID." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const orderResult = await squareRequest<SquareOrderResponse>(
      `/v2/orders/${encodeURIComponent(squareOrderId)}`,
    );

    const paymentId = orderResult.order?.tenders?.find(
      (tender) => tender.payment_id,
    )?.payment_id;

    if (!paymentId) {
      return Response.json(
        {
          ok: true,
          paid: false,
          status: "PENDING",
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const paymentResult = await squareRequest<SquarePaymentResponse>(
      `/v2/payments/${encodeURIComponent(paymentId)}`,
    );

    const status = paymentResult.payment?.status ?? "UNKNOWN";

    return Response.json(
      {
        ok: true,
        paid: status === "COMPLETED",
        status,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[NBH Square order status]", error);

    return Response.json(
      {
        ok: false,
        error: "Unable to verify Square payment.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}