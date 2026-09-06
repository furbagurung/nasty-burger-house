import "server-only";

import type { createOrderDispatchPayload } from "../order-dispatch";
import { getSquareConfig, squareRequest } from "./api";

type OrderPayload = ReturnType<typeof createOrderDispatchPayload>;

type CreatePaymentLinkResponse = {
  payment_link?: {
    id?: string;
    order_id?: string;
    url?: string;
    long_url?: string;
  };
};

function toCents(value: number) {
  return Math.round((value + Number.EPSILON) * 100);
}

function lineNote(line: OrderPayload["lines"][number]) {
  const details: string[] = [];

  if (line.combo.selected && "drink" in line.combo && line.combo.drink) {
    details.push(`Beast Combo · ${line.combo.drink}`);
  }

  if (line.extras.length > 0) {
    details.push(
      `Extras: ${line.extras
        .map((extra) => `${extra.quantity}× ${extra.name}`)
        .join(", ")}`,
    );
  }

  if (line.removedIngredients.length > 0) {
    details.push(`Without: ${line.removedIngredients.join(", ")}`);
  }

  if (line.beastBox) {
    details.push(`Burgers: ${line.beastBox.burgers.join(", ")}`);
    details.push(`Drinks: ${line.beastBox.drinks.join(", ")}`);
  }

  return details.join(" · ").slice(0, 1900) || undefined;
}

function checkoutRedirectUrl(orderId: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return undefined;

  try {
    const url = new URL("/checkout/complete", configured);
    url.searchParams.set("nbhOrderId", orderId);
    return url.toString();
  } catch {
    return undefined;
  }
}

export async function createSquareCheckout(
  payload: OrderPayload,
  customer: { id: string; phone: string },
) {
  const config = getSquareConfig();
  if (!config.locationId) {
    throw new Error("Square location ID is not configured.");
  }

  const redirectUrl = checkoutRedirectUrl(payload.orderId);
  const supportEmail = process.env.SQUARE_MERCHANT_SUPPORT_EMAIL?.trim();

  const response = await squareRequest<CreatePaymentLinkResponse>(
    "/v2/online-checkout/payment-links",
    {
      method: "POST",
      body: JSON.stringify({
        idempotency_key: `nbh-checkout-${payload.requestId}`.slice(0, 192),
        description: `Nasty Burger House pickup order ${payload.orderId}`,
        order: {
          location_id: config.locationId,
          reference_id: payload.orderId.slice(0, 40),
          line_items: payload.lines.map((line) => ({
            name: line.name,
            quantity: String(line.quantity),
            base_price_money: {
              amount: toCents(line.unitPrice),
              currency: "AUD",
            },
            ...(lineNote(line) ? { note: lineNote(line) } : {}),
          })),
          fulfillments: [
            {
              type: "PICKUP",
              state: "PROPOSED",
              pickup_details: {
                schedule_type: "ASAP",
                prep_time_duration: "PT15M",
                recipient: {
                  customer_id: customer.id,
                  display_name: payload.customer.name,
                  email_address: payload.customer.email,
                  phone_number: customer.phone,
                },
                ...(payload.notes ? { note: payload.notes.slice(0, 500) } : {}),
              },
            },
          ],
        },
        checkout_options: {
          allow_tipping: false,
          ask_for_shipping_address: false,
          ...(redirectUrl ? { redirect_url: redirectUrl } : {}),
          ...(supportEmail ? { merchant_support_email: supportEmail } : {}),
        },
        pre_populated_data: {
          buyer_email: payload.customer.email,
          buyer_phone_number: customer.phone,
        },
        payment_note: `NBH web order ${payload.orderId}`.slice(0, 500),
      }),
    },
  );

  const paymentLink = response.payment_link;
  if (!paymentLink?.id || !paymentLink.order_id || !paymentLink.url) {
    throw new Error("Square did not return a complete checkout link.");
  }

  return {
    paymentLinkId: paymentLink.id,
    squareOrderId: paymentLink.order_id,
    checkoutUrl: paymentLink.url,
    longCheckoutUrl: paymentLink.long_url ?? null,
  };
}
