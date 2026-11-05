import { createHash } from "node:crypto";
import { getAdminClientOrNull } from "../../../../lib/supabase/admin";
import { NO_STORE_HEADERS, validateJsonRequest } from "../../../../lib/request-security";

export async function POST(request: Request) {
  const guard = validateJsonRequest(request, 512);
  if (!guard.ok) return Response.json({ ok: false, error: "Invalid verification request." }, { status: guard.status, headers: NO_STORE_HEADERS });
  const body = await request.json().catch(() => null) as { token?: unknown } | null;
  const token = typeof body?.token === "string" && /^[a-f0-9]{64}$/.test(body.token) ? body.token : "";
  if (!token) return Response.json({ ok: false, error: "Invalid or expired verification link." }, { status: 400, headers: NO_STORE_HEADERS });
  const admin = getAdminClientOrNull();
  if (!admin) return Response.json({ ok: false, error: "Service unavailable." }, { status: 503, headers: NO_STORE_HEADERS });
  const tokenHash = createHash("sha256").update(token).digest("hex");
  // Single atomic update: a token can only verify one email once, and only before expiry.
  const { data, error } = await admin.from("customer_email_aliases")
    .update({ verified_at: new Date().toISOString(), token_hash: null, expires_at: null, updated_at: new Date().toISOString() })
    .eq("token_hash", tokenHash).is("verified_at", null).gt("expires_at", new Date().toISOString())
    .select("email").maybeSingle();
  if (error || !data) return Response.json(
    { ok: false, error: "Verification failed. The link may have expired or the email belongs to another account." },
    { status: 400, headers: NO_STORE_HEADERS },
  );
  return Response.json({ ok: true, email: data.email }, { headers: NO_STORE_HEADERS });
}
