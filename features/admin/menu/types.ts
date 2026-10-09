import type { MenuItem } from "@/app/data/menu";

export type MenuDraftValues = {
  name: string;
  description: string;
  priceCents: number;
  imagePath: string | null;
  featured: boolean;
  available: boolean;
};

export type AdminMenuProduct = {
  item: MenuItem;
  values: MenuDraftValues;
  version: number;
  updatedAt: string | null;
  editedBy: string | null;
};

export type MenuStorageStatus = "ready" | "setup-required" | "error";

export function defaultMenuDraft(item: MenuItem): MenuDraftValues {
  return {
    name: item.name,
    description: item.description,
    priceCents: Math.round(item.price * 100),
    imagePath: item.image ?? null,
    featured: Boolean(item.featured),
    available: true,
  };
}

export function isMenuDraftValues(value: unknown): value is MenuDraftValues {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.name === "string" &&
    v.name === v.name.trim() &&
    v.name.length >= 2 &&
    v.name.length <= 100 &&
    typeof v.description === "string" &&
    v.description === v.description.trim() &&
    v.description.length >= 1 &&
    v.description.length <= 1500 &&
    Number.isInteger(v.priceCents) &&
    (v.priceCents as number) >= 0 &&
    (v.priceCents as number) <= 200000 &&
    (v.imagePath === null ||
      (typeof v.imagePath === "string" &&
        v.imagePath.startsWith("/images/") &&
        v.imagePath.length <= 255 &&
        !v.imagePath.includes("..") &&
        !/[?#\\]/.test(v.imagePath))) &&
    typeof v.featured === "boolean" &&
    typeof v.available === "boolean"
  );
}

export function formatAud(cents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);
}
