"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertCircle, Pencil, Search } from "lucide-react";
import { menuItems } from "@/app/data/menu";
import { menuPageCategories } from "@/app/data/menu-pages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatAud,
  type AdminMenuProduct,
  type MenuDraftValues,
  type MenuStorageStatus,
} from "@/features/admin/menu/types";

type Editing = {
  itemId: string;
  expectedVersion: number;
  values: MenuDraftValues;
  priceInput: string;
};

const categoryLabels = new Map(menuPageCategories.map(({ id, label }) => [id, label]));
const imageChoices = Array.from(
  menuItems.reduce((paths, item) => {
    if (item.image && !paths.has(item.image)) paths.set(item.image, item.name);
    return paths;
  }, new Map<string, string>()),
  ([path, name]) => ({ path, name }),
);
const categories = Array.from(new Set(menuItems.map((item) => item.category)));

function draftLabel(product: AdminMenuProduct) {
  return product.version ? "Saved draft" : "Original";
}

function ProductPhoto({ product }: { product: AdminMenuProduct }) {
  return (
    <Image
      src={product.values.imagePath ?? "/logo.webp"}
      alt=""
      width={52}
      height={52}
      className="size-12 shrink-0 rounded-lg border border-border bg-muted object-cover"
    />
  );
}

export function AdminMenuManagement({
  initialProducts,
  storage,
}: {
  initialProducts: AdminMenuProduct[];
  storage: MenuStorageStatus;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { setProducts(initialProducts); }, [initialProducts]);

  const displayed = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return products.filter(({ item, values }) =>
      (category === "all" || item.category === category) &&
      (!needle ||
        [values.name, item.id, item.category, values.description].some(
          (value) => value.toLocaleLowerCase().includes(needle),
        )),
    );
  }, [products, query, category]);

  function openEditor(product: AdminMenuProduct) {
    setError("");
    setSuccess("");
    setEditing({
      itemId: product.item.id,
      expectedVersion: product.version,
      values: { ...product.values },
      priceInput: (product.values.priceCents / 100).toFixed(2),
    });
  }

  function setField<K extends keyof MenuDraftValues>(key: K, value: MenuDraftValues[K]) {
    setEditing((current) =>
      current ? { ...current, values: { ...current.values, [key]: value } } : null,
    );
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || saving || storage !== "ready") return;
    setError("");
    setSuccess("");

    const price = editing.priceInput.trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(price) || Number(price) > 2000) {
      setError("Enter a valid AUD price from 0.00 to 2000.00.");
      return;
    }
    const values = {
      ...editing.values,
      name: editing.values.name.trim(),
      description: editing.values.description.trim(),
      priceCents: Math.round(Number(price) * 100),
    };

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/menu/${encodeURIComponent(editing.itemId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedVersion: editing.expectedVersion, values }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setError(typeof result.error === "string" ? result.error : "Could not save draft.");
        return;
      }
      const updated = result.product as AdminMenuProduct;
      setProducts((current) => current.map((p) => p.item.id === updated.item.id ? updated : p));
      setEditing(null);
      setSuccess(`Saved draft for ${updated.values.name}. The public menu is unchanged.`);
    } catch {
      setError("Network error. Your changes were not confirmed as saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-6xl space-y-5 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="space-y-1">
          <h2 className="admin-type-section text-foreground">Menu management</h2>
          <p className="admin-type-body text-muted-foreground">
            Browse the existing catalogue and save changes for review.
          </p>
        </div>
        <Badge variant="secondary">Drafts only · Not published</Badge>
      </div>

      {storage !== "ready" && (
        <div role="alert" className="flex gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm text-foreground">
          <AlertCircle size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            {storage === "setup-required"
              ? "Draft storage is not configured. Apply supabase/migrations/202610090001_admin_menu_drafts.sql before editing."
              : "Saved drafts could not be loaded safely. Editing is disabled until the database connection is restored."}
          </p>
        </div>
      )}

      <div className="border-l-2 border-primary bg-muted/40 px-4 py-3 text-sm text-foreground">
        Prices and availability shown here are <strong>draft values</strong>. They do not yet
        change the public website, cart, checkout, or Square orders.
      </div>

      {success && <p role="status" className="rounded-lg border border-border p-3 text-sm text-foreground">{success}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="admin-menu-search">Search products</Label>
          <div className="relative">
            <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="admin-menu-search"
              className="w-full pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, ID or category"
            />
          </div>
        </div>
        <div className="space-y-1.5 sm:w-52">
          <Label htmlFor="admin-menu-category">Category</Label>
          <select
            id="admin-menu-category"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((id) =>
              <option key={id} value={id}>{categoryLabels.get(id) ?? id}</option>,
            )}
          </select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        Showing {displayed.length} of {products.length} products
      </p>

      <div className="hidden overflow-hidden rounded-lg border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Draft price</TableHead>
              <TableHead>Draft availability</TableHead>
              <TableHead>Version</TableHead>
              <TableHead className="text-right">Manage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.map((product) => (
              <TableRow key={product.item.id}>
                <TableCell>
                  <div className="flex min-w-44 items-center gap-3">
                    <ProductPhoto product={product} />
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{product.values.name}</p>
                      <p className="text-xs text-muted-foreground">{product.item.id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{categoryLabels.get(product.item.category) ?? product.item.category}</TableCell>
                <TableCell className="tabular-nums">{formatAud(product.values.priceCents)}</TableCell>
                <TableCell>
                  <Badge variant={product.values.available ? "outline" : "secondary"}>
                    {product.values.available ? "Available" : "Unavailable"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={product.version ? "secondary" : "outline"}>{draftLabel(product)}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" disabled={storage !== "ready"} onClick={() => openEditor(product)}>
                    <Pencil size={15} aria-hidden="true" /> Edit draft
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2 md:hidden">
        {displayed.map((product) => (
          <div key={product.item.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
            <ProductPhoto product={product} />
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <p className="font-semibold text-foreground">{product.values.name}</p>
                <p className="text-xs text-muted-foreground">{categoryLabels.get(product.item.category)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold tabular-nums">{formatAud(product.values.priceCents)}</span>
                <Badge variant="outline">{draftLabel(product)}</Badge>
                {!product.values.available && <Badge variant="secondary">Draft unavailable</Badge>}
              </div>
              <Button variant="outline" size="sm" disabled={storage !== "ready"} onClick={() => openEditor(product)}>
                <Pencil size={15} aria-hidden="true" /> Edit draft
              </Button>
            </div>
          </div>
        ))}
      </div>

      {displayed.length === 0 && (
        <p role="status" className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No products match this search.
        </p>
      )}

      <Sheet open={Boolean(editing)} onOpenChange={(open) => { if (!open && !saving) { setEditing(null); setError(""); } }}>
        <SheetContent side="right" className="admin-menu-editor-sheet !w-full !max-w-lg overflow-y-auto p-0 sm:!w-[32rem]">
          <SheetHeader className="border-b border-border px-5 py-5">
            <SheetTitle>Edit menu draft</SheetTitle>
            <SheetDescription>Changes are saved privately and will not affect customer ordering.</SheetDescription>
          </SheetHeader>
          {editing && (
            <form onSubmit={(event) => void saveDraft(event)} className="flex flex-1 flex-col gap-5 px-5 pb-6">
              <div className="space-y-1.5">
                <Label htmlFor="menu-edit-name">Product name</Label>
                <Input id="menu-edit-name" maxLength={100} required minLength={2} value={editing.values.name}
                  onChange={(event) => setField("name", event.target.value)} disabled={saving} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="menu-edit-description">Description</Label>
                <textarea id="menu-edit-description" required maxLength={1500} rows={5} value={editing.values.description}
                  onChange={(event) => setField("description", event.target.value)} disabled={saving}
                  className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="menu-edit-price">Draft price (AUD)</Label>
                <Input id="menu-edit-price" inputMode="decimal" required value={editing.priceInput} disabled={saving}
                  onChange={(event) => setEditing((current) => current && ({ ...current, priceInput: event.target.value }))}
                  placeholder="19.00" />
                <p className="text-xs text-muted-foreground">Existing checkout prices remain unchanged.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="menu-edit-image">Existing product photo</Label>
                <select id="menu-edit-image" value={editing.values.imagePath ?? ""} disabled={saving}
                  onChange={(event) => setField("imagePath", event.target.value || null)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring">
                  <option value="">No photo</option>
                  {imageChoices.map((image) => <option value={image.path} key={image.path}>{image.name}</option>)}
                </select>
                <p className="text-xs text-muted-foreground">Choose from photos already included in the website.</p>
              </div>
              <div className="space-y-3 border-t border-border pt-4">
                <label className="flex cursor-pointer items-center gap-3 text-sm text-foreground">
                  <input type="checkbox" checked={editing.values.available} disabled={saving}
                    onChange={(event) => setField("available", event.target.checked)}
                    className="size-4 accent-primary" />
                  Available (draft only)
                </label>
                <label className="flex cursor-pointer items-center gap-3 text-sm text-foreground">
                  <input type="checkbox" checked={editing.values.featured} disabled={saving}
                    onChange={(event) => setField("featured", event.target.checked)}
                    className="size-4 accent-primary" />
                  Featured item (draft only)
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Categories, product IDs, modifier rules and combo configurations are locked to protect checkout.
              </p>
              {error && <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-foreground">{error}</p>}
              <div className="mt-auto flex gap-3 border-t border-border pt-4">
                <Button type="button" variant="outline" disabled={saving} onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save draft"}</Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
