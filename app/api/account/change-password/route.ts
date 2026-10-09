import { enforceAuthRateLimit } from "../../../lib/rate-limit";
import { NO_STORE_HEADERS, validateJsonRequest } from "../../../lib/request-security";
import { createClient, isSupabaseServerConfigured } from "../../../lib/supabase/server";

const UPDATE_FAILED = "We could not update your password. Please try again or use password recovery.";
const REAUTH_FAILED = "We could not verify your current password. Please check it and try again.";

function reply(ok: boolean, status: number, error?: string, retryAfter?: number) {
  return Response.json(
    { ok, ...(error ? { error } : {}) },
    {
      status,
      headers: retryAfter
        ? { ...NO_STORE_HEADERS, "Retry-After": String(retryAfter) }
        : NO_STORE_HEADERS,
    },
  );
}

export async function POST(request: Request) {
  const guard = validateJsonRequest(request, 12_288);
  if (!guard.ok) return reply(false, guard.status, UPDATE_FAILED);

  let body: { currentPassword?: unknown; newPassword?: unknown };
  try {
    body = await request.json();
  } catch {
    return reply(false, 400, UPDATE_FAILED);
  }

  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword : "";

  if (
    !currentPassword ||
    currentPassword.length > 256 ||
    newPassword.length < 10 ||
    newPassword.length > 256 ||
    currentPassword === newPassword
  ) {
    return reply(false, 400, "Use a different new password with 10–256 characters.");
  }

  if (!isSupabaseServerConfigured()) {
    return reply(false, 503, "Password changes are temporarily unavailable.");
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.email) {
      return reply(false, 401, "Please sign in again to change your password.");
    }

    // Fail closed if the limiter is unavailable. Count attempts per account and IP.
    const limit = await enforceAuthRateLimit(
      request,
      "customer-change-password",
      user.id,
      5,
      600,
    );
    if (!limit.ok) {
      return reply(
        false,
        limit.status,
        limit.status === 429
          ? "Too many attempts. Please try again later."
          : "Password changes are temporarily unavailable.",
        limit.retryAfter,
      );
    }

    // Reauthenticate with the existing password; never change credentials on
    // the strength of an existing session alone.
    const { data: verified, error: verifyError } =
      await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
    if (verifyError || !verified.user || verified.user.id !== user.id) {
      return reply(false, 401, REAUTH_FAILED);
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (updateError) return reply(false, 400, UPDATE_FAILED);

    return reply(true, 200);
  } catch {
    return reply(false, 503, UPDATE_FAILED);
  }
}
