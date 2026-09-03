export type MenuCategoryId =
  | "featured"
  | "burgers"
  | "loaded-sides"
  | "kids"
  | "beast-boxes"
  | "sweet"
  | "drinks";

export type DietaryTag = "Halal" | "Vegetarian";

export type ModifierChoice = {
  id: string;
  name: string;
  price: number;
};

export type BeastBoxConfig = {
  burgerCount: number;
  drinkCount: number;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  category: Exclude<MenuCategoryId, "featured">;
  price: number;
  image?: string;
  featured?: boolean;
  canUpgrade?: boolean;
  isKidsItem?: boolean;
  dietaryTags?: DietaryTag[];
  modifierIds?: string[];
  removableIngredients?: string[];
  boxConfig?: BeastBoxConfig;
};

export const menuCategories: Array<{
  id: "all" | MenuCategoryId;
  label: string;
}> = [
  { id: "all", label: "Full menu" },
  { id: "featured", label: "Featured" },
  { id: "burgers", label: "Beast Burgers" },
  { id: "loaded-sides", label: "Loaded Sides" },
  { id: "kids", label: "Little Beasts" },
  { id: "beast-boxes", label: "Beast Boxes" },
  { id: "sweet", label: "Sweet" },
  { id: "drinks", label: "Drinks" },
];

export const adultDrinkChoices = [
  "Coca-Cola",
  "Coke Zero",
  "Solo",
  "Water",
];

// Apple and orange juice remain draft choices until the client confirms the kids' range.
export const kidsDrinkChoices = ["Water", "Apple Juice", "Orange Juice"];

// Kept in one configuration block so client-approved pricing can be changed safely.
export const comboUpgradePrice = 7;
export const pricingNotice =
  "Combo, modifier and kids' drink pricing is provisional until final client approval.";

export const modifierChoices: ModifierChoice[] = [
  { id: "beef-patty", name: "Extra smashed beef patty", price: 4 },
  { id: "chicken-patty", name: "Extra chicken patty", price: 4 },
  { id: "bacon", name: "Crispy bacon", price: 3 },
  { id: "cheese", name: "Extra American cheese", price: 2 },
  { id: "house-sauce", name: "Extra house sauce", price: 1.5 },
];

const burgerModifierIds = ["beef-patty", "bacon", "cheese", "house-sauce"];

