import { after } from "next/server";
import { reportAdminError } from "../../lib/error-monitoring";
import { consumeRateLimit, requestIp } from "../../lib/rate-limit";
import { validateOrderPayload } from "../../lib/order";
import { readMenuAvailability, findSoldOutOrderItems } from "../../lib/menu-availability";
import {
  createOrderDispatchPayload,
  createOrderId,
} from "../../lib/order-dispatch";
import { readShopStatus } from "../../lib/shop-status";
import { SquareApiError, squareConfigurationState } from "../../lib/square/api";
import { createSquareCheckout } from "../../lib/square/checkout";
import { verifiedSquareRewardMember } from "../../lib/square/reward-identity";
import {
  listOnlineSquareRewardTiers, issueSquareOrderReward,
  getSquareOrder, verifiedDiscountedOrderTotal,
  releaseSquareReward, cancelSquarePaymentLink, findSquareRewardForOrder, getSquareReward,
} from "../../lib/square/rewards";
import { findOrCreateSquareCustomer } from "../../lib/square/customers";
import {
  ensureSquareSignupBonus,
  findOrCreateSquareLoyaltyAccount,
} from "../../lib/square/loyalty";

const MAX_REQUEST_BYTES = 50_000;

function resolveCheckoutOrigin(request: Request) {
  const allowedHosts = new Set([
    "nastyburgerhouse.com.au",
    "www.nastyburgerhouse.com.au",
    "localhost:3000",
    "localhost:3001",
  ]);

  const candidates = [
    request.headers.get("origin")?.trim(),
    (() => {
      try {
        return new URL(request.url).origin;
      } catch {
        return undefined;
      }
    })(),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    try {
      const url = new URL(candidate);
      if (allowedHosts.has(url.host)) return url.origin;
    } catch {
      // Fall through to the configured site URL.
    }
  }

  return process.env.NEXT_PUBLIC_SITE_URL?.trim();
}

