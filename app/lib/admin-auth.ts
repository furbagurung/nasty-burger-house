import "server-only";

import { getAdminClientOrNull } from "./supabase/admin";
import { getServerClientOrNull } from "./supabase/server";

export type AdminAuthResult =
  | {
      ok: true;
      user: { id: string; email?: string };
      admin: NonNullable<ReturnType<typeof getAdminClientOrNull>>;
    }
  | {
      ok: false;
      reason: "not-configured" | "unauthenticated" | "forbidden";
    };

export async function verifyAdmin(): Promise<AdminAuthResult> {
  const [supabase, admin] = await Promise.all([
    getServerClientOrNull(),
    Promise.resolve(getAdminClientOrNull()),
  ]);

  if (!supabase || !admin) {
    return { ok: false, reason: "not-configured" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "unauthenticated" };
  }

  const { data: membership, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !membership) {
    return { ok: false, reason: "forbidden" };
  }

  return {
    ok: true,
    user: { id: user.id, email: user.email },
    admin,
  };
}
