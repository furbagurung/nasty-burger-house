import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  createClient,
  isSupabaseServerConfigured,
} from "../../lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const requestedNext = requestUrl.searchParams.get("next");
  const next = requestedNext?.startsWith("/") ? requestedNext : "/account";

  if (!isSupabaseServerConfigured()) {
    return NextResponse.redirect(
      new URL("/account/sign-in?setup=required", requestUrl.origin),
    );
  }

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL("/account/sign-in?error=confirmation", requestUrl.origin),
  );
}
