import "server-only";

import { randomUUID } from "node:crypto";
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

type RetrieveLoyaltyProgramResponse = {
  program?: SquareLoyaltyProgram;
};

type SearchLoyaltyAccountsResponse = {
  loyalty_accounts?: SquareLoyaltyAccount[];
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
