import { enforceAuthRateLimit } from "../../../lib/rate-limit";
import { getAdminClientOrNull } from "../../../lib/supabase/admin";
import { createClient } from "../../../lib/supabase/server";

const INVALID = "Invalid credentials or access denied.";
const TOO_MANY = "Too many sign-in attempts. Please try again later.";
const UNAVAILABLE = "Admin sign in is temporarily unavailable. Please try again.";

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };

  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: INVALID }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (
    !email ||
    !password ||
    email.length > 160 ||
    password.length > 256 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return Response.json({ ok: false, error: INVALID }, { status: 400 });
  }

  const rateLimit = await enforceAuthRateLimit(
    request,
    "admin-sign-in",
    email,
    5,
    900,
  );

  if (!rateLimit.ok) {
    return Response.json(
      {
        ok: false,
        error: rateLimit.status === 429 ? TOO_MANY : UNAVAILABLE,
      },
      {
        status: rateLimit.status,
        headers: rateLimit.retryAfter
          ? { "Retry-After": String(rateLimit.retryAfter), "Cache-Control": "no-store" }
          : { "Cache-Control": "no-store" },
      },
    );
  }

  const [supabase, admin] = await Promise.all([
    createClient(),
    Promise.resolve(getAdminClientOrNull()),
  ]);

  if (!admin) {
    return Response.json({ ok: false, error: UNAVAILABLE }, { status: 503 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return Response.json({ ok: false, error: INVALID }, { status: 401 });
  }

  const { data: membership, error: membershipError } = await admin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    await supabase.auth.signOut();
    return Response.json({ ok: false, error: INVALID }, { status: 401 });
  }

  return Response.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
