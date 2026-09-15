"use client";

import {
  dripBalance,
  readDripLedger,
  type DripLedgerEntry,
} from "./customer-store";
import { getBrowserClientOrNull } from "./supabase/client";

type LedgerRow = {
  id: string;
  order_id: string | null;
  entry_type: DripLedgerEntry["type"];
  points: number;
  points_status: "pending" | "available" | "void";
  description: string;
  created_at: string;
};

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

export async function loadCustomerDripActivity() {
  const supabase = getBrowserClientOrNull();

  if (!supabase) {
    const entries = readDripLedger();
    return { entries, balance: dripBalance(entries) };
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  const user = session?.user;
  if (!user) return { entries: [] as DripLedgerEntry[], balance: 0 };

  const { data, error } = await supabase
    .from("drip_ledger")
    .select(
      "id,order_id,entry_type,points,points_status,description,created_at",
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const entries = ((data ?? []) as LedgerRow[]).map(mapLedger);
  return { entries, balance: dripBalance(entries) };
}
