"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Search, XCircle } from "lucide-react";
import { menuItems } from "@/app/data/menu";
import { menuPageCategories } from "@/app/data/menu-pages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const categories = [...new Set(menuItems.map((item) => item.category))];
const categoryLabels = new Map(menuPageCategories.map((cat) => [cat.id, cat.label]));
const money = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });

type AvailabilityError = "setup-required" | "unavailable";

export function AdminMenuManagement({
  initialSoldOutIds,
  ready,
  reason,
}: {
  initialSoldOutIds: string[];
  ready: boolean;
  reason?: AvailabilityError;
}) {
  const [soldOutIds, setSoldOutIds] = useState(initialSoldOutIds);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => setSoldOutIds(initialSoldOutIds), [initialSoldOutIds]);

  const soldOutSet = useMemo(() => new Set(soldOutIds), [soldOutIds]);
  const visibleItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return menuItems.filter((item) =>
      (category === "all" || item.category === category) &&
      (statusFilter === "all" ||
        (statusFilter === "sold-out" && soldOutSet.has(item.id)) ||
        (statusFilter === "available" && !soldOutSet.has(item.id))) &&
      (!needle || [item.name, item.id, item.category].some((part) => part.toLowerCase().includes(needle))),
    );
  }, [query, category, statusFilter, soldOutSet]);

  async function updateSoldOut(itemId: string, soldOut: boolean) {
    if (!ready || pendingId) return;
    setError("");
    setNotice("");
    setPendingId(itemId);
    try {
      const response = await fetch(`/api/admin/menu/${encodeURIComponent(itemId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soldOut }),
      });
      const body = await response.json();
      if (!response.ok || body.ok !== true) {
        throw new Error(typeof body.error === "string" ? body.error : "Availability could not be saved.");
      }
      setSoldOutIds((current) =>
        soldOut ? [...new Set([...current, itemId])] : current.filter((id) => id !== itemId),
      );
      const name = menuItems.find((item) => item.id === itemId)?.name ?? "Product";
      setNotice(`${name} marked ${soldOut ? "sold out" : "available"}. New customer orders will use this status.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update availability.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="w-full max-w-6xl space-y-5 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="space-y-1">
          <h2 className="admin-type-section text-foreground">Menu availability</h2>
          <p className="admin-type-body text-muted-foreground">
            Mark items Sold out or Available. Prices and product details stay unchanged.
          </p>
        </div>
        <Badge variant="secondary">{soldOutSet.size} sold out · {menuItems.length} items</Badge>
      </div>

      {!ready && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm text-foreground">
          <AlertCircle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
          <p>{reason === "setup-required"
            ? "Availability storage is not ready. Apply supabase/migrations/202610090002_menu_availability.sql in Supabase to enable the switches."
            : "Availability could not be loaded. Please try again later. Switches are disabled until status is confirmed."}</p>
        </div>
      )}

      {notice && <p role="status" className="rounded-md border border-border p-3 text-sm text-foreground">{notice}</p>}
      {error && <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-foreground">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="menu-availability-search">Search products</Label>
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="menu-availability-search"
              className="w-full pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name or product ID"
            />
          </div>
        </div>
        <div className="space-y-1.5 sm:w-44">
          <Label htmlFor="menu-availability-category">Category</Label>
          <select
            id="menu-availability-category" value={category} onChange={(event) => setCategory(event.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <option value="all">All categories</option>
            {categories.map((id) => <option key={id} value={id}>{categoryLabels.get(id) ?? id}</option>)}
          </select>
        </div>
        <div className="space-y-1.5 sm:w-44">
          <Label htmlFor="menu-availability-filter">Status</Label>
          <select
            id="menu-availability-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <option value="all">All items</option>
            <option value="available">Available</option>
            <option value="sold-out">Sold out</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        Showing {visibleItems.length} of {menuItems.length} products
      </p>

      <div className="hidden overflow-hidden rounded-lg border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleItems.map((item) => {
              const soldOut = soldOutSet.has(item.id);
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex min-w-44 items-center gap-3">
                      <Image src={item.image ?? "/logo.webp"} alt="" width={48} height={48} className="size-12 rounded-lg border border-border bg-muted object-cover" />
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{categoryLabels.get(item.category) ?? item.category}</TableCell>
                  <TableCell className="tabular-nums">{money.format(item.price)}</TableCell>
                  <TableCell>
                    <Badge variant={soldOut ? "destructive" : "outline"}>{soldOut ? "Sold out" : "Available"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button" size="sm" variant={soldOut ? "outline" : "secondary"}
                      disabled={!ready || Boolean(pendingId)}
                      aria-pressed={soldOut}
                      onClick={() => void updateSoldOut(item.id, !soldOut)}
                    >
                      {soldOut ? <CheckCircle2 size={15} aria-hidden="true" /> : <XCircle size={15} aria-hidden="true" />}
                      {pendingId === item.id ? "Saving…" : soldOut ? "Mark available" : "Mark sold out"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2 md:hidden">
        {visibleItems.map((item) => {
          const soldOut = soldOutSet.has(item.id);
          return (
            <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <Image src={item.image ?? "/logo.webp"} alt="" width={48} height={48} className="size-12 shrink-0 rounded-lg border border-border bg-muted object-cover" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-semibold text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{money.format(item.price)} · {categoryLabels.get(item.category)}</p>
                <Badge variant={soldOut ? "destructive" : "outline"}>{soldOut ? "Sold out" : "Available"}</Badge>
              </div>
              <Button
                size="sm" type="button" variant="outline" aria-pressed={soldOut}
                disabled={!ready || Boolean(pendingId)}
                onClick={() => void updateSoldOut(item.id, !soldOut)}
              >
                {pendingId === item.id ? "Saving…" : soldOut ? "Available" : "Sold out"}
              </Button>
            </div>
          );
        })}
      </div>

      {visibleItems.length === 0 &&
        <p role="status" className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No products match your filters.
        </p>}
    </div>
  );
}
