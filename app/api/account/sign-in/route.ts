import { getAdminClientOrNull } from "../../../lib/supabase/admin";
import { createClient } from "../../../lib/supabase/server";

const INVALID_CREDENTIALS = "Invalid email, mobile number or password.";

function phoneVariants(value: string) {
  const normalized = value.trim().replace(/[()\s-]/g, "");

  if (/^04\d{8}$/.test(normalized)) {
    return [normalized, `+61${normalized.slice(1)}`];
  }

  if (/^\+614\d{8}$/.test(normalized)) {
    return [normalized, `0${normalized.slice(3)}`];
  }

  return null;
}

export async function POST(request: Request) {
  let body: { identifier?: unknown; password?: unknown };

  try {
    body = (await request.json()) as { identifier?: unknown; password?: unknown };
  } catch {
    return Response.json({ ok: false, error: INVALID_CREDENTIALS }, { status: 400 });
  }

  const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!identifier || !password || identifier.length > 180 || password.length > 256) {
    return Response.json({ ok: false, error: INVALID_CREDENTIALS }, { status: 400 });
  }

  let email = identifier.toLowerCase();

  if (!identifier.includes("@")) {
    const variants = phoneVariants(identifier);
    const admin = getAdminClientOrNull();

    if (!variants || !admin) {
      return Response.json({ ok: false, error: INVALID_CREDENTIALS }, { status: 401 });
    }

    const { data, error } = await admin
      .from("customers")
      .select("email,phone")
      .in("phone", variants)
      .limit(2);

    if (error || !data || data.length !== 1 || !data[0]?.email) {
      return Response.json({ ok: false, error: INVALID_CREDENTIALS }, { status: 401 });
    }

    email = String(data[0].email).trim().toLowerCase();
  }

  const supabase = await createClient();
  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return Response.json({ ok: false, error: INVALID_CREDENTIALS }, { status: 401 });
  }

  return Response.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
