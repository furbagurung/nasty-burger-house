import { createClient } from "../../../lib/supabase/server";
import { findOrCreateSquareCustomer } from "../../../lib/square/customers";
import {
  ensureSquareSignupBonus,
  findOrCreateSquareLoyaltyAccount,
  findSquareLoyaltyAccountByCustomerId,
} from "../../../lib/square/loyalty";

export async function POST(request: Request) {
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

  let body: {
    name?: string;
    phone?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Invalid request." },
      { status: 400 },
    );
  }

  const name =
    body.name?.trim() ||
    String(user.user_metadata?.name ?? "").trim() ||
    user.email.split("@")[0] ||
    "Customer";

  const phone =
    body.phone?.trim() ||
    String(user.user_metadata?.phone ?? "").trim();

  if (!phone) {
    return Response.json(
      { ok: false, error: "Phone number is required for Square Loyalty." },
      { status: 400 },
    );
  }

  try {
    const squareCustomer = await findOrCreateSquareCustomer({
      name,
      email: user.email,
      phone,
      requestId: user.id,
    });

    const { account: initialLoyaltyAccount, created: loyaltyCreated } =
      await findOrCreateSquareLoyaltyAccount({
        customerId: squareCustomer.id,
        phone,
        requestId: `nbh-signup-loyalty-${user.id}`,
      });

    const bonus = await ensureSquareSignupBonus(initialLoyaltyAccount.id);
    const loyaltyAccount =
      (await findSquareLoyaltyAccountByCustomerId(squareCustomer.id)) ??
      initialLoyaltyAccount;

    return Response.json({
      ok: true,
      squareCustomerId: squareCustomer.id,
      customerCreated: squareCustomer.created,
      loyaltyAccountId: loyaltyAccount.id,
      loyaltyCreated,
      signupBonusApplied: bonus.applied,
      balance: loyaltyAccount.balance ?? 0,
      lifetimePoints: loyaltyAccount.lifetime_points ?? 0,
    });
  } catch (error) {
    console.error("[NBH account Square sync]", error);

    return Response.json(
      { ok: false, error: "Could not sync customer with Square Loyalty." },
      { status: 502 },
    );
  }
}