export const menuItems: MenuItem[] = [
  {
    id: "og-nasty",
    name: "The OG Nasty",
    description:
      "Our signature flame-grilled beef patty with American cheese, crisp lettuce, pickled onion and house-made NBH Signature Sauce on a toasted milk bun.",
    category: "burgers",
    price: 16,
    image: "/images/signature-beast.webp",
    featured: true,
    canUpgrade: true,
    dietaryTags: ["Halal"],
    modifierIds: burgerModifierIds,
    removableIngredients: [
      "American cheese",
      "Lettuce",
      "Pickled onion",
      "NBH Signature Sauce",
    ],
  },
  {
    id: "peri-beast",
    name: "Peri Beast",
    description:
      "Tender flame-grilled peri-peri chicken thigh, marinated in our signature peri-peri sauce, with tomato, fresh cabbage slaw and creamy mayo on a toasted milk bun.",
    category: "burgers",
    price: 18,
    canUpgrade: true,
    dietaryTags: ["Halal"],
    modifierIds: ["chicken-patty", "bacon", "cheese", "house-sauce"],
    removableIngredients: ["Tomato", "Cabbage slaw", "Creamy mayo"],
  },
  {
    id: "hooked",
    name: "Hooked",
    description:
      "Golden beer-battered fish fillet with house-made tartare sauce, American cheese and crisp lettuce on a toasted milk bun.",
    category: "burgers",
    price: 18,
    canUpgrade: true,
    dietaryTags: ["Halal"],
    modifierIds: ["cheese", "house-sauce"],
    removableIngredients: ["Tartare sauce", "American cheese", "Lettuce"],
  },
  {
    id: "green-beast",
    name: "Green Beast",
    description:
      "House-made vegetable patty with jalapeño mint mayo, pickled onion, fresh cabbage slaw and American cheese on a toasted milk bun.",
    category: "burgers",
    price: 18,
    canUpgrade: true,
    dietaryTags: ["Vegetarian"],
    modifierIds: ["cheese", "house-sauce"],
    removableIngredients: [
      "Jalapeño mint mayo",
      "Pickled onion",
      "Cabbage slaw",
      "American cheese",
    ],
  },
  {
    id: "bbq-beast",
    name: "BBQ Beast",
    description:
      "Juicy flame-grilled beef patty with crispy bacon, American cheese, house-made Bourbon BBQ sauce and creamy mayo on a toasted milk bun.",
    category: "burgers",
    price: 18,
    featured: true,
    canUpgrade: true,
    dietaryTags: ["Halal"],
    modifierIds: burgerModifierIds,
    removableIngredients: [
      "Crispy bacon",
      "American cheese",
      "Bourbon BBQ sauce",
      "Creamy mayo",
    ],
  },
  {
    id: "dirty-eggplant",
    name: "Dirty Eggplant",
    description:
      "Eight crispy battered eggplant pieces tossed in signature NBH Asian dressing, finished with crispy fried onion and fresh coriander.",
    category: "loaded-sides",
    price: 15,
    canUpgrade: true,
    dietaryTags: ["Vegetarian"],
    modifierIds: ["house-sauce"],
    removableIngredients: ["Crispy fried onion", "Fresh coriander"],
  },
  {
    id: "buffalo-fury",
    name: "Buffalo Fury",
    description:
      "Four whole chicken wings tossed in house-made Buffalo Fury sauce, finished with fresh herbs.",
    category: "loaded-sides",
    price: 15,
    canUpgrade: true,
    dietaryTags: ["Halal"],
    modifierIds: ["house-sauce"],
    removableIngredients: ["Fresh herbs"],
  },
  {
    id: "nasty-fries",
    name: "Nasty Fries",
    description:
      "Golden crispy fries tossed in house-made NBH seasoning, served with house-made garlic aioli.",
    category: "loaded-sides",
    price: 10,
    canUpgrade: true,
    dietaryTags: ["Vegetarian"],
    modifierIds: ["house-sauce"],
    removableIngredients: ["NBH seasoning", "Garlic aioli"],
  },
  {
    id: "monster-cheese",
    name: "Monster Cheese",
    description:
      "Flame-grilled beef patty with American cheese, tomato sauce and pickles on a soft milk bun.",
    category: "kids",
    price: 14,
    canUpgrade: true,
    isKidsItem: true,
    dietaryTags: ["Halal"],
    modifierIds: ["beef-patty", "cheese", "house-sauce"],
    removableIngredients: ["American cheese", "Tomato sauce", "Pickles"],
  },
  {
    id: "dino-nuggets",
    name: "Dino Nuggets",
    description:
      "Six crispy chicken dino nuggets served with Nasty Fries and tomato sauce.",
    category: "kids",
    price: 14,
    canUpgrade: true,
    isKidsItem: true,
    dietaryTags: ["Halal"],
    modifierIds: ["house-sauce"],
    removableIngredients: ["Tomato sauce"],
  },
  {
    id: "solo-beast-box",
    name: "Solo Beast Box",
    description:
      "Any Beast Burger · Nasty Fries · 2 Buffalo Fury Wings · 2 Dirty Eggplant Pieces · 1 soft drink or water.",
    category: "beast-boxes",
    price: 31.9,
    featured: true,
    boxConfig: { burgerCount: 1, drinkCount: 1 },
  },
  {
    id: "duo-beast-box",
    name: "Duo Beast Box",
    description:
      "Any 2 Beast Burgers · Nasty Fries · 4 Buffalo Fury Wings · 4 Dirty Eggplant Pieces · 2 soft drinks or waters.",
    category: "beast-boxes",
    price: 54.9,
    boxConfig: { burgerCount: 2, drinkCount: 2 },
  },
  {
    id: "family-beast-box",
    name: "Family Beast Box",
    description:
      "Any 2 Beast Burgers · Monster Cheese · 2 Nasty Fries · 8 Buffalo Fury Wings · 4 Dirty Eggplant Pieces · 6 Dino Nuggets · 3 soft drinks or waters.",
    category: "beast-boxes",
    price: 79.9,
    boxConfig: { burgerCount: 2, drinkCount: 3 },
  },
  {
    id: "mango-pudding",
    name: "Mango Pudding with Lychee Granita",
    description:
      "A refreshing tropical dessert with silky mango pudding and house-made lychee granita.",
    category: "sweet",
    price: 12,
    dietaryTags: ["Vegetarian"],
  },
  ...adultDrinkChoices.map((name) => ({
    id: name.toLowerCase().replaceAll(" ", "-"),
    name,
    description: name === "Water" ? "Chilled bottle." : "Chilled can.",
    category: "drinks" as const,
    price: 4,
  })),
];
