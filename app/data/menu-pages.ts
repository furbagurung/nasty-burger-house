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
    image: "/images/menu/BBQ-Beast.jpg",
    description:
      "Start with the Nasty favourites, monthly specials and boxes built for a bigger feed.",
  },
  {
    id: "burgers",
    label: "Burgers",
    shortLabel: "B",
    image: "/images/menu/og-nasty.jpg",
    description:
      "Flame-grilled beef, chicken, fish and veggie burgers loaded with Nasty Burger House flavour.",
  },
  {
    id: "loaded-sides",
    label: "Sides",
    shortLabel: "S",
    image: "/images/menu/nasty-fries.jpg",
    description:
      "Crispy, saucy sides made to share—or keep entirely to yourself.",
  },
  {
    id: "kids",
    label: "Kids",
    shortLabel: "K",
    image: "/images/menu/Dino-nuggets.jpg",
    description:
      "Monster Cheese, Dino Nuggets and smaller favourites made for little appetites.",
  },
  {
    id: "beast-boxes",
    label: "Beast Boxes",
    shortLabel: "BX",
    image: "/images/beast-boxes/Solo Beast Box.jpg",
    description:
      "Choose your burgers and drinks, then feed one, two or the whole family.",
  },
  {
    id: "veg",
    label: "Veg",
    shortLabel: "V",
    image: "/images/menu/green-beast.jpg",
    description:
      "Vegetarian burgers, sides and desserts from across the Nasty Burger House menu.",
  },
  {
    id: "sweet",
    label: "Desserts",
    shortLabel: "D",
    image: "/images/menu/mango-pudding.jpg",
    description: "Finish the feed with a fresh Nasty Burger House dessert.",
  },
  {
    id: "drinks",
    label: "Nasty Drinks",
    shortLabel: "ND",
    image: "/images/menu/coke.webp",
    description: "Cold drinks and water for your meal, combo or Beast Box.",
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
