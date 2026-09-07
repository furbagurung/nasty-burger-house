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
  const url = new URL(request.url);
  const squareOrderId = url.searchParams.get("squareOrderId")?.trim();

  if (!squareOrderId) {
    return Response.json(
      { ok: false, error: "Missing Square order ID." },
      { status: 400 },
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
      return Response.json({
        ok: true,
        paid: false,
        status: "PENDING",
      });
    }

    const paymentResult = await squareRequest<SquarePaymentResponse>(
      `/v2/payments/${encodeURIComponent(paymentId)}`,
    );

    const status = paymentResult.payment?.status ?? "UNKNOWN";

    return Response.json({
      ok: true,
      paid: status === "COMPLETED",
      status,
    });
  } catch (error) {
    console.error("[NBH Square order status]", error);

    return Response.json(
      {
        ok: false,
        error: "Unable to verify Square payment.",
      },
      { status: 502 },
    );
  }
}