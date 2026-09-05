export type MenuCategoryId =
  | "featured"
  | "burgers"
  | "loaded-sides"
  | "kids"
  | "beast-boxes"
  | "veg"
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
  category: Exclude<MenuCategoryId, "featured" | "veg">;
  price: number;
  priceConfirmed?: boolean;
  image?: string;
  featured?: boolean;
  canUpgrade?: boolean;
  isKidsItem?: boolean;
  dietaryTags?: DietaryTag[];
  modifierIds?: string[];
  removableIngredients?: string[];
  boxConfig?: BeastBoxConfig;
};

export const adultDrinkChoices = [
  "Coca-Cola",
  "Coke No Sugar",
  "Sprite",
  "Fanta",
  "Lift",
  "Water",
];

// The latest printed menu lists soft drinks or water for the kids' meal upgrade.
export const kidsDrinkChoices = adultDrinkChoices;

const drinkImages: Record<string, string> = {
  "Coca-Cola": "/images/menu/coke.webp",
  "Coke No Sugar": "/images/menu/coke no sugar.webp",
  Sprite: "/images/menu/sprite.jpg",
  Fanta: "/images/menu/fanta.webp",
  Lift: "/images/menu/lift.avif",
  Water: "/images/menu/water.jpg",
};

// Kept in one configuration block so client-approved pricing can be changed safely.
export const comboUpgradePrice = 6.99;
export const pricingNotice =
  "Standalone drink and modifier prices remain provisional. All printed menu item prices and the $6.99 meal upgrade are confirmed.";

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
      "Our signature flame-grilled beef patty with American cheese, crisp lettuce, pickled onion and our house-made NBH Signature Sauce on a toasted milk bun.",
    category: "burgers",
    price: 19,
    image: "/images/menu/og-nasty.jpg",
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
      "Tender flame-grilled peri-peri chicken thigh, marinated in our house-made signature peri-peri sauce, finished with fresh tomato, green cabbage slaw and creamy mayo on a toasted milk bun.",
    category: "burgers",
    price: 19,
    image: "/images/menu/peri-beast.jpg",
    canUpgrade: true,
    dietaryTags: ["Halal"],
    modifierIds: ["chicken-patty", "bacon", "cheese", "house-sauce"],
    removableIngredients: ["Tomato", "Cabbage slaw", "Creamy mayo"],
  },
  {
    id: "hooked",
    name: "Hooked",
    description:
      "Golden beer-battered fish fillet with house-made tartare sauce, American cheese, cos lettuce and creamy mayo on a toasted milk bun.",
    category: "burgers",
    price: 21,
    image: "/images/menu/hooked.jpg",
    canUpgrade: true,
    dietaryTags: ["Halal"],
    modifierIds: ["cheese", "house-sauce"],
    removableIngredients: [
      "Tartare sauce",
      "American cheese",
      "Cos lettuce",
      "Creamy mayo",
    ],
  },
  {
    id: "green-beast",
    name: "Green Beast",
    description:
      "House-made vegetable patty with house-made jalapeño mint mayo, pickled onion, fresh cabbage slaw and American cheese on a toasted milk bun.",
    category: "burgers",
    price: 17,
    image: "/images/menu/green-beast.jpg",
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
    price: 19,
    image: "/images/menu/BBQ-Beast.jpg",
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
      "Eight crispy battered eggplant pieces tossed in our house-made Signature NBH Asian dressing, finished with crispy fried onion and fresh coriander.",
    category: "loaded-sides",
    price: 15,
    image: "/images/menu/dirty-eggplant.jpg",
    canUpgrade: true,
    dietaryTags: ["Vegetarian"],
    modifierIds: ["house-sauce"],
    removableIngredients: ["Crispy fried onion", "Fresh coriander"],
  },
  {
    id: "buffalo-fury",
    name: "Buffalo Fury",
    description:
      "Four whole chicken wings tossed in our house-made Buffalo Fury sauce, finished with blue cheese sauce.",
    category: "loaded-sides",
    price: 15,
    image: "/images/menu/buffalo-fury.jpg",
    canUpgrade: true,
    dietaryTags: ["Halal"],
    modifierIds: ["house-sauce"],
    removableIngredients: ["Buffalo Fury sauce", "Blue cheese sauce"],
  },
  {
    id: "nasty-fries",
    name: "Nasty Fries",
    description:
      "Golden crispy fries tossed in house-made NBH seasoning, served with house-made garlic aioli.",
    category: "loaded-sides",
    price: 10,
    image: "/images/menu/nasty-fries.jpg",
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
    image: "/images/menu/monster-cheese.jpg",
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
    image: "/images/menu/Dino-nuggets.jpg",
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
      "Any Beast Burger · Nasty Fries · 2 Buffalo Fury Wings · 2 Dirty Eggplant Pieces · 1 soft drink or water · Mango Pudding with Lychee Granita & Lychee Pearls.",
    category: "beast-boxes",
    price: 34.99,
    image: "/images/beast-boxes/Solo Beast Box.jpg",
    featured: true,
    boxConfig: { burgerCount: 1, drinkCount: 1 },
  },
  {
    id: "duo-beast-box",
    name: "Duo Beast Box",
    description:
      "Any 2 Beast Burgers · Nasty Fries · 4 Buffalo Fury Wings · 4 Dirty Eggplant Pieces · 2 soft drinks or waters · Mango Pudding with Lychee Granita & Lychee Pearls.",
    category: "beast-boxes",
    price: 59.99,
    image: "/images/beast-boxes/Duo Beast Box.jpg",
    boxConfig: { burgerCount: 2, drinkCount: 2 },
  },
  {
    id: "family-beast-box",
    name: "Family Beast Box",
    description:
      "Any 2 Beast Burgers · 1 Monster Cheese · 2 Nasty Fries · 4 Buffalo Fury Wings · 4 Dirty Eggplant Pieces · 6 Dino Nuggets · 3 soft drinks or waters · Mango Pudding with Lychee Granita & Lychee Pearls.",
    category: "beast-boxes",
    price: 79.99,
    image: "/images/beast-boxes/Family Beast Box.jpg",
    boxConfig: { burgerCount: 2, drinkCount: 3 },
  },
  {
    id: "mango-pudding",
    name: "Mango Pudding with Lychee Granita & Lychee Pearls",
    description:
      "A refreshing tropical dessert with silky mango pudding, lychee granita and lychee pearls.",
    category: "sweet",
    price: 12,
    image: "/images/menu/mango-pudding.jpg",
    dietaryTags: ["Vegetarian"],
  },
  ...adultDrinkChoices.map((name) => ({
    id: name.toLowerCase().replaceAll(" ", "-"),
    name,
    description: name === "Water" ? "Chilled bottle." : "Chilled can.",
    category: "drinks" as const,
    price: 4,
    priceConfirmed: false,
    image: drinkImages[name],
  })),
];
