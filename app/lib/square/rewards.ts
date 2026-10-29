import "server-only";

import { getSquareConfig, squareRequest } from "./api";
import { getSquareLoyaltyProgram } from "./loyalty";

export type OnlineRewardTier = {
  id: string;
  name: string;
  points: number;
};

type CatalogObject = {
  type?: string;
  product_set_data?: { all_products?: boolean };
};
type CatalogResponse = { object?: CatalogObject; related_objects?: CatalogObject[] };
type LoyaltyReward = {
  id: string;
  status?: "ISSUED" | "REDEEMED" | "DELETED";
  order_id?: string;
  loyalty_account_id?: string;
  reward_tier_id?: string;
  created_at?: string;
};
type SquareOrder = {
  id?: string;
  state?: string;
  location_id?: string;
  metadata?: Record<string, string>;
  total_money?: { amount?: number; currency?: string };
  total_discount_money?: { amount?: number; currency?: string };
  created_at?: string;
};

export async function listOnlineSquareRewardTiers(): Promise<OnlineRewardTier[]> {
  const program = await getSquareLoyaltyProgram();
  if (program.status !== "ACTIVE") return [];
  const locationId = getSquareConfig().locationId;
  // Square POS may offer catalog-item rewards, but our website currently sends
  // ad-hoc items. Only whole-order pricing rules can be safely used online.
  if (!locationId) return [];
  const tiers = await Promise.all((program.reward_tiers ?? []).map(async (tier) => {
    const reference = tier.pricing_rule_reference;
    if (!reference?.object_id || !reference.catalog_version || !tier.id ||
        !Number.isInteger(tier.points) || tier.points < 1) return null;
    const path = "/v2/catalog/object/" + encodeURIComponent(reference.object_id) +
      "?include_related_objects=true&catalog_version=" +
      encodeURIComponent(String(reference.catalog_version));
    const catalog = await squareRequest<CatalogResponse>(path);
    const hasWholeOrderScope = (catalog.related_objects ?? []).some(
      (object) => object.type === "PRODUCT_SET" &&
        object.product_set_data?.all_products === true,
    );
    if (!hasWholeOrderScope) return null;
    return { id: tier.id, name: tier.name?.trim() || "Square reward", points: tier.points };
  }));
  return tiers.filter((tier): tier is OnlineRewardTier => tier !== null)
    .sort((a, b) => a.points - b.points);
}

export async function issueSquareOrderReward(input: {
  accountId: string;
  tierId: string;
  orderId: string;
  requestId: string;
}) {
  const result = await squareRequest<{ reward?: LoyaltyReward }>("/v2/loyalty/rewards", {
    method: "POST",
    body: JSON.stringify({
      reward: {
        loyalty_account_id: input.accountId,
        reward_tier_id: input.tierId,
        order_id: input.orderId,
      },
      idempotency_key: ("nbh-online-reward-" + input.requestId).slice(0, 128),
    }),
  });
  if (!result.reward?.id || !["ISSUED", "REDEEMED"].includes(result.reward.status ?? "") ||
      result.reward.order_id !== input.orderId) {
    throw new Error("Square could not reserve a reward for this order.");
  }
  return result.reward;
}

export async function findSquareRewardForOrder(accountId: string, orderId: string) {
  let cursor: string | undefined;
  do {
    const result = await squareRequest<{ rewards?: LoyaltyReward[]; cursor?: string }>(
      "/v2/loyalty/rewards/search", {
        method: "POST",
        body: JSON.stringify({
          query: { loyalty_account_id: accountId },
          limit: 30,
          ...(cursor ? { cursor } : {}),
        }),
      },
    );
    const found = (result.rewards ?? []).find(
      (reward) => reward.order_id === orderId && reward.status === "ISSUED",
    );
    if (found) return found;
    cursor = result.cursor;
  } while (cursor);
  return null;
}

export async function getSquareOrder(orderId: string) {
  const result = await squareRequest<{ order?: SquareOrder }>(
    "/v2/orders/" + encodeURIComponent(orderId),
  );
  if (!result.order?.id) throw new Error("Square order was not found.");
  return result.order;
}

export async function getSquareReward(rewardId: string) {
  const result = await squareRequest<{ reward?: LoyaltyReward }>(
    "/v2/loyalty/rewards/" + encodeURIComponent(rewardId),
  );
  if (!result.reward?.id) throw new Error("Square reward was not found.");
  return result.reward;
}

export async function releaseSquareReward(rewardId: string) {
  const reward = await getSquareReward(rewardId);
  if (reward.status === "DELETED" || reward.status === "REDEEMED") return reward.status;
  await squareRequest<Record<string, never>>(
    "/v2/loyalty/rewards/" + encodeURIComponent(rewardId), { method: "DELETE" },
  );
  return "DELETED";
}

export async function cancelSquarePaymentLink(linkId: string) {
  return squareRequest<{ id?: string; cancelled_order_id?: string }>(
    "/v2/online-checkout/payment-links/" + encodeURIComponent(linkId),
    { method: "DELETE" },
  );
}

export function verifiedDiscountedOrderTotal(
  order: Awaited<ReturnType<typeof getSquareOrder>>, originalCents: number,
): number {
  const cents = order.total_money?.amount;
  const discount = order.total_discount_money?.amount;
  if (order.total_money?.currency !== "AUD" ||
      order.total_discount_money?.currency !== "AUD" ||
      !Number.isInteger(cents) || !Number.isInteger(discount) ||
      cents === undefined || discount === undefined ||
      cents <= 0 || cents >= originalCents || discount <= 0) {
    throw new Error("Square did not apply an eligible discount to this checkout.");
  }
  return cents / 100;
}
