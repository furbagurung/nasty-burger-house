import { verifyAdmin } from "../../../../lib/admin-auth";
import {
  hasSquareSignupBonus,
  listAllSquareLoyaltyAccounts,
} from "../../../../lib/square/loyalty";

function maskPhone(phone?: string) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 4 ? `••••${digits.slice(-4)}` : "••••";
}

function authError(reason: "not-configured" | "unauthenticated" | "forbidden") {
  const status = reason === "unauthenticated" ? 401 : reason === "forbidden" ? 403 : 503;
  return Response.json(
    { ok: false, error: `Admin access ${reason}.` },
    { status },
  );
}

export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.ok) return authError(auth.reason);

  try {
    const accounts = await listAllSquareLoyaltyAccounts();
    const missing = [];

    for (const account of accounts) {
      if (!(await hasSquareSignupBonus(account.id))) {
        missing.push({
          loyaltyAccountId: account.id,
          customerId: account.customer_id ?? null,
          phone: maskPhone(account.mapping?.phone_number),
          balance: account.balance ?? 0,
          lifetimePoints: account.lifetime_points ?? 0,
        });
      }
    }

    return Response.json({
      ok: true,
      totalAccounts: accounts.length,
      reviewRequiredCount: missing.length,
      note: "These accounts lack a recognised signup-bonus reason. They may already have received a manual complimentary award; do not credit automatically.",
      reviewRequired: missing,
    });
  } catch (error) {
    console.error("[NBH Square loyalty backfill preview]", error);
    return Response.json(
      { ok: false, error: "Could not preview Square Loyalty signup bonus backfill." },
      { status: 502 },
    );
  }
}

// Never automatically issue past welcome points to existing Square members:
 // Square's manual complimentary credits can have different adjustment reasons,
 // so an automated backfill could accidentally pay the same 500 points twice.
export async function POST() {
  const auth = await verifyAdmin();
  if (!auth.ok) return authError(auth.reason);

  return Response.json(
    {
      ok: false,
      error: "Automatic welcome-point backfill is disabled. Review each Square loyalty account manually before adjusting points.",
    },
    { status: 405 },
  );
}
