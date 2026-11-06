import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Public storefront routes have no server-side customer session dependency.
  // Skip the Supabase auth round trip; private pages and APIs retain refresh.
  const pathname = request.nextUrl.pathname;
  const isPublicStorefront =
    request.method === "GET" &&
    (pathname === "/" ||
      pathname === "/menu" ||
      pathname.startsWith("/menu/") ||
      pathname.startsWith("/product/") ||
      pathname === "/beast-of-the-month" ||
      pathname === "/drip-points" ||
      pathname === "/cart" ||
      pathname === "/checkout" ||
      pathname === "/reviews" ||
      pathname === "/help-support" ||
      pathname === "/privacy-policy" ||
      pathname === "/terms-and-conditions");

  if (isPublicStorefront) {
    return NextResponse.next({ request });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );

        supabaseResponse = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh and cryptographically validate the cookie-backed auth token. The
  // public restaurant site stays public; protected pages/APIs verify their own
  // customer/admin authorization before reading data.
  await supabase.auth.getClaims();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};
