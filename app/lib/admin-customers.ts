import "server-only";

import type { User } from "@supabase/supabase-js";
import { getAdminClientOrNull } from "./supabase/admin";

type AdminClient = NonNullable<ReturnType<typeof getAdminClientOrNull>>;

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday: string | null;
  created_at: string;
  updated_at: string;
};

type OrderRow = {
  customer_id: string | null;
  status: string;
  submitted_at: string;
};

type LedgerRow = {
  customer_id: string;
  points: number;
  points_status: string;
};

type AdminUserRow = {
  user_id: string;
};

export type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday: string | null;
  createdAt: string;
  updatedAt: string;
  emailConfirmedAt: string | null;
  lastSignInAt: string | null;
  orderCount: number;
  lastOrderAt: string | null;
  dripPoints: number;
};

function metadataString(user: User, key: string) {
  const value = user.user_metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

export async function loadAdminCustomers(admin: AdminClient): Promise<AdminCustomer[]> {
  const [usersResult, customersResult, ordersResult, ledgerResult, adminsResult] =
    await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin
        .from("customers")
        .select("id,name,email,phone,birthday,created_at,updated_at"),
      admin
        .from("orders")
        .select("customer_id,status,submitted_at")
        .not("customer_id", "is", null),
      admin
        .from("drip_ledger")
        .select("customer_id,points,points_status"),
      admin.from("admin_users").select("user_id"),
    ]);

  if (usersResult.error) throw usersResult.error;
  if (customersResult.error) throw customersResult.error;
  if (ordersResult.error) throw ordersResult.error;
  if (ledgerResult.error) throw ledgerResult.error;
  if (adminsResult.error) throw adminsResult.error;

  const customerRows = (customersResult.data ?? []) as CustomerRow[];
  const orderRows = (ordersResult.data ?? []) as OrderRow[];
  const ledgerRows = (ledgerResult.data ?? []) as LedgerRow[];
  const adminRows = (adminsResult.data ?? []) as AdminUserRow[];

  const profiles = new Map(customerRows.map((row) => [row.id, row]));
  const adminIds = new Set(adminRows.map((row) => row.user_id));

  const ordersByCustomer = new Map<string, OrderRow[]>();
  for (const order of orderRows) {
    if (!order.customer_id) continue;
    const current = ordersByCustomer.get(order.customer_id) ?? [];
    current.push(order);
    ordersByCustomer.set(order.customer_id, current);
  }

  const pointsByCustomer = new Map<string, number>();
  for (const entry of ledgerRows) {
    if (entry.points_status === "void") continue;
    pointsByCustomer.set(
      entry.customer_id,
      (pointsByCustomer.get(entry.customer_id) ?? 0) + entry.points,
    );
  }

  return usersResult.data.users
    .filter((user) => !adminIds.has(user.id))
    .map((user) => {
      const profile = profiles.get(user.id);
      const orders = ordersByCustomer.get(user.id) ?? [];
      const latestOrder = orders
        .map((order) => order.submitted_at)
        .filter(Boolean)
        .sort((a, b) => b.localeCompare(a))[0] ?? null;

      return {
        id: user.id,
        name: profile?.name || metadataString(user, "name") || "Customer",
        email: profile?.email || user.email || "",
        phone: profile?.phone || metadataString(user, "phone") || "",
        birthday: profile?.birthday ?? null,
        createdAt: user.created_at,
        updatedAt: profile?.updated_at || user.updated_at || user.created_at,
        emailConfirmedAt: user.email_confirmed_at ?? null,
        lastSignInAt: user.last_sign_in_at ?? null,
        orderCount: orders.length,
        lastOrderAt: latestOrder,
        dripPoints: pointsByCustomer.get(user.id) ?? 0,
      } satisfies AdminCustomer;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
