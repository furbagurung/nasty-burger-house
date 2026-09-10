import type { MenuCategoryId } from "./menu";

export type MenuPageCategory = {
  id: MenuCategoryId;
  label: string;
  shortLabel: string;
  image: string;
  description: string;
};

export const menuPageCategories: MenuPageCategory[] = [
  {
    id: "featured",
    label: "Featured",
    shortLabel: "★",
    image: "/images/final-menu-photo/bbq-beast-v2.jpg",
    description:
      "Start with the Nasty favourites, featured picks and boxes built for a bigger feed.",
  },
  {
    id: "burgers",
    label: "Burgers",
    shortLabel: "B",
    image: "/images/final-menu-photo/the-og-nasty-v2.jpg",
    description:
      "Flame-grilled beef, chicken, fish and veggie burgers loaded with Nasty Burger House flavour.",
  },
  {
    id: "loaded-sides",
    label: "Sides",
    shortLabel: "S",
    image: "/images/final-menu-photo/nasty-fries-v2.jpg",
    description:
      "Crispy, saucy sides made to share—or keep entirely to yourself.",
  },
  {
    id: "kids",
    label: "Kids",
    shortLabel: "K",
    image: "/images/final-menu-photo/dino-nuggets-v2.jpg",
    description:
      "Monster Cheese, Dino Nuggets and smaller favourites made for little appetites.",
  },
  {
    id: "beast-boxes",
    label: "Beast Boxes",
    shortLabel: "BX",
    image: "/images/final-menu-photo/solo-beast-box-v2.jpeg",
    description:
      "Choose your burgers and drinks, then feed one, two or the whole family.",
  },
  {
    id: "veg",
    label: "Veg",
    shortLabel: "V",
    image: "/images/final-menu-photo/green-beast-v2.jpg",
    description:
      "Green Beast, Nasty Fries and Dirty Eggplant — the vegetarian Nasty favourites.",
  },
  {
    id: "sweet",
    label: "Dessert",
    shortLabel: "D",
    image: "/images/final-menu-photo/mango-pudding-v2.jpeg",
    description: "Finish the feed with a fresh Nasty Burger House dessert.",
  },
  {
    id: "drinks",
    label: "Drinks",
    shortLabel: "DR",
    image: "/images/final-menu-photo/drinks-menu-image-v2.jpeg",
    description: "Solo, Coke, Fanta and mineral water for your meal, combo or Beast Box.",
  },
];

const menuNavigationIds: MenuCategoryId[] = [
  "beast-boxes",
  "burgers",
  "loaded-sides",
  "kids",
  "veg",
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
