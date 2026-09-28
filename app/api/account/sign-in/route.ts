import { enforceAuthRateLimit } from "../../../lib/rate-limit";
import { NO_STORE_HEADERS, validateJsonRequest } from "../../../lib/request-security";
import { getAdminClientOrNull } from "../../../lib/supabase/admin";
import { createClient } from "../../../lib/supabase/server";

const INVALID_CREDENTIALS = "Invalid email, mobile number or password.";
const TOO_MANY_ATTEMPTS = "Too many sign-in attempts. Please try again later.";
const SERVICE_UNAVAILABLE = "Sign in is temporarily unavailable. Please try again.";

function phoneVariants(value: string) {
  const normalized = value.trim().replace(/[()\s-]/g, "");

  if (/^04\d{8}$/.test(normalized)) {
    return [normalized, `+61${normalized.slice(1)}`];
  }

  if (/^\+614\d{8}$/.test(normalized)) {
    return [normalized, `0${normalized.slice(3)}`];
  }

  return null;
}

export async function POST(request: Request) {
  const requestGuard = validateJsonRequest(request, 8_192);
  if (!requestGuard.ok) {
    return Response.json(
      { ok: false, error: INVALID_CREDENTIALS },
      { status: requestGuard.status, headers: NO_STORE_HEADERS },
    );
  }

  let body: { identifier?: unknown; password?: unknown };

  try {
    body = (await request.json()) as { identifier?: unknown; password?: unknown };
  } catch {
    return Response.json(
      { ok: false, error: INVALID_CREDENTIALS },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!identifier || !password || identifier.length > 180 || password.length > 256) {
    return Response.json(
      { ok: false, error: INVALID_CREDENTIALS },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const rateLimit = await enforceAuthRateLimit(
    request,
    "customer-sign-in",
    identifier,
    5,
    600,
  );

  if (!rateLimit.ok) {
    return Response.json(
      {
        ok: false,
        error:
          rateLimit.status === 429 ? TOO_MANY_ATTEMPTS : SERVICE_UNAVAILABLE,
      },
      {
        status: rateLimit.status,
        headers: rateLimit.retryAfter
          ? { "Retry-After": String(rateLimit.retryAfter), "Cache-Control": "no-store" }
          : { "Cache-Control": "no-store" },
      },
    );
  }

  let email = identifier.toLowerCase();

  if (!identifier.includes("@")) {
    const variants = phoneVariants(identifier);
    const admin = getAdminClientOrNull();

    if (!variants || !admin) {
      return Response.json(
        { ok: false, error: INVALID_CREDENTIALS },
        { status: 401, headers: NO_STORE_HEADERS },
      );
    }

    const { data, error } = await admin
      .from("customers")
      .select("email,phone")
      .in("phone", variants)
      .limit(2);

    if (error || !data || data.length !== 1 || !data[0]?.email) {
      return Response.json(
      { ok: false, error: INVALID_CREDENTIALS },
      { status: 401, headers: NO_STORE_HEADERS },
    );
    }

    email = String(data[0].email).trim().toLowerCase();
  }

  const supabase = await createClient();
  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return Response.json({ ok: false, error: INVALID_CREDENTIALS }, { status: 401 });
  }

  return Response.json(
    { ok: true },
    { headers: NO_STORE_HEADERS },
  );
}
