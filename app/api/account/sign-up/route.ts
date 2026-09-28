import { enforceAuthRateLimit } from "../../../lib/rate-limit";
import { NO_STORE_HEADERS, validateJsonRequest } from "../../../lib/request-security";
import { createClient } from "../../../lib/supabase/server";

const GENERIC_ERROR = "We could not create your account. Please check your details and try again.";
const TOO_MANY_ATTEMPTS = "Too many account creation attempts. Please try again later.";
const SERVICE_UNAVAILABLE = "Account creation is temporarily unavailable. Please try again.";

function safeNextPath(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/account";
}

function configuredSiteOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Fall back to the request origin below.
    }
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const requestGuard = validateJsonRequest(request, 16_384);
  if (!requestGuard.ok) {
    return Response.json(
      { ok: false, error: GENERIC_ERROR },
      { status: requestGuard.status, headers: NO_STORE_HEADERS },
    );
  }

  let body: {
    name?: unknown;
    email?: unknown;
    phone?: unknown;
    password?: unknown;
    next?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: GENERIC_ERROR }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone =
    typeof body.phone === "string"
      ? body.phone.trim().replace(/[()\s-]/g, "")
      : "";
  const password = typeof body.password === "string" ? body.password : "";
  const next = safeNextPath(body.next);

  if (
    name.length < 2 ||
    name.length > 80 ||
    email.length > 160 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !/^(?:\+61|0)4\d{8}$/.test(phone) ||
    password.length < 10 ||
    password.length > 256
  ) {
    return Response.json({ ok: false, error: GENERIC_ERROR }, { status: 400 });
  }

  const rateLimit = await enforceAuthRateLimit(
    request,
    "customer-sign-up",
    email,
    4,
    3600,
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
          : NO_STORE_HEADERS,
      },
    );
  }

  const supabase = await createClient();
  const emailRedirectTo = `${configuredSiteOrigin(request)}/auth/callback?next=${encodeURIComponent(next)}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: { name, phone },
    },
  });

  if (error) {
    console.warn("[NBH signup rejected]", { code: error.code });
    return Response.json({ ok: false, error: GENERIC_ERROR }, { status: 400 });
  }

  return Response.json(
    {
      ok: true,
      signedIn: Boolean(data.session),
      confirmationRequired: !data.session,
    },
    { headers: NO_STORE_HEADERS },
  );
}
