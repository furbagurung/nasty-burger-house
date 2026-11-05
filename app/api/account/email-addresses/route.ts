import { createHash, randomBytes } from "node:crypto";
import { consumeRateLimit } from "../../../lib/rate-limit";
import { NO_STORE_HEADERS, validateJsonRequest } from "../../../lib/request-security";
import { normalizeAccountEmail } from "../../../lib/account-email-aliases";
import { getAdminClientOrNull } from "../../../lib/supabase/admin";
import { createClient } from "../../../lib/supabase/server";

const MAX_ALIASES = 3;
const TOKEN_LIFETIME_MS = 60 * 60 * 1000;

async function authenticatedAccount() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return error || !user?.email || !user.email_confirmed_at ? null : user;
}

export async function GET() {
  const user = await authenticatedAccount();
  if (!user) return Response.json({ ok: false, error: "Sign in required." }, { status: 401, headers: NO_STORE_HEADERS });
  const admin = getAdminClientOrNull();
  if (!admin) return Response.json({ ok: false, error: "Service unavailable." }, { status: 503, headers: NO_STORE_HEADERS });
  const { data, error } = await admin.from("customer_email_aliases")
    .select("email,verified_at,expires_at")
    .eq("user_id", user.id).order("created_at", { ascending: true });
  if (error) return Response.json({ ok: false, error: "Could not load email addresses." }, { status: 503, headers: NO_STORE_HEADERS });
  return Response.json({
    ok: true,
    primary: user.email,
    aliases: (data ?? []).map((row) => ({
      email: row.email,
      verified: Boolean(row.verified_at),
      pending: !row.verified_at && Boolean(row.expires_at && new Date(row.expires_at) > new Date()),
    })),
  }, { headers: NO_STORE_HEADERS });
}

export async function POST(request: Request) {
  const guard = validateJsonRequest(request, 2048);
  if (!guard.ok) return Response.json({ ok: false, error: guard.error }, { status: guard.status, headers: NO_STORE_HEADERS });
  const user = await authenticatedAccount();
  if (!user) return Response.json({ ok: false, error: "Sign in required." }, { status: 401, headers: NO_STORE_HEADERS });
  const body = await request.json().catch(() => null) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? normalizeAccountEmail(body.email) : "";
  if (!email || email === normalizeAccountEmail(user.email!)) {
    return Response.json({ ok: false, error: "Enter a different, valid email address." }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const limited = await consumeRateLimit({
    scope: "email-alias-link", key: user.id, limit: 6, windowSeconds: 3600,
  });
  if (!limited.ok) return Response.json(
    { ok: false, error: limited.status === 429 ? "Too many requests. Try again later." : "Service unavailable." },
    { status: limited.status, headers: NO_STORE_HEADERS },
  );

  const admin = getAdminClientOrNull();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.ACCOUNT_EMAIL_FROM?.trim() || process.env.ORDER_NOTIFICATION_FROM?.trim();
  if (!admin || !apiKey || !from) {
    return Response.json({ ok: false, error: "Email verification is not configured." }, { status: 503, headers: NO_STORE_HEADERS });
  }
  const { data: owned, error: ownedError } = await admin.from("customer_email_aliases")
    .select("email,verified_at").eq("user_id", user.id);
  if (ownedError) return Response.json({ ok: false, error: "Service unavailable." }, { status: 503, headers: NO_STORE_HEADERS });
  if ((owned ?? []).filter((item) => Boolean(item.verified_at)).length >= MAX_ALIASES &&
      !(owned ?? []).some((item) => item.email === email)) {
    return Response.json({ ok: false, error: "You can link up to three additional emails." }, { status: 409, headers: NO_STORE_HEADERS });
  }

  const { data: existing, error: readError } = await admin.from("customer_email_aliases")
    .select("user_id,verified_at").eq("email", email).maybeSingle();
  if (readError) return Response.json({ ok: false, error: "Service unavailable." }, { status: 503, headers: NO_STORE_HEADERS });
  if (existing && existing.user_id !== user.id) {
    return Response.json({ ok: false, error: "This email cannot be linked to this account." }, { status: 409, headers: NO_STORE_HEADERS });
  }
  if (existing?.verified_at) {
    return Response.json({ ok: true, message: "This email is already verified." }, { headers: NO_STORE_HEADERS });
  }
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_MS).toISOString();
  const row = { email, user_id: user.id, verified_at: null, token_hash: tokenHash, expires_at: expiresAt, updated_at: new Date().toISOString() };
  const saved = existing
    ? await admin.from("customer_email_aliases").update(row).eq("email", email).eq("user_id", user.id)
    : await admin.from("customer_email_aliases").insert(row);
  if (saved.error) {
    return Response.json({ ok: false, error: "This email cannot be linked to this account." }, { status: 409, headers: NO_STORE_HEADERS });
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  let origin: string;
  try {
    origin = new URL(configured || request.url).origin;
  } catch {
    origin = new URL(request.url).origin;
  }
  const link = `${origin}/account/verify-email#token=${token}`;
  let delivered = false;
  try {
    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to: [email],
        subject: "Verify your additional Nasty Burger House email",
        text: `You requested to add this email to your Nasty Burger House account. Open this link to confirm it within 60 minutes:\n\n${link}\n\nIf you did not request this, ignore this email.\n`,
        html: `<p>Verify this additional email for your Nasty Burger House account.</p><p><a href="${link}">Verify email</a> (valid for 60 minutes)</p><p>If you didn't request this, ignore the message.</p>`,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    delivered = sent.ok;
  } catch {
    delivered = false;
  }
  if (!delivered) {
    // Failed delivery must not leave a reusable or indefinitely reserved token.
    await admin.from("customer_email_aliases").delete()
      .eq("email", email).eq("user_id", user.id).eq("token_hash", tokenHash).is("verified_at", null);
    return Response.json({ ok: false, error: "Verification email could not be sent. Try again." }, { status: 503, headers: NO_STORE_HEADERS });
  }
  return Response.json({ ok: true, message: "Verification link sent. Check your inbox." }, { headers: NO_STORE_HEADERS });
}

export async function DELETE(request: Request) {
  const guard = validateJsonRequest(request, 2048);
  if (!guard.ok) return Response.json({ ok: false, error: guard.error }, { status: guard.status, headers: NO_STORE_HEADERS });
  const user = await authenticatedAccount();
  if (!user) return Response.json({ ok: false, error: "Sign in required." }, { status: 401, headers: NO_STORE_HEADERS });
  const body = await request.json().catch(() => null) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? normalizeAccountEmail(body.email) : "";
  if (!email || email === normalizeAccountEmail(user.email!)) {
    return Response.json({ ok: false, error: "Primary email cannot be removed here." }, { status: 400, headers: NO_STORE_HEADERS });
  }
  const admin = getAdminClientOrNull();
  if (!admin) return Response.json({ ok: false, error: "Service unavailable." }, { status: 503, headers: NO_STORE_HEADERS });
  const { error } = await admin.from("customer_email_aliases").delete().eq("email", email).eq("user_id", user.id);
  if (error) return Response.json({ ok: false, error: "Could not remove email." }, { status: 503, headers: NO_STORE_HEADERS });
  return Response.json({ ok: true }, { headers: NO_STORE_HEADERS });
}
