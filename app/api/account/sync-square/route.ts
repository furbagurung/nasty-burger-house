import { consumeRateLimit, requestIp } from "../../../lib/rate-limit";
import { createClient } from "../../../lib/supabase/server";
import { findOrCreateSquareCustomer } from "../../../lib/square/customers";
import {
  ensureSquareSignupBonus,
  findOrCreateSquareLoyaltyAccount,
  findSquareLoyaltyAccountByCustomerId,
} from "../../../lib/square/loyalty";

const MAX_REQUEST_BYTES = 5_000;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return Response.json(
      { ok: false, error: "Invalid request." },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

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

  const userLimit = await consumeRateLimit({
    scope: "account-square-sync",
    key: `user:${user.id}`,
    limit: 6,
    windowSeconds: 600,
  });

  if (!userLimit.ok) {
    return Response.json(
      { ok: false, error: "Too many requests. Please try again later." },
      {
        status: userLimit.status,
        headers: userLimit.retryAfter
          ? { "Retry-After": String(userLimit.retryAfter), "Cache-Control": "no-store" }
          : { "Cache-Control": "no-store" },
      },
    );
  }

  const ip = requestIp(request);
  if (ip) {
    const ipLimit = await consumeRateLimit({
      scope: "account-square-sync",
      key: `ip:${ip}`,
      limit: 12,
      windowSeconds: 600,
    });
    if (!ipLimit.ok) {
      return Response.json(
        { ok: false, error: "Too many requests. Please try again later." },
        {
          status: ipLimit.status,
          headers: ipLimit.retryAfter
            ? { "Retry-After": String(ipLimit.retryAfter), "Cache-Control": "no-store" }
            : { "Cache-Control": "no-store" },
        },
      );
    }
  }

  let body: {
    name?: unknown;
    phone?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Invalid request." },
      { status: 400 },
    );
  }

  const submittedName = typeof body.name === "string" ? body.name.trim() : "";
  const submittedPhone =
    typeof body.phone === "string" ? body.phone.trim().replace(/[()\s-]/g, "") : "";

  const name =
    submittedName ||
    String(user.user_metadata?.name ?? "").trim().slice(0, 80) ||
    user.email.split("@")[0]?.slice(0, 80) ||
    "Customer";

  const phone =
    submittedPhone ||
    String(user.user_metadata?.phone ?? "").trim().replace(/[()\s-]/g, "");

  if (
    name.length < 2 ||
    name.length > 80 ||
    !/^(?:\+61|0)4\d{8}$/.test(phone)
  ) {
    return Response.json(
      { ok: false, error: "Enter a valid Australian mobile number." },
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
