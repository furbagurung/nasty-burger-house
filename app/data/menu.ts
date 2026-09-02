export type MenuCategoryId =
  | "featured"
  | "burgers"
  | "loaded-sides"
  | "kids"
  | "beast-boxes"
  | "drinks";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  category: Exclude<MenuCategoryId, "featured">;
  price: number | null;
  image?: string;
  featured?: boolean;
  canUpgrade?: boolean;
  isKidsItem?: boolean;
};

export const menuCategories: Array<{
  id: "all" | MenuCategoryId;
  label: string;
}> = [
  { id: "all", label: "Full menu" },
  { id: "featured", label: "Featured" },
  { id: "burgers", label: "Beast Burgers" },
  { id: "loaded-sides", label: "Loaded Sides" },
  { id: "kids", label: "Kids Meals" },
  { id: "beast-boxes", label: "Beast Boxes" },
  { id: "drinks", label: "Drinks" },
];

export const adultDrinkChoices = [
  "Coca-Cola",
  "Coke Zero",
  "Solo",
  "Water",
  "Lemon Lime Bitters",
  "Ginger Beer",
];

export const kidsDrinkChoices = ["Water"];

export const modifierChoices = [
  "Extra patty",
  "Extra cheese",
  "Bacon",
  "Extra sauce",
];

// Phase 1 uses only product names already confirmed in project discussions.
// Prices and final descriptions stay explicitly pending until client approval.
export const menuItems: MenuItem[] = [
  {
    id: "monster-cheese",
    name: "Monster Cheese",
    description: "Final client-approved ingredients and description pending.",
    category: "burgers",
    price: null,
    image: "/images/signature-beast.webp",
    featured: true,
    canUpgrade: true,
  },
  {
    id: "bbq-beast",
    name: "BBQ Beast",
    description: "Temporary Beast of the Month content for the functional draft.",
    category: "burgers",
    price: null,
    featured: true,
    canUpgrade: true,
  },
  {
    id: "loaded-fries",
    name: "Loaded Fries",
    description: "Final client-approved ingredients and description pending.",
    category: "loaded-sides",
    price: null,
    canUpgrade: true,
  },
  {
    id: "kids-burger-meal",
    name: "Kids Burger Meal",
    description: "Kids drink choices will be expanded after client confirmation.",
    category: "kids",
    price: null,
    canUpgrade: true,
    isKidsItem: true,
  },
  {
    id: "beast-box",
    name: "Beast Box",
    description: "Final box size, inclusions and pricing pending client approval.",
    category: "beast-boxes",
    price: null,
    featured: true,
  },
  ...adultDrinkChoices.map((name) => ({
    id: name.toLowerCase().replaceAll(" ", "-"),
    name,
    description: "Available drink option.",
    category: "drinks" as const,
    price: null,
  })),
];
