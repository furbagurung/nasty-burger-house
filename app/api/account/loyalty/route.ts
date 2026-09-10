import { createClient } from "../../../lib/supabase/server";
import { findOrCreateSquareCustomer } from "../../../lib/square/customers";
import { findOrCreateSquareLoyaltyAccount } from "../../../lib/square/loyalty";

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

  const { data: profile, error: profileError } = await supabase
    .from("customers")
    .select("name,phone")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[NBH Square loyalty profile]", profileError);
    return Response.json(
      { ok: false, error: "Could not load customer profile." },
      { status: 500 },
    );
  }

  const name =
    String(profile?.name ?? "").trim() ||
    String(user.user_metadata?.name ?? "").trim();
  const phone =
    String(profile?.phone ?? "").trim() ||
    String(user.user_metadata?.phone ?? "").trim();

  if (!name || !phone) {
    return Response.json(
      { ok: false, error: "Name and phone number are required for Square Loyalty." },
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

    const { account: loyaltyAccount, created } =
      await findOrCreateSquareLoyaltyAccount({
        customerId: squareCustomer.id,
        phone,
        requestId: `nbh-loyalty-${user.id}`,
      });

    return Response.json({
      ok: true,
      enrolled: true,
      created,
      squareCustomerId: squareCustomer.id,
      loyaltyAccountId: loyaltyAccount.id,
      balance: loyaltyAccount.balance ?? 0,
      lifetimePoints: loyaltyAccount.lifetime_points ?? 0,
    });
  } catch (error) {
    console.error("[NBH Square loyalty status]", error);
    return Response.json(
      { ok: false, error: "Could not load Square Loyalty status." },
      { status: 502 },
    );
  }
}
