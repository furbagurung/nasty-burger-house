import type { MenuCategoryId } from "./menu";

export type MenuPageCategory = {
  id: MenuCategoryId;
  label: string;
  shortLabel: string;
  description: string;
};

export const menuPageCategories: MenuPageCategory[] = [
  {
    id: "featured",
    label: "Featured",
    shortLabel: "★",
    description:
      "Start with the Nasty favourites, monthly specials and boxes built for a bigger feed.",
  },
  {
    id: "burgers",
    label: "Burgers",
    shortLabel: "B",
    description:
      "Flame-grilled beef, chicken, fish and veggie burgers loaded with Nasty Burger House flavour.",
  },
  {
    id: "loaded-sides",
    label: "Sides",
    shortLabel: "S",
    description:
      "Crispy, saucy sides made to share—or keep entirely to yourself.",
  },
  {
    id: "kids",
    label: "Little Beasts",
    shortLabel: "LB",
    description:
      "Smaller favourites for little appetites, with kids’ combo choices available during ordering.",
  },
  {
    id: "beast-boxes",
    label: "Beast Boxes",
    shortLabel: "BX",
    description:
      "Choose your burgers and drinks, then feed one, two or the whole family.",
  },
  {
    id: "sweet",
    label: "Desserts",
    shortLabel: "D",
    description: "Finish the feed with a fresh Nasty Burger House dessert.",
  },
  {
    id: "drinks",
    label: "Nasty Drinks",
    shortLabel: "ND",
    description: "Cold drinks and water for your meal, combo or Beast Box.",
  },
];

const menuNavigationIds: MenuCategoryId[] = [
  "burgers",
  "loaded-sides",
  "sweet",
  "drinks",
];

export const menuNavigationCategories = menuNavigationIds.flatMap((id) => {
  const category = menuPageCategories.find((entry) => entry.id === id);
  return category ? [category] : [];
});

export function findMenuPageCategory(value: string) {
  return menuPageCategories.find((category) => category.id === value);
}
