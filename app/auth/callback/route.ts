import { NextResponse } from "next/server";
import { findOrCreateSquareCustomer } from "../../lib/square/customers";
import {
  createClient,
  isSupabaseServerConfigured,
} from "../../lib/supabase/server";

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

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next");
  const next =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/account";

  if (!isSupabaseServerConfigured()) {
    return NextResponse.redirect(
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

        // Google OAuth normally provides a verified email and display name but no
        // mobile number. Keep the public profile useful immediately and let the
        // customer add their phone from Account before Square customer syncing.
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

        if (name && phone) {
          try {
            await findOrCreateSquareCustomer({
              name,
              email: user.email,
              phone,
              requestId: user.id,
            });
          } catch (squareError) {
            console.error("[NBH signup Square sync]", squareError);
          }
        }
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL("/account/sign-in?error=callback", requestUrl.origin),
  );
}
