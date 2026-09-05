import "server-only";

import type { createAdminClient } from "./supabase/admin";

export type AdminOrder = {
  id: string;
  submittedAt: string;
  status: "received" | "preparing" | "ready" | "completed" | "cancelled";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerId: string | null;
  pickupLabel: string;
  paymentStatus: string;
  subtotal: number;
  notes: string;
  adminNotificationStatus: "pending" | "sent" | "failed" | "not-configured";
  lines: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    lineTotal: number;
    details: string[];
  }>;
};

type AdminClient = ReturnType<typeof createAdminClient>;

type OrderRow = {
  id: string;
  submitted_at: string;
  status: AdminOrder["status"];
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_id: string | null;
  pickup_label: string;
  payment_status: string;
  subtotal_cents: number;
  notes: string;
  admin_notification_status: AdminOrder["adminNotificationStatus"];
  order_lines: Array<{
    item_id: string;
    item_name: string;
    quantity: number;
    line_total_cents: number;
    configuration: { details?: string[] } | null;
  }> | null;
};

export async function loadAdminOrders(admin: AdminClient, limit = 100) {
  const { data, error } = await admin
    .from("orders")
    .select(
      "id,submitted_at,status,customer_name,customer_email,customer_phone,customer_id,pickup_label,payment_status,subtotal_cents,notes,admin_notification_status,order_lines(item_id,item_name,quantity,line_total_cents,configuration)",
    )
    .order("submitted_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return ((data ?? []) as OrderRow[]).map<AdminOrder>((order) => ({
    id: order.id,
    submittedAt: order.submitted_at,
    status: order.status,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    customerId: order.customer_id,
    pickupLabel: order.pickup_label,
    paymentStatus: order.payment_status,
    subtotal: order.subtotal_cents / 100,
    notes: order.notes,
    adminNotificationStatus: order.admin_notification_status,
    lines: (order.order_lines ?? []).map((line) => ({
      itemId: line.item_id,
      itemName: line.item_name,
      quantity: line.quantity,
      lineTotal: line.line_total_cents / 100,
      details: Array.isArray(line.configuration?.details)
        ? line.configuration!.details!.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
    })),
  }));
}
