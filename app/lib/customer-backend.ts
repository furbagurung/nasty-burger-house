"use client";

import {
  dripBalance,
  readCustomerOrders,
  readCustomerReviews,
  readDripLedger,
  readSignedInCustomerProfile,
  saveCustomerProfile,
  saveCustomerReview,
  signOutCustomer,
  type CustomerOrder,
  type CustomerProfile,
  type CustomerReview,
  type DripLedgerEntry,
} from "./customer-store";
import {
  getBrowserClientOrNull,
  isSupabaseBrowserConfigured,
} from "./supabase/client";

export type CustomerBackendMode = "supabase" | "local-fallback";

export function customerBackendMode(): CustomerBackendMode {
  return isSupabaseBrowserConfigured() ? "supabase" : "local-fallback";
}

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday: string | null;
  created_at: string;
  updated_at: string;
};

type OrderLineRow = {
  item_id: string;
  item_name: string;
  image_path: string | null;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  configuration: {
    details?: string[];
  } | null;
};

type OrderRow = {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: CustomerOrder["status"];
  pickup_label: string;
  subtotal_cents: number;
  admin_notification_status: "pending" | "sent" | "failed" | "not-configured";
  submitted_at: string;
  order_lines: OrderLineRow[] | null;
};

type LedgerRow = {
  id: string;
  order_id: string | null;
  entry_type: DripLedgerEntry["type"];
  points: number;
  points_status: "pending" | "available" | "void";
  description: string;
  created_at: string;
};

type ReviewRow = {
  id: string;
  order_id: string;
  rating: number;
  message: string;
  created_at: string;
};

function mapProfile(row: CustomerRow): CustomerProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    birthday: row.birthday ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLedger(row: LedgerRow): DripLedgerEntry {
  return {
    id: row.id,
    type: row.entry_type,
    points: row.points,
    status: row.points_status,
    description: row.description,
    createdAt: row.created_at,
    orderId: row.order_id ?? undefined,
  };
}

function mapReview(row: ReviewRow): CustomerReview {
  return {
    id: row.id,
    orderId: row.order_id,
    rating: row.rating,
    message: row.message,
    createdAt: row.created_at,
  };
}

function mapOrder(row: OrderRow, ledgers: LedgerRow[]): CustomerOrder {
  const earning = ledgers.find(
    (entry) => entry.entry_type === "order" && entry.order_id === row.id,
  );

  return {
    orderId: row.id,
    submittedAt: row.submitted_at,
    status: row.status,
    subtotal: row.subtotal_cents / 100,
    earnedDripPoints: earning?.points ?? 0,
    dripPointsStatus: earning?.points_status,
    adminNotification:
      row.admin_notification_status === "pending"
        ? "not-configured"
        : row.admin_notification_status,
    customerId: row.customer_id ?? undefined,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    pickupLabel: row.pickup_label,
    lines: (row.order_lines ?? []).map((line) => ({
      itemId: line.item_id,
      name: line.item_name,
      image: line.image_path ?? undefined,
      quantity: line.quantity,
      unitPrice: line.unit_price_cents / 100,
      lineTotal: line.line_total_cents / 100,
      details: Array.isArray(line.configuration?.details)
        ? line.configuration!.details!.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
    })),
  };
}

export async function loadCurrentCustomer() {
  const supabase = getBrowserClientOrNull();
  if (!supabase) return readSignedInCustomerProfile();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("customers")
    .select("id,name,email,phone,birthday,created_at,updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapProfile(data as CustomerRow) : null;
}

export async function updateCurrentCustomer(input: {
  name: string;
  phone: string;
  birthday?: string;
  email?: string;
}) {
  const supabase = getBrowserClientOrNull();
  if (!supabase) {
    const current = readSignedInCustomerProfile();
    return saveCustomerProfile({
      name: input.name,
      email: input.email ?? current?.email ?? "",
      phone: input.phone,
      birthday: input.birthday,
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("customers")
    .update({
      name: input.name.trim(),
      phone: input.phone.trim(),
      birthday: input.birthday?.trim() || null,
    })
    .eq("id", user.id)
    .select("id,name,email,phone,birthday,created_at,updated_at")
    .single();

  if (error) throw error;
  return mapProfile(data as CustomerRow);
}

export async function signOutCurrentCustomer() {
  const supabase = getBrowserClientOrNull();
  if (!supabase) {
    signOutCustomer();
    return;
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function loadDripActivity() {
  const supabase = getBrowserClientOrNull();
  if (!supabase) {
    const entries = readDripLedger();
    return { entries, balance: dripBalance(entries) };
  }

  const { data, error } = await supabase
    .from("drip_ledger")
    .select("id,order_id,entry_type,points,points_status,description,created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  const entries = ((data ?? []) as LedgerRow[]).map(mapLedger);
  return { entries, balance: dripBalance(entries) };
}

export async function loadCustomerOrders(): Promise<CustomerOrder[]> {
  const supabase = getBrowserClientOrNull();
  if (!supabase) return readCustomerOrders();

  const [ordersResult, ledgerResult] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id,customer_id,customer_name,customer_email,customer_phone,status,pickup_label,subtotal_cents,admin_notification_status,submitted_at,order_lines(item_id,item_name,image_path,quantity,unit_price_cents,line_total_cents,configuration)",
      )
      .order("submitted_at", { ascending: false }),
    supabase
      .from("drip_ledger")
      .select("id,order_id,entry_type,points,points_status,description,created_at")
      .eq("entry_type", "order"),
  ]);

  if (ordersResult.error) throw ordersResult.error;
  if (ledgerResult.error) throw ledgerResult.error;

  const ledgers = (ledgerResult.data ?? []) as LedgerRow[];
  return ((ordersResult.data ?? []) as OrderRow[]).map((order) =>
    mapOrder(order, ledgers),
  );
}

export async function loadCustomerOrder(orderId: string) {
  const orders = await loadCustomerOrders();
  return orders.find((order) => order.orderId === orderId) ?? null;
}

export async function loadCustomerReviews(): Promise<CustomerReview[]> {
  const supabase = getBrowserClientOrNull();
  if (!supabase) return readCustomerReviews();

  const { data, error } = await supabase
    .from("reviews")
    .select("id,order_id,rating,message,created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as ReviewRow[]).map(mapReview);
}

export async function saveReview(input: {
  orderId: string;
  rating: number;
  message: string;
}) {
  const supabase = getBrowserClientOrNull();
  if (!supabase) return saveCustomerReview(input);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to leave a review.");

  const { data, error } = await supabase
    .from("reviews")
    .upsert(
      {
        customer_id: user.id,
        order_id: input.orderId,
        rating: Math.max(1, Math.min(5, Math.round(input.rating))),
        message: input.message.trim().slice(0, 1000),
      },
      { onConflict: "customer_id,order_id" },
    )
    .select("id,order_id,rating,message,created_at")
    .single();

  if (error) throw error;
  return mapReview(data as ReviewRow);
}