export async function POST(request: Request) {
  const ip = requestIp(request);
  if (ip) {
    const rateLimit = await consumeRateLimit({
      scope: "checkout-create",
      key: `ip:${ip}`,
      limit: 20,
      windowSeconds: 300,
    });

    if (!rateLimit.ok) {
      if (rateLimit.status === 429) {
        return Response.json(
          {
            ok: false,
            errors: ["Too many checkout attempts. Please try again shortly."],
          },
          {
            status: 429,
            headers: rateLimit.retryAfter
              ? {
                  "Retry-After": String(rateLimit.retryAfter),
                  "Cache-Control": "no-store",
                }
              : { "Cache-Control": "no-store" },
          },
        );
      }

      // Checkout is revenue-critical. If the rate-limit backend is temporarily
      // unavailable, fail open here rather than blocking Square payment.
      console.warn(
        "[NBH checkout] Rate limiter unavailable; continuing checkout.",
      );
    }
  }

  const serviceStatus = await readShopStatus();
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
    after(() =>
      reportAdminError(new Error("Square checkout is not configured."), {
        source: "checkout",
        path: "/api/orders",
        method: "POST",
        routePath: "/api/orders",
        routeType: "route",
        metadata: {
          squareConfigured: false,
        },
      }),
    );

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

  const requestedTierId = payload && typeof payload === "object" && !Array.isArray(payload)
    ? (payload as Record<string, unknown>).rewardTierId : undefined;
  if (requestedTierId !== undefined &&
      (typeof requestedTierId !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(requestedTierId))) {
    return Response.json({ ok: false, errors: ["The selected reward is invalid."] }, { status: 422 });
  }
  const rewardTierId = typeof requestedTierId === "string" ? requestedTierId : "";
  const validation = validateOrderPayload(payload);
  if (!validation.ok) {
    return Response.json(validation, {
      status: 422,
      headers: { "Cache-Control": "no-store" },
    });
  }

  // Verify live availability immediately before any Square customer/payment
  // side effects. Reject sold-out items even from older stored carts.
  const availability = await readMenuAvailability();
  if (!availability.ok && availability.reason !== "setup-required") {
    return Response.json(
      { ok: false, errors: ["Could not verify menu availability. Please try again."] },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  const unavailable = findSoldOutOrderItems(validation.order.cart, new Set(availability.soldOutIds));
  if (unavailable.length > 0) {
    return Response.json(
      { ok: false, errors: [`Sold out: ${unavailable.join(", ")}. Please update your cart.`] },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
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
    if (rewardTierId && process.env.SQUARE_ONLINE_REDEMPTION_ENABLED !== "true") {
      return Response.json({ ok: false, errors: ["Online redemption is not yet available."] }, { status: 409 });
    }

    // Guests can earn points but may never redeem based on an arbitrary checkout phone.
    // Redemption requires independently verified Supabase email + SMS phone and
    // an existing Square customer + Loyalty account with matching contacts.
    const verifiedMember = rewardTierId
      ? await verifiedSquareRewardMember(validation.order.customer)
      : null;
    if (verifiedMember && !verifiedMember.ok) {
      return Response.json({ ok: false, errors: [verifiedMember.reason] }, { status: 403 });
    }
    let customer: { id: string; phone: string };
    let loyaltyAccountId: string;
    if (verifiedMember?.ok) {
      const tiers = await listOnlineSquareRewardTiers();
      const selected = tiers.find((tier) => tier.id === rewardTierId);
      if (!selected || verifiedMember.balance < selected.points) {
        return Response.json({
          ok: false, errors: ["This Square reward is unavailable or you do not have enough points."],
        }, { status: 409 });
      }
      customer = { id: verifiedMember.squareCustomerId, phone: verifiedMember.verifiedPhone };
      loyaltyAccountId = verifiedMember.accountId;
    } else {
      customer = await findOrCreateSquareCustomer({
        ...validation.order.customer, requestId: validation.order.requestId,
      });
      const { account: loyaltyAccount, created: loyaltyCreated } =
        await findOrCreateSquareLoyaltyAccount({
          customerId: customer.id,
          phone: customer.phone,
          requestId: "nbh-checkout-loyalty-" + validation.order.requestId,
        });
      await ensureSquareSignupBonus(loyaltyAccount.id, { newlyCreated: loyaltyCreated });
      loyaltyAccountId = loyaltyAccount.id;
    }

    const checkout = await createSquareCheckout(
      orderPayload, customer, loyaltyAccountId, resolveCheckoutOrigin(request),
      rewardTierId || undefined,
    );
    let discountedTotal: number | null = null;
    let rewardId: string | null = null;

    if (rewardTierId) {
      try {
        const reward = await issueSquareOrderReward({
          accountId: loyaltyAccountId, tierId: rewardTierId,
          orderId: checkout.squareOrderId, requestId: validation.order.requestId,
        });
        rewardId = reward.id;
        const squareOrder = await getSquareOrder(checkout.squareOrderId);
        discountedTotal = verifiedDiscountedOrderTotal(
          squareOrder, Math.round(validation.order.subtotal * 100),
        );
      } catch (rewardError) {
        // An API timeout may happen AFTER Square reserved the points. Search by
        // the server-created order before cleanup; never leave a known issued reward.
        let safeToCancel = false;
        try {
          const issued = rewardId ?? (await findSquareRewardForOrder(
            loyaltyAccountId, checkout.squareOrderId,
          ))?.id;
          if (!issued) {
            safeToCancel = true;
          } else {
            const state = await getSquareReward(issued);
            // Never delete a link for a reward already redeemed by a paid order.
            if (state.status === "ISSUED") {
              await releaseSquareReward(issued);
              safeToCancel = true;
            } else if (state.status === "DELETED") {
              safeToCancel = true;
            }
          }
        } catch (cleanupError) {
          console.error("[NBH reward cleanup requires attention]", cleanupError);
        }
        if (safeToCancel) {
          try {
            await cancelSquarePaymentLink(checkout.paymentLinkId);
          } catch (cleanupError) {
            console.error("[NBH payment link cleanup requires attention]", cleanupError);
          }
        }
        throw rewardError;
      }
    }

    // Do not notify the restaurant yet. Paid-order notifications are triggered
    // only by Square payment webhooks after verifying payment completion.
    return Response.json(
      {
        ok: true,
        status: "payment-required",
        orderId,
        squareOrderId: checkout.squareOrderId,
        squareCustomerId: customer.id,
        loyaltyAccountId,
        rewardId,
        rewardTierId: rewardTierId || null,
        discountedTotal,
        paymentLinkId: checkout.paymentLinkId,
        checkoutUrl: checkout.checkoutUrl,
        subtotal: validation.order.subtotal,
        paymentMethod: "square_checkout",
        paymentStatus: "pending",
        earnedDripPoints: 0,
        dripPointsStatus: "awaiting-payment",
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

    after(() =>
      reportAdminError(error, {
        source: "checkout",
        path: "/api/orders",
        method: "POST",
        routePath: "/api/orders",
        routeType: "route",
        metadata: {
          orderId,
          requestId: validation.order.requestId,
          squareStatus:
            error instanceof SquareApiError ? error.status : undefined,
          squareEndpoint:
            error instanceof SquareApiError ? error.endpoint : undefined,
          squareRequestId:
            error instanceof SquareApiError ? error.requestId : undefined,
        },
      }),
    );

    const squareLimited = error instanceof SquareApiError && error.status === 429;
    const status =
      error instanceof SquareApiError && error.status >= 400 && error.status < 500 && !squareLimited
        ? 502
        : 503;
    const retryAfter = squareLimited
      ? Math.max(1, Math.ceil((error.retryAfterMs ?? 3000) / 1000))
      : undefined;

    return Response.json(
      {
        ok: false,
        errors: [
          squareLimited
            ? "Square checkout is temporarily busy. Your cart is saved; please try again shortly."
            : "We could not start the secure Square checkout. Please try again.",
        ],
      },
      {
        status,
        headers: {
          "Cache-Control": "no-store",
          ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}),
        },
      },
    );
  }
}
