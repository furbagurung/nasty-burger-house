import { createClient } from "../../../lib/supabase/server";
import { findOrCreateSquareCustomer } from "../../../lib/square/customers";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || !user.email) {
    return Response.json(
      { ok: false, error: "Authentication required." },
      { status: 401 },
    );
  }

  let body: {
    name?: string;
    phone?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Invalid request." },
      { status: 400 },
    );
  }

  const name =
    body.name?.trim() ||
    String(user.user_metadata?.name ?? "").trim();

  const phone =
    body.phone?.trim() ||
    String(user.user_metadata?.phone ?? "").trim();

  if (!name || !phone) {
    return Response.json(
      { ok: false, error: "Name and phone number are required." },
      { status: 400 },
    );
  }

  try {
    const squareCustomer = await findOrCreateSquareCustomer({
      name,
      email: user.email,
      phone,
      requestId: user.id,
    });

    return Response.json({
      ok: true,
      squareCustomerId: squareCustomer.id,
      created: squareCustomer.created,
    });
  } catch (error) {
    console.error("[NBH account Square sync]", error);

    return Response.json(
      { ok: false, error: "Could not sync customer with Square." },
      { status: 502 },
    );
  }
}