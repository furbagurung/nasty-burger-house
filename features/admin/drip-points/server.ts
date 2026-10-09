import "server-only";

import { loadAdminSquareLoyaltyMembers } from "@/app/lib/admin-customers";
import { getSquareLoyaltyProgram } from "@/app/lib/square/loyalty";
import type { DripOverviewData } from "./types";

/** Phase 3A reads Square directly; no balance adjustments or ledger mutations. */
export async function loadDripOverview(): Promise<DripOverviewData> {
  const [accounts, programResult] = await Promise.allSettled([
    loadAdminSquareLoyaltyMembers(),
    getSquareLoyaltyProgram(),
  ]);

  if (accounts.status === "rejected") {
    console.error("[NBH admin Drip Points] Square members unavailable");
  }
  if (programResult.status === "rejected") {
    console.error("[NBH admin Drip Points] Square program unavailable");
  }

  const members = accounts.status === "fulfilled"
    ? accounts.value
        .filter((account) => Boolean(account.loyaltyAccountId))
        .map((account) => ({
          id: account.loyaltyAccountId!,
          squareCustomerId: account.squareCustomerId,
          name: account.name,
          email: account.email,
          phone: account.phone,
          balance: account.balance,
          lifetimePoints: account.lifetimePoints,
          enrolledAt: account.enrolledAt,
        }))
    : [];

  const program = programResult.status === "fulfilled"
    ? {
        status: programResult.value.status ?? null,
        pointsLabel: programResult.value.terminology?.other || "points",
        tiers: (programResult.value.reward_tiers ?? [])
          .filter((tier) => typeof tier.id === "string" && Number.isFinite(tier.points))
          .map((tier) => ({
            id: tier.id,
            name: tier.name?.trim() || null,
            points: tier.points,
          }))
          .sort((a, b) => a.points - b.points),
      }
    : null;

  return {
    members,
    membersAvailable: accounts.status === "fulfilled",
    program,
  };
}
