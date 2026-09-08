import { NextResponse } from "next/server";
import { findOrCreateSquareCustomer } from "../../lib/square/customers";
import {
  createClient,
  isSupabaseServerConfigured,
} from "../../lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next");
  const next = requestedNext?.startsWith("/") ? requestedNext : "/account";

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
        const name = String(user.user_metadata?.name ?? "").trim();
        const phone = String(user.user_metadata?.phone ?? "").trim();

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
