import { NextResponse } from "next/server";
import { getServerClientOrNull } from "../../lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await getServerClientOrNull();
  if (supabase) {
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(new URL("/admin/login", request.url), {
    status: 303,
  });
}
