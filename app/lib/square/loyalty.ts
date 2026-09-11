import "server-only";

import { randomUUID } from "node:crypto";
import { DRIP_SIGNUP_BONUS } from "../loyalty";
import { squareRequest } from "./api";
import { normalizeAustralianPhone } from "./customers";

export type SquareLoyaltyAccount = {
  id: string;
  program_id?: string;
  balance?: number;
  lifetime_points?: number;
  customer_id?: string;
  mapping?: {
    id?: string;
    phone_number?: string;
    created_at?: string;
  };
  created_at?: string;
  updated_at?: string;
  enrolled_at?: string;
};

type SquareLoyaltyProgram = {
  id: string;
  status?: string;
  terminology?: {
    one?: string;
    other?: string;
  };
  reward_tiers?: Array<{
    id: string;
    points: number;
    name?: string;
  }>;
};

type SquareLoyaltyEvent = {
  id?: string;
  type?: string;
  loyalty_account_id?: string;
  source?: string;
  created_at?: string;
  adjust_points?: {
    points?: number;
    reason?: string;
  };
  accumulate_points?: {
    points?: number;
    order_id?: string;
  };
};

type RetrieveLoyaltyProgramResponse = {
  program?: SquareLoyaltyProgram;
};

type SearchLoyaltyAccountsResponse = {
  loyalty_accounts?: SquareLoyaltyAccount[];
  cursor?: string;
};

type SearchLoyaltyEventsResponse = {
  events?: SquareLoyaltyEvent[];
  cursor?: string;
};

type CreateLoyaltyAccountResponse = {
  loyalty_account?: SquareLoyaltyAccount;
};

type AdjustLoyaltyPointsResponse = {
  event?: {
    id?: string;
    type?: string;
  };
};

type AccumulateLoyaltyPointsResponse = {
  events?: SquareLoyaltyEvent[];
};

const SIGNUP_BONUS_REASONS = new Set([
  "website signup bonus",
  "default signup bonus",
  "signup bonus",
]);

export async function getSquareLoyaltyProgram() {
  const result = await squareRequest<RetrieveLoyaltyProgramResponse>(
    "/v2/loyalty/programs/main",
  );

  if (!result.program?.id) {
    throw new Error("Square did not return an active loyalty program.");
  }

  return result.program;
}

export async function findSquareLoyaltyAccountByCustomerId(customerId: string) {
  if (!customerId.trim()) return null;

  const result = await squareRequest<SearchLoyaltyAccountsResponse>(
    "/v2/loyalty/accounts/search",
    {
      method: "POST",
      body: JSON.stringify({
        query: {
          customer_ids: [customerId.trim()],
        },
        limit: 1,
      }),
    },
  );

  return result.loyalty_accounts?.[0] ?? null;
}

export async function listAllSquareLoyaltyAccounts() {
  const accounts: SquareLoyaltyAccount[] = [];
  let cursor: string | undefined;

  do {
    const result = await squareRequest<SearchLoyaltyAccountsResponse>(
      "/v2/loyalty/accounts/search",
      {
        method: "POST",
        body: JSON.stringify({
          query: {},
          limit: 200,
          ...(cursor ? { cursor } : {}),
        }),
      },
    );

    accounts.push(...(result.loyalty_accounts ?? []));
    cursor = result.cursor || undefined;
  } while (cursor);

  return accounts;
}

export async function createSquareLoyaltyAccount(input: {
  customerId: string;
  phone: string;
  requestId?: string;
}) {
  const phone = normalizeAustralianPhone(input.phone);
  if (!phone) throw new Error("A valid phone number is required for Square Loyalty.");

  const program = await getSquareLoyaltyProgram();
  const result = await squareRequest<CreateLoyaltyAccountResponse>(
    "/v2/loyalty/accounts",
    {
      method: "POST",
      body: JSON.stringify({
        loyalty_account: {
          program_id: program.id,
          customer_id: input.customerId,
          mapping: {
            phone_number: phone,
          },
        },
        idempotency_key: (
          input.requestId || `nbh-loyalty-${input.customerId}-${randomUUID()}`
        ).slice(0, 128),
      }),
    },
  );

  if (!result.loyalty_account?.id) {
    throw new Error("Square did not return a loyalty account.");
  }

  return result.loyalty_account;
}

