import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminReviewStatus = "pending" | "published" | "hidden" | "flagged";

export type AdminReview = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  orderId: string;
  rating: number;
  message: string;
  status: AdminReviewStatus;
  createdAt: string;
  updatedAt: string;
};

type ReviewRow = {
  id: string;
  customer_id: string;
  order_id: string;
  rating: number;
  message: string;
  status: AdminReviewStatus;
  created_at: string;
  updated_at: string;
};

type CustomerRow = {
  id: string;
  name: string;
  email: string;
};

export async function loadAdminReviews(admin: SupabaseClient) {
  const { data, error } = await admin
    .from("reviews")
    .select(
      "id,customer_id,order_id,rating,message,status,created_at,updated_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[NBH admin reviews load failed]", error.code);
    return [] as AdminReview[];
  }

  const rows = (data ?? []) as ReviewRow[];
  const customerIds = Array.from(new Set(rows.map((row) => row.customer_id)));
  const customers = new Map<string, CustomerRow>();

  if (customerIds.length > 0) {
    const customerResult = await admin
      .from("customers")
      .select("id,name,email")
      .in("id", customerIds);

    if (customerResult.error) {
      console.error(
        "[NBH admin review customer load failed]",
        customerResult.error.code,
      );
    } else {
      ((customerResult.data ?? []) as CustomerRow[]).forEach((customer) => {
        customers.set(customer.id, customer);
      });
    }
  }

  return rows.map((row) => {
    const customer = customers.get(row.customer_id);
    return {
      id: row.id,
      customerId: row.customer_id,
      customerName: customer?.name || "Customer",
      customerEmail: customer?.email || "",
      orderId: row.order_id,
      rating: row.rating,
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}
