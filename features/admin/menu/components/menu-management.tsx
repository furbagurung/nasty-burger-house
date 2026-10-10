"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CircleOff,
  Grid2X2,
  List,
  Package,
  Search,
  X,
} from "lucide-react";
import { menuItems } from "@/app/data/menu";
import { menuPageCategories } from "@/app/data/menu-pages";
import { AdminMetricCard } from "@/components/admin/shared/admin-metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const categories = [...new Set(menuItems.map((item) => item.category))];
const categoryLabels = new Map(menuPageCategories.map((cat) => [cat.id, cat.label]));
const money = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });

type AvailabilityError = "setup-required" | "unavailable";
type MenuView = "grid" | "list";
type MenuSort = "default" | "name-asc" | "name-desc" | "price-asc" | "price-desc";
const menuSortLabels: Record<MenuSort, string> = {
  default: "Menu order",
  "name-asc": "Name: A–Z",
  "name-desc": "Name: Z–A",
  "price-asc": "Price: Low to high",
  "price-desc": "Price: High to low",
};

function AvailabilityControl({
  name,
  soldOut,
  saving,
  disabled,
  known,
  onToggle,
}: {
  name: string;
  soldOut: boolean;
  saving: boolean;
  disabled: boolean;
  known: boolean;
  onToggle: (available: boolean) => void;
}) {
  return (
    <div className="admin-menu-availability">
      <Badge
        variant="secondary"
        className="admin-menu-status"
        data-status={!known ? "unknown" : soldOut ? "sold-out" : "available"}
      >
        {!known ? "Unknown" : soldOut ? "Sold out" : "Available"}
      </Badge>
      <div className="admin-menu-availability-control">
        {saving && (
          <span className="admin-menu-switch-caption" aria-live="polite">
            Saving…
          </span>
        )}
        <Switch
          checked={known && !soldOut}
          disabled={disabled}
          onCheckedChange={onToggle}
          aria-label={known ? `Available for ${name}` : `Availability unknown for ${name}`}
          className="admin-menu-switch"
        />
      </div>
    </div>
  );
}

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
  const [view, setView] = useState<MenuView>("grid");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<MenuSort>("default");
  // Track saves by product so updating one item does not lock the entire menu.
  // The ref also blocks repeat requests before React has rendered the disabled state.
  const pendingIdsRef = useRef<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => setSoldOutIds(initialSoldOutIds), [initialSoldOutIds]);

  const soldOutSet = useMemo(() => new Set(soldOutIds), [soldOutIds]);
  const soldOutCount = menuItems.filter((item) => soldOutSet.has(item.id)).length;
  const availableCount = menuItems.length - soldOutCount;

  const visibleItems = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const items = menuItems.filter(
      (item) =>
        (category === "all" || item.category === category) &&
        (statusFilter === "all" ||
          (statusFilter === "sold-out" && soldOutSet.has(item.id)) ||
          (statusFilter === "available" && !soldOutSet.has(item.id))) &&
        (!needle ||
          [item.name, item.id, item.category].some((part) =>
            part.toLowerCase().includes(needle),
          )),
    );

    if (sortBy === "name-asc") return items.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "name-desc") return items.sort((a, b) => b.name.localeCompare(a.name));
    if (sortBy === "price-asc") return items.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
    if (sortBy === "price-desc") return items.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name));
    return items;
  }, [category, query, soldOutSet, statusFilter, sortBy]);

  const filtersActive = query.trim() !== "" || category !== "all" || statusFilter !== "all" || sortBy !== "default";

  async function updateSoldOut(itemId: string, soldOut: boolean) {
    if (
      !ready ||
      pendingIdsRef.current.has(itemId) ||
      soldOutSet.has(itemId) === soldOut
    ) return;

    pendingIdsRef.current.add(itemId);
    setPendingIds((current) => new Set(current).add(itemId));
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/admin/menu/${encodeURIComponent(itemId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soldOut }),
      });

      const body = await response.json();
      if (!response.ok || body.ok !== true) {
        throw new Error(
          typeof body.error === "string"
            ? body.error
            : "Could not save availability.",
        );
      }

      setSoldOutIds((current) =>
        soldOut
          ? [...new Set([...current, itemId])]
          : current.filter((id) => id !== itemId),
      );

      const name = menuItems.find((item) => item.id === itemId)?.name ?? "Product";
      setNotice(
        `${name}: ${soldOut ? "sold out" : "available"}.`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update availability.");
    } finally {
      pendingIdsRef.current.delete(itemId);
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(itemId);
        return next;
      });
    }
  }

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setStatusFilter("all");
    setSortBy("default");
  }

  function availabilityProps(item: (typeof menuItems)[number]) {
    return {
      name: item.name,
      soldOut: soldOutSet.has(item.id),
      saving: pendingIds.has(item.id),
      disabled: !ready || pendingIds.has(item.id),
      known: ready,
      onToggle: (available: boolean) => void updateSoldOut(item.id, !available),
    };
  }

  return (
    <div className="admin-menu-page">
      <header className="admin-menu-intro">
        <div>
          <h2>Menu management</h2>
          <p>Manage item availability.</p>
        </div>
        <Badge variant="outline" className="admin-menu-total-pill">
          <Package size={14} aria-hidden="true" />
          {menuItems.length} products
        </Badge>
      </header>

      <section className="admin-menu-stats admin-kpi-grid admin-kpi-grid--menu" aria-label="Menu availability summary">
        <AdminMetricCard
          label="Total items"
          value={menuItems.length}
          icon={<Package size={20} />}
          tone="brand"
          index={0}
        />
        <AdminMetricCard
          label="Available"
          value={ready ? availableCount : "—"}
          icon={<CheckCircle2 size={20} />}
          tone="success"
          hint={ready ? undefined : "Status unavailable"}
          index={1}
        />
        <AdminMetricCard
          label="Sold out"
          value={ready ? soldOutCount : "—"}
          icon={<CircleOff size={20} />}
          tone="warning"
          hint={ready ? undefined : "Status unavailable"}
          index={2}
        />
      </section>

      {!ready && (
        <Card role="alert" className="admin-menu-feedback is-error" size="sm">
          <CardContent>
            <AlertCircle size={18} aria-hidden="true" />
            <p>
              {reason === "setup-required"
                ? "Setup required. Apply Supabase migration 202610090002_menu_availability.sql."
                : "Could not load availability. Controls are disabled."}
            </p>
          </CardContent>
        </Card>
      )}

      {notice && (
        <Card role="status" size="sm" className="admin-menu-feedback is-success">
          <CardContent>
            <CheckCircle2 size={18} aria-hidden="true" />
            <p>{notice}</p>
            <Button type="button" size="icon-sm" variant="ghost" aria-label="Dismiss success message" onClick={() => setNotice("")}>
              <X aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card role="alert" size="sm" className="admin-menu-feedback is-error">
          <CardContent>
            <AlertCircle size={18} aria-hidden="true" />
            <p>{error}</p>
            <Button type="button" size="icon-sm" variant="ghost" aria-label="Dismiss error" onClick={() => setError("")}>
              <X aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>
      )}

      <Card size="sm" className="admin-menu-filter-card">
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>Search and update availability.</CardDescription>
        </CardHeader>
        <CardContent className="admin-menu-filter-fields">
          <div className="admin-menu-field admin-menu-search">
            <Label htmlFor="menu-availability-search">Search products</Label>
            <div className="admin-menu-search-input">
              <Search size={17} aria-hidden="true" />
              <Input
                id="menu-availability-search"
                placeholder="Name or ID"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>
          <div className="admin-menu-field">
            <Label htmlFor="menu-availability-category">Category</Label>
            <Select
              value={category}
              onValueChange={(next) => { if (typeof next === "string") setCategory(next); }}
            >
              <SelectTrigger id="menu-availability-category" className="admin-menu-select">
                <SelectValue>{category === "all" ? "All categories" : categoryLabels.get(category) ?? category}</SelectValue>
              </SelectTrigger>
              <SelectContent side="bottom" sideOffset={6} align="start" alignItemWithTrigger={false}>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((id) => (
                  <SelectItem key={id} value={id}>
                    {categoryLabels.get(id) ?? id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="admin-menu-field">
            <Label htmlFor="menu-availability-filter">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(next) => { if (typeof next === "string") setStatusFilter(next); }}
            >
              <SelectTrigger id="menu-availability-filter" className="admin-menu-select">
                <SelectValue>{statusFilter === "all" ? "All items" : statusFilter === "sold-out" ? "Sold out" : "Available"}</SelectValue>
              </SelectTrigger>
              <SelectContent side="bottom" sideOffset={6} align="start" alignItemWithTrigger={false}>
                <SelectItem value="all">All items</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="sold-out">Sold out</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="admin-menu-field">
            <Label htmlFor="menu-product-sort">Sort by</Label>
            <Select
              value={sortBy}
              onValueChange={(next) => {
                if (next === "default" || next === "name-asc" ||
                  next === "name-desc" || next === "price-asc" || next === "price-desc") {
                  setSortBy(next);
                }
              }}
            >
              <SelectTrigger id="menu-product-sort" className="admin-menu-select">
                <SelectValue>{menuSortLabels[sortBy]}</SelectValue>
              </SelectTrigger>
              <SelectContent side="bottom" sideOffset={6} align="start" alignItemWithTrigger={false}>
                {(Object.entries(menuSortLabels) as Array<[MenuSort, string]>).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs
        className="admin-menu-tabs"
        value={view}
        onValueChange={(next) => { if (next === "grid" || next === "list") setView(next); }}
      >
        <div className="admin-menu-results-toolbar">
          <div className="admin-menu-results-details">
            <p aria-live="polite">
              <strong>{visibleItems.length}</strong> of {menuItems.length} products
            </p>
            {filtersActive && (
              <Button variant="ghost" type="button" size="sm" onClick={clearFilters}>
                <X size={14} aria-hidden="true" />
                Clear filters
              </Button>
            )}
          </div>
          <TabsList aria-label="Menu view" className="admin-menu-view-tabs">
            <TabsTrigger value="grid">
              <Grid2X2 size={16} aria-hidden="true" /> Grid
            </TabsTrigger>
            <TabsTrigger value="list">
              <List size={16} aria-hidden="true" /> List
            </TabsTrigger>
          </TabsList>
        </div>

        {visibleItems.length === 0 ? (
          <Card size="sm" className="admin-menu-empty">
            <CardContent>
              <Search size={22} aria-hidden="true" />
              <h3>No matching products</h3>
              <p>Try another search or filter.</p>
              {filtersActive && (
                <Button type="button" size="sm" variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <TabsContent value="grid" className="admin-menu-grid">
              {visibleItems.map((item) => {
                const soldOut = soldOutSet.has(item.id);
                return (
                  <Card key={item.id} size="sm" className="admin-menu-product" data-status={soldOut ? "sold-out" : "available"}>
                    <CardContent>
                      <div className="admin-menu-product-image">
                        <Image
                          src={item.image ?? "/logo.webp"}
                          alt=""
                          fill
                          sizes="(max-width: 480px) 45vw, (max-width: 800px) 32vw, (max-width: 1200px) 25vw, 220px"
                          className="object-contain"
                        />
                      </div>
                      <div className="admin-menu-product-copy">
                        <h3 title={item.name}>{item.name}</h3>
                        <p>{categoryLabels.get(item.category) ?? item.category}</p>
                        <strong>{money.format(item.price)}</strong>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <AvailabilityControl {...availabilityProps(item)} />
                    </CardFooter>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="list" className="admin-menu-list">
              <Card size="sm" className="admin-menu-table-card">
                <Table className="admin-menu-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="admin-menu-table-status-col">Availability</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="admin-menu-table-product">
                            <div className="admin-menu-table-image">
                              <Image src={item.image ?? "/logo.webp"} alt="" fill sizes="54px" className="object-contain" />
                            </div>
                            <div>
                              <strong>{item.name}</strong>
                              <span>{item.id}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{categoryLabels.get(item.category) ?? item.category}</TableCell>
                        <TableCell className="admin-menu-table-price">{money.format(item.price)}</TableCell>
                        <TableCell>
                          <AvailabilityControl {...availabilityProps(item)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
              <div className="admin-menu-mobile-list">
                {visibleItems.map((item) => (
                  <Card key={item.id} size="sm" className="admin-menu-mobile-row">
                    <CardContent>
                      <div className="admin-menu-table-product">
                        <div className="admin-menu-table-image">
                          <Image
                            src={item.image ?? "/logo.webp"}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-contain"
                          />
                        </div>
                        <div>
                          <strong>{item.name}</strong>
                          <span>{categoryLabels.get(item.category) ?? item.category} · {money.format(item.price)}</span>
                        </div>
                      </div>
                      <AvailabilityControl {...availabilityProps(item)} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