export async function adjustSquareLoyaltyPoints(input: {
  accountId: string;
  points: number;
  reason: string;
  requestId?: string;
}) {
  if (!Number.isInteger(input.points) || input.points === 0) {
    throw new Error("Square Loyalty points adjustment must be a non-zero integer.");
  }

  return squareRequest<AdjustLoyaltyPointsResponse>(
    `/v2/loyalty/accounts/${encodeURIComponent(input.accountId)}/adjust`,
    {
      method: "POST",
      body: JSON.stringify({
        idempotency_key: (
          input.requestId ||
          `nbh-loyalty-adjust-${input.accountId}-${randomUUID()}`
        ).slice(0, 128),
        adjust_points: {
          points: input.points,
          reason: input.reason,
        },
      }),
    },
  );
}

export async function accumulateSquareLoyaltyPoints(input: {
  accountId: string;
  orderId: string;
  locationId: string;
  requestId?: string;
}) {
  const accountId = input.accountId.trim();
  const orderId = input.orderId.trim();
  const locationId = input.locationId.trim();

  if (!accountId || !orderId || !locationId) {
    throw new Error(
      "Square Loyalty account, order, and location IDs are required to accumulate points.",
    );
  }

  return squareRequest<AccumulateLoyaltyPointsResponse>(
    `/v2/loyalty/accounts/${encodeURIComponent(accountId)}/accumulate`,
    {
      method: "POST",
      body: JSON.stringify({
        accumulate_points: {
          order_id: orderId,
        },
        location_id: locationId,
        idempotency_key: (
          input.requestId || `nbh-loyalty-order-${orderId}`
        ).slice(0, 128),
      }),
    },
  );
}

export async function hasSquareSignupBonus(accountId: string) {
  let cursor: string | undefined;

  do {
    const result = await squareRequest<SearchLoyaltyEventsResponse>(
      "/v2/loyalty/events/search",
      {
        method: "POST",
        body: JSON.stringify({
          query: {
            filter: {
              loyalty_account_filter: {
                loyalty_account_id: accountId,
              },
              type_filter: {
                types: ["ADJUST_POINTS"],
              },
            },
          },
          limit: 30,
          ...(cursor ? { cursor } : {}),
        }),
      },
    );

    const hasBonus = (result.events ?? []).some((event) => {
      const reason = event.adjust_points?.reason?.trim().toLowerCase() ?? "";
      return (
        event.type === "ADJUST_POINTS" &&
        event.adjust_points?.points === DRIP_SIGNUP_BONUS &&
        SIGNUP_BONUS_REASONS.has(reason)
      );
    });

    if (hasBonus) return true;
    cursor = result.cursor || undefined;
  } while (cursor);

  return false;
}

export async function ensureSquareSignupBonus(accountId: string) {
  if (!accountId.trim()) {
    throw new Error("Square Loyalty account ID is required.");
  }

  if (await hasSquareSignupBonus(accountId)) {
    return { applied: false };
  }

  await adjustSquareLoyaltyPoints({
    accountId,
    points: DRIP_SIGNUP_BONUS,
    reason: "Default signup bonus",
    requestId: `nbh-loyalty-signup-${accountId}`,
  });

  return { applied: true };
}

export async function findOrCreateSquareLoyaltyAccount(input: {
  customerId: string;
  phone: string;
  requestId?: string;
}) {
  const existing = await findSquareLoyaltyAccountByCustomerId(input.customerId);
  if (existing) return { account: existing, created: false };

  const account = await createSquareLoyaltyAccount(input);
  return { account, created: true };
}
