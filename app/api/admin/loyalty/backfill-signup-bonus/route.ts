import { verifyAdmin } from "../../../../lib/admin-auth";
import {
  ensureSquareSignupBonus,
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
      missingCount: missing.length,
      missing,
    });
  } catch (error) {
    console.error("[NBH Square loyalty backfill preview]", error);
    return Response.json(
      { ok: false, error: "Could not preview Square Loyalty signup bonus backfill." },
      { status: 502 },
    );
  }
}

export async function POST() {
  const auth = await verifyAdmin();
  if (!auth.ok) return authError(auth.reason);

  try {
    const accounts = await listAllSquareLoyaltyAccounts();
    let applied = 0;
    let skipped = 0;
    const failed: Array<{ loyaltyAccountId: string; error: string }> = [];

    for (const account of accounts) {
      try {
        const result = await ensureSquareSignupBonus(account.id);
        if (result.applied) applied += 1;
        else skipped += 1;
      } catch (error) {
        failed.push({
          loyaltyAccountId: account.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return Response.json({
      ok: failed.length === 0,
      totalAccounts: accounts.length,
      applied,
      skipped,
      failed,
    });
  } catch (error) {
    console.error("[NBH Square loyalty backfill]", error);
    return Response.json(
      { ok: false, error: "Could not backfill Square Loyalty signup bonuses." },
      { status: 502 },
    );
  }
}
