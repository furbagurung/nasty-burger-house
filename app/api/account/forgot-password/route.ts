import { enforceAuthRateLimit } from "../../../lib/rate-limit";
import { NO_STORE_HEADERS, validateJsonRequest } from "../../../lib/request-security";
import { createClient } from "../../../lib/supabase/server";

const GENERIC_MESSAGE =
  "If an account exists for that email, a password reset link is on the way.";

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
  const requestGuard = validateJsonRequest(request, 8_192);
  if (!requestGuard.ok) {
    return Response.json(
      { ok: true, message: GENERIC_MESSAGE },
      { status: requestGuard.status, headers: NO_STORE_HEADERS },
    );
  }

  let body: { email?: unknown };

  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: true, message: GENERIC_MESSAGE });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ ok: true, message: GENERIC_MESSAGE });
  }

  const rateLimit = await enforceAuthRateLimit(
    request,
    "password-recovery",
    email,
    3,
    3600,
  );

  if (!rateLimit.ok) {
    return Response.json(
      { ok: true, message: GENERIC_MESSAGE },
      {
        headers: rateLimit.retryAfter
          ? { "Retry-After": String(rateLimit.retryAfter), "Cache-Control": "no-store" }
          : NO_STORE_HEADERS,
      },
    );
  }

  const supabase = await createClient();
  const redirectTo = `${configuredSiteOrigin(request)}/auth/callback?next=/account/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    console.warn("[NBH password recovery]", { code: error.code });
  }

  return Response.json(
    { ok: true, message: GENERIC_MESSAGE },
    { headers: NO_STORE_HEADERS },
  );
}
