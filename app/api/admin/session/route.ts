import { verifyAdmin } from "../../../lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await verifyAdmin();

  if (!auth.ok) {
    const status =
      auth.reason === "unauthenticated"
        ? 401
        : auth.reason === "forbidden"
          ? 403
          : 503;
    return Response.json({ ok: false, reason: auth.reason }, { status });
  }

  return Response.json(
    { ok: true, email: auth.user.email ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
