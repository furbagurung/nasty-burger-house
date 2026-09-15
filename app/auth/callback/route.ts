import { NextResponse } from "next/server";
import { findOrCreateSquareCustomer } from "../../lib/square/customers";
import {
  ensureSquareSignupBonus,
  findOrCreateSquareLoyaltyAccount,
} from "../../lib/square/loyalty";
import {
  createClient,
  isSupabaseServerConfigured,
} from "../../lib/supabase/server";

const OAUTH_RETURN_COOKIE = "nbh_oauth_return";

function metadataString(
  metadata: Record<string, unknown> | null | undefined,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const encodedName = `${name}=`;
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(encodedName)) continue;
    try {
      return decodeURIComponent(trimmed.slice(encodedName.length));
    } catch {
      return "";
    }
  }
  return "";
}

function safeNextPath(value: string | null | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

function redirectAndClearReturnCookie(url: URL) {
  const response = NextResponse.redirect(url);
  response.cookies.set(OAUTH_RETURN_COOKIE, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
  return response;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext =
    requestUrl.searchParams.get("next") || readCookie(request, OAUTH_RETURN_COOKIE);
  const next = safeNextPath(requestedNext);

  if (!isSupabaseServerConfigured()) {
    return redirectAndClearReturnCookie(
      new URL("/account/sign-in?setup=required", requestUrl.origin),
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        const metadata = user.user_metadata as Record<string, unknown> | undefined;
        const name = metadataString(metadata, "name", "full_name", "display_name");
        const phone = metadataString(metadata, "phone", "phone_number");
        const customerName = name || user.email.split("@")[0] || "Customer";

        if (name || phone) {
          const profileUpdate: { name?: string; phone?: string } = {};
          if (name) profileUpdate.name = name;
          if (phone) profileUpdate.phone = phone;

          const { error: profileError } = await supabase
            .from("customers")
            .update(profileUpdate)
            .eq("id", user.id);

          if (profileError) {
            console.error("[NBH OAuth customer profile sync]", profileError);
          }
        }

        try {
          // Every website account gets a Square Customer Directory profile.
          // Google does not normally provide a phone number, so the customer can
          // exist in Square immediately and be enrolled in Square Loyalty as soon
          // as they add their Australian mobile number in their Nasty account.
          const squareCustomer = await findOrCreateSquareCustomer({
            name: customerName,
            email: user.email,
            ...(phone ? { phone } : {}),
            requestId: user.id,
          });

          if (phone) {
            const { account } = await findOrCreateSquareLoyaltyAccount({
              customerId: squareCustomer.id,
              phone,
              requestId: `nbh-signup-loyalty-${user.id}`,
            });
            await ensureSquareSignupBonus(account.id);
          }
        } catch (squareError) {
          // Account authentication should still succeed if Square is temporarily
          // unavailable. The account/loyalty endpoint retries this sync later.
          console.error("[NBH signup Square sync]", squareError);
        }
      }

      return redirectAndClearReturnCookie(new URL(next, requestUrl.origin));
    }
  }

  return redirectAndClearReturnCookie(
    new URL("/account/sign-in?error=callback", requestUrl.origin),
  );
}
