import { getSquareConfig, squareRequest } from "../../../lib/square/api";
import {
  cancelSquarePaymentLink, getSquareOrder, releaseSquareReward,
} from "../../../lib/square/rewards";

export const dynamic = "force-dynamic";

// Hobby-compatible daily Vercel Cron. Rewards are checked only after 24 hours;
// the actual release time may be 24–48 hours after an abandoned checkout.
const MIN_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_REWARDS_TO_CHECK = 10;
const MAX_REWARD_PAGES = 20;

type IssuedReward = {
  id?: string;
  status?: string;
  order_id?: string;
  created_at?: string;
};
type PaymentLink = { id?: string; order_id?: string };
type Payment = { id?: string; order_id?: string; status?: string };
type Page<T> = { cursor?: string } & T;

async function findLinkForOrder(orderId: string) {
  let cursor: string | undefined;
  for (let page = 0; page < 30; page++) {
    const query = new URLSearchParams({ limit: "100" });
    if (cursor) query.set("cursor", cursor);
    const result = await squareRequest<Page<{ payment_links?: PaymentLink[] }>>(
      "/v2/online-checkout/payment-links?" + query.toString(),
    );
    const found = (result.payment_links ?? []).find((link) => link.order_id === orderId);
    if (found?.id) return found.id;
    cursor = result.cursor;
    if (!cursor) return null;
  }
  // Incomplete search: fail closed rather than cancelling a live reward.
  return null;
}

async function hasPotentialPayment(orderId: string, createdAt: string, locationId: string) {
  const begin = new Date(Math.max(0, Date.parse(createdAt) - 60 * 60 * 1000));
  if (!Number.isFinite(begin.getTime())) return true;
  let cursor: string | undefined;
  for (let page = 0; page < 30; page++) {
    const query = new URLSearchParams({
      begin_time: begin.toISOString(), location_id: locationId, limit: "100",
    });
    if (cursor) query.set("cursor", cursor);
    const result = await squareRequest<Page<{ payments?: Payment[] }>>(
      "/v2/payments?" + query.toString(),
    );
    if ((result.payments ?? []).some(
      (payment) => payment.order_id === orderId &&
        ["COMPLETED", "APPROVED", "PENDING"].includes(payment.status ?? ""),
    )) return true;
    cursor = result.cursor;
    if (!cursor) return false;
  }
  return true; // Too many pages; do not make an unsafe cancellation.
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== "Bearer " + secret) {
    return Response.json({ ok: false }, { status: 401 });
  }
  if (process.env.SQUARE_ONLINE_REDEMPTION_ENABLED !== "true") {
    return Response.json({ ok: true, skipped: "Online redemption disabled" });
  }

  let inspected = 0;
  let released = 0;
  let skipped = 0;
  let failures = 0;
  const cutoff = Date.now() - MIN_AGE_MS;
  const locationId = getSquareConfig().locationId;
  if (!locationId) return Response.json({ ok: false }, { status: 503 });

  try {
    let cursor: string | undefined;
    for (let page = 0; page < MAX_REWARD_PAGES && inspected < MAX_REWARDS_TO_CHECK; page++) {
      const result = await squareRequest<Page<{ rewards?: IssuedReward[] }>>(
        "/v2/loyalty/rewards/search", {
          method: "POST",
          body: JSON.stringify({ limit: 30, ...(cursor ? { cursor } : {}) }),
        },
      );
      for (const reward of result.rewards ?? []) {
        if (inspected >= MAX_REWARDS_TO_CHECK) break;
        if (reward.status !== "ISSUED" || !reward.id || !reward.order_id ||
            !reward.created_at || Date.parse(reward.created_at) >= cutoff) continue;
        try {
          const order = await getSquareOrder(reward.order_id);
          if (order.location_id !== locationId ||
              order.metadata?.nbh_reward_checkout !== "yes") {
            skipped++;
            continue; // Never touch in-store/POS or unrelated reservations.
          }
          inspected++;
          if (order.state === "COMPLETED") { skipped++; continue; }
          if (order.state !== "OPEN" && order.state !== "CANCELED") {
            skipped++; continue;
          }
          if (!order.created_at ||
              await hasPotentialPayment(reward.order_id, order.created_at, locationId)) {
            skipped++; continue;
          }
          if (order.state === "OPEN") {
            const linkId = await findLinkForOrder(reward.order_id);
            if (!linkId) { skipped++; continue; }
            // Stop the hosted link BEFORE returning reserved points. Recheck
            // payments first to avoid cancelling a checkout in progress.
            if (await hasPotentialPayment(reward.order_id, order.created_at, locationId)) {
              skipped++; continue;
            }
            const cancelledLink = await cancelSquarePaymentLink(linkId);
            if (cancelledLink.cancelled_order_id !== reward.order_id) {
              skipped++;
              continue; // Link was not confirmed cancelled; do not release points.
            }
          }
          const status = await releaseSquareReward(reward.id);
          if (status === "DELETED") released++;
          else skipped++;
        } catch (error) {
          failures++;
          console.error("[NBH expired reward cleanup]", {
            orderId: reward.order_id,
            reason: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
      cursor = result.cursor;
      if (!cursor) break;
    }
    return Response.json({ ok: failures === 0, inspected, released, skipped, failures }, {
      status: failures === 0 ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[NBH expired reward scan]", error);
    return Response.json({ ok: false, inspected, released, skipped, failures: failures + 1 }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
}
