import { verifyAdmin } from "../../../../../lib/admin-auth";
import type { AdminReviewStatus } from "../../../../../lib/admin-reviews";
import {
  NO_STORE_HEADERS,
  validateJsonRequest,
} from "../../../../../lib/request-security";

const allowedStatuses = new Set<AdminReviewStatus>([
  "pending",
  "published",
  "hidden",
  "flagged",
]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ reviewId: string }> },
) {
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
      { status, headers: NO_STORE_HEADERS },
    );
  }

  const requestGuard = validateJsonRequest(request, 4096);
  if (!requestGuard.ok) {
    return Response.json(
      { ok: false, error: "Invalid request." },
      { status: requestGuard.status, headers: NO_STORE_HEADERS },
    );
  }

  const { reviewId } = await context.params;
  const decodedReviewId = decodeURIComponent(reviewId);

  if (!UUID_PATTERN.test(decodedReviewId)) {
    return Response.json(
      { ok: false, error: "Invalid review." },
      { status: 422, headers: NO_STORE_HEADERS },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Invalid request body." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const statusValue =
    body && typeof body === "object" && "status" in body
      ? String(body.status)
      : "";

  if (!allowedStatuses.has(statusValue as AdminReviewStatus)) {
    return Response.json(
      { ok: false, error: "Invalid review status." },
      { status: 422, headers: NO_STORE_HEADERS },
    );
  }

  const { data: current, error: currentError } = await auth.admin
    .from("reviews")
    .select("id,status")
    .eq("id", decodedReviewId)
    .maybeSingle();

  if (currentError) {
    console.error("[NBH admin review lookup failed]", currentError.code);
    return Response.json(
      { ok: false, error: "Could not update the review." },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }

  if (!current) {
    return Response.json(
      { ok: false, error: "Review not found." },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  const nextStatus = statusValue as AdminReviewStatus;
  const { data, error } = await auth.admin
    .from("reviews")
    .update({ status: nextStatus })
    .eq("id", decodedReviewId)
    .select("id,status,updated_at")
    .single();

  if (error) {
    console.error("[NBH admin review update failed]", error.code);
    return Response.json(
      { ok: false, error: "Could not update the review." },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }

  if (current.status !== nextStatus) {
    const auditResult = await auth.admin.from("admin_audit_log").insert({
      actor_user_id: auth.user.id,
      action: "review.status_changed",
      target_type: "review",
      target_id: decodedReviewId,
      details: {
        from: current.status,
        to: nextStatus,
      },
    });

    if (auditResult.error) {
      console.warn("[NBH admin review audit failed]", auditResult.error.code);
    }
  }

  return Response.json(
    { ok: true, review: data },
    { headers: NO_STORE_HEADERS },
  );
}
