import { verifyAdmin } from "../../../lib/admin-auth";
import { reportAdminError } from "../../../lib/error-monitoring";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await verifyAdmin();

  if (!auth.ok) {
    const status =
      auth.reason === "unauthenticated"
        ? 401
        : auth.reason === "forbidden"
          ? 403
          : 503;

    return Response.json(
      { ok: false, reason: auth.reason },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }

  const result = await reportAdminError(
    new Error("Manual production error-alert test"),
    {
      source: "server",
      path: "/api/admin/error-test",
      method: "POST",
      routePath: "/api/admin/error-test",
      routeType: "route",
      metadata: {
        test: true,
      },
    },
  );

  return Response.json(
    result.ok
      ? { ok: true, message: "Test error alert sent." }
      : { ok: false, reason: result.reason },
    {
      status: result.ok ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
