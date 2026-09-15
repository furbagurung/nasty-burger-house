import { createClient } from "../../../lib/supabase/server";
import { findOrCreateSquareCustomer } from "../../../lib/square/customers";
import {
  ensureSquareSignupBonus,
  findOrCreateSquareLoyaltyAccount,
  findSquareLoyaltyAccountByCustomerId,
} from "../../../lib/square/loyalty";

type LedgerRow = {
  points: number;
  points_status: "pending" | "available" | "void";
};

function availableWebsiteBalance(rows: LedgerRow[]) {
  return rows.reduce(
    (total, entry) =>
      entry.points_status === "available" ? total + Number(entry.points || 0) : total,
    0,
  );
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || !user.email) {
    return Response.json(
      { ok: false, error: "Authentication required." },
      { status: 401 },
    );
  }

  const [profileResult, ledgerResult] = await Promise.all([
    supabase
      .from("customers")
      .select("name,phone")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("drip_ledger")
      .select("points,points_status")
      .eq("customer_id", user.id),
  ]);

  if (profileResult.error) {
    console.error("[NBH Square loyalty profile]", profileResult.error);
    return Response.json(
      { ok: false, error: "Could not load customer profile." },
      { status: 500 },
    );
  }

  if (ledgerResult.error) {
    console.error("[NBH website loyalty ledger]", ledgerResult.error);
    return Response.json(
      { ok: false, error: "Could not load Drip Points." },
      { status: 500 },
    );
  }

  const profile = profileResult.data;
  const websiteBalance = availableWebsiteBalance(
    (ledgerResult.data ?? []) as LedgerRow[],
  );

  const name =
    String(profile?.name ?? "").trim() ||
    String(user.user_metadata?.name ?? "").trim();
  const phone =
    String(profile?.phone ?? "").trim() ||
    String(user.user_metadata?.phone ?? "").trim();

  // Google normally gives us a verified email/name but not a phone number.
  // The website signup bonus already exists in our ledger, so show it straight
  // away instead of displaying 0 while the customer is not yet enrolled in
  // Square Loyalty.
  if (!name || !phone) {
    return Response.json({
      ok: true,
      enrolled: false,
      needsPhone: !phone,
      source: "website",
      balance: websiteBalance,
      websiteBalance,
      lifetimePoints: websiteBalance,
    });
  }

  try {
    const squareCustomer = await findOrCreateSquareCustomer({
      name,
      email: user.email,
      phone,
      requestId: user.id,
    });

    const { account: initialLoyaltyAccount, created } =
      await findOrCreateSquareLoyaltyAccount({
        customerId: squareCustomer.id,
        phone,
        requestId: `nbh-loyalty-${user.id}`,
      });

    const bonus = await ensureSquareSignupBonus(initialLoyaltyAccount.id);
    const loyaltyAccount =
      (await findSquareLoyaltyAccountByCustomerId(squareCustomer.id)) ??
      initialLoyaltyAccount;

    return Response.json({
      ok: true,
      enrolled: true,
      created,
      source: "square",
      signupBonusApplied: bonus.applied,
      squareCustomerId: squareCustomer.id,
      loyaltyAccountId: loyaltyAccount.id,
      balance: loyaltyAccount.balance ?? 0,
      websiteBalance,
      lifetimePoints: loyaltyAccount.lifetime_points ?? 0,
    });
  } catch (error) {
    // Square being temporarily unavailable should never hide points already
    // earned on the website.
    console.error("[NBH Square loyalty status]", error);
    return Response.json({
      ok: true,
      enrolled: false,
      source: "website",
      squareUnavailable: true,
      balance: websiteBalance,
      websiteBalance,
      lifetimePoints: websiteBalance,
    });
  }
}
