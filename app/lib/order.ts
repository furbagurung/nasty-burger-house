import {
  adultDrinkChoices,
  comboUpgradePrice,
  kidsDrinkChoices,
  menuItems,
  modifierChoices,
  type MenuItem,
} from "../data/menu";

export type ModifierQuantity = {
  id: string;
  quantity: number;
};

export type CartLine = {
  lineId: string;
  itemId: string;
  quantity: number;
  combo: boolean;
  drink?: string;
  modifiers: ModifierQuantity[];
  removedIngredients: string[];
  boxBurgers: string[];
  boxDrinks: string[];
};

export type CheckoutCustomer = {
  name: string;
  email: string;
  phone: string;
};

export type PaymentMethod = "pay_at_pickup";

export type ValidatedOrder = {
  requestId: string;
  customerId?: string;
  dripMember: boolean;
  customer: CheckoutCustomer;
  notes: string;
  pickupMethod: "asap";
  paymentMethod: PaymentMethod;
  cart: CartLine[];
  subtotal: number;
};

type OrderValidationResult =
  | { ok: true; order: ValidatedOrder }
  | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateLineUnitPrice(line: CartLine, item: MenuItem) {
  const modifiersTotal = line.modifiers.reduce((total, selection) => {
    const modifier = modifierChoices.find(
      (choice) => choice.id === selection.id,
    );
    return total + (modifier?.price ?? 0) * selection.quantity;
  }, 0);

  return roundCurrency(
    item.price + modifiersTotal + (line.combo ? comboUpgradePrice : 0),
  );
}

export function calculateCartSubtotal(lines: CartLine[]) {
  return roundCurrency(
    lines.reduce((total, line) => {
      const item = menuItems.find((entry) => entry.id === line.itemId);
      return item
        ? total + calculateLineUnitPrice(line, item) * line.quantity
        : total;
    }, 0),
  );
}

function parseCartLine(value: unknown, index: number, errors: string[]) {
  if (!isRecord(value)) {
    errors.push(`Order item ${index + 1} is invalid.`);
    return null;
  }

  const item =
    typeof value.itemId === "string"
      ? menuItems.find((entry) => entry.id === value.itemId)
      : undefined;
  if (!item) {
    errors.push(`Order item ${index + 1} is no longer available.`);
    return null;
  }

  if (
    typeof value.lineId !== "string" ||
    value.lineId.length < 1 ||
    value.lineId.length > 100
  ) {
    errors.push(`${item.name} has an invalid order reference.`);
    return null;
  }
  if (
    typeof value.quantity !== "number" ||
    !Number.isInteger(value.quantity) ||
    value.quantity < 1 ||
    value.quantity > 20
  ) {
    errors.push(`${item.name} must have a quantity between 1 and 20.`);
    return null;
  }
  if (typeof value.combo !== "boolean") {
    errors.push(`${item.name} has an invalid combo selection.`);
    return null;
  }

  const drink = typeof value.drink === "string" ? value.drink : undefined;
  if (value.combo) {
    const allowedDrinks = item.isKidsItem
      ? kidsDrinkChoices
      : adultDrinkChoices;
    if (!item.canUpgrade || !drink || !allowedDrinks.includes(drink)) {
      errors.push(`${item.name} needs a valid combo drink.`);
      return null;
    }
  } else if (drink) {
    errors.push(`${item.name} includes a drink without a combo.`);
    return null;
  }

  const modifiers: ModifierQuantity[] = [];
  if (!Array.isArray(value.modifiers)) {
    errors.push(`${item.name} has invalid extras.`);
    return null;
  }
  for (const modifierValue of value.modifiers) {
    if (
      !isRecord(modifierValue) ||
      typeof modifierValue.id !== "string" ||
      typeof modifierValue.quantity !== "number" ||
      !Number.isInteger(modifierValue.quantity) ||
      modifierValue.quantity < 1 ||
      modifierValue.quantity > 10 ||
      !item.modifierIds?.includes(modifierValue.id) ||
      modifiers.some((selection) => selection.id === modifierValue.id)
    ) {
      errors.push(`${item.name} has an unavailable or invalid extra.`);
      return null;
    }
    modifiers.push({
      id: modifierValue.id,
      quantity: modifierValue.quantity,
    });
  }

  if (!Array.isArray(value.removedIngredients)) {
    errors.push(`${item.name} has invalid ingredient changes.`);
    return null;
  }
  const removedIngredients = value.removedIngredients.filter(
    (ingredient): ingredient is string => typeof ingredient === "string",
  );
  if (
    removedIngredients.length !== value.removedIngredients.length ||
    new Set(removedIngredients).size !== removedIngredients.length ||
    removedIngredients.some(
      (ingredient) => !item.removableIngredients?.includes(ingredient),
    )
  ) {
    errors.push(`${item.name} has an unavailable ingredient change.`);
    return null;
  }

  if (!Array.isArray(value.boxBurgers) || !Array.isArray(value.boxDrinks)) {
    errors.push(`${item.name} has invalid Beast Box choices.`);
    return null;
  }
  const boxBurgers = value.boxBurgers.filter(
    (burger): burger is string => typeof burger === "string",
  );
  const boxDrinks = value.boxDrinks.filter(
    (boxDrink): boxDrink is string => typeof boxDrink === "string",
  );

  if (item.boxConfig) {
    const validBurgerIds = menuItems
      .filter((entry) => entry.category === "burgers")
      .map((entry) => entry.id);
    if (
      boxBurgers.length !== item.boxConfig.burgerCount ||
      boxBurgers.some((burger) => !validBurgerIds.includes(burger)) ||
      boxDrinks.length !== item.boxConfig.drinkCount ||
      boxDrinks.some((boxDrink) => !adultDrinkChoices.includes(boxDrink)) ||
      value.combo ||
      modifiers.length > 0 ||
      removedIngredients.length > 0
    ) {
      errors.push(`${item.name} needs all required burger and drink choices.`);
      return null;
    }
  } else if (boxBurgers.length > 0 || boxDrinks.length > 0) {
    errors.push(`${item.name} cannot contain Beast Box choices.`);
    return null;
  }

  return {
    lineId: value.lineId,
    itemId: item.id,
    quantity: value.quantity,
    combo: value.combo,
    drink,
    modifiers,
    removedIngredients,
    boxBurgers,
    boxDrinks,
  } satisfies CartLine;
}

export function validateOrderPayload(payload: unknown): OrderValidationResult {
  const errors: string[] = [];
  if (!isRecord(payload)) {
    return { ok: false, errors: ["The order payload is invalid."] };
  }

  const requestId =
    typeof payload.requestId === "string" ? payload.requestId.trim() : "";
  if (!/^[a-zA-Z0-9-]{8,100}$/.test(requestId)) {
    errors.push("The checkout request reference is invalid.");
  }

  const rawCustomerId =
    typeof payload.customerId === "string" ? payload.customerId.trim() : "";
  const customerId = rawCustomerId || undefined;
  if (customerId && !/^[a-zA-Z0-9_-]{8,120}$/.test(customerId)) {
    errors.push("The customer account reference is invalid.");
  }
  const dripMember = payload.dripMember === true && Boolean(customerId);

  const customerValue = payload.customer;
  const name =
    isRecord(customerValue) && typeof customerValue.name === "string"
      ? customerValue.name.trim()
      : "";
  const email =
    isRecord(customerValue) && typeof customerValue.email === "string"
      ? customerValue.email.trim().toLowerCase()
      : "";
  const phone =
    isRecord(customerValue) && typeof customerValue.phone === "string"
      ? customerValue.phone.trim()
      : "";

  if (name.length < 2 || name.length > 80) {
    errors.push("Enter a valid pickup name.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
    errors.push("Enter a valid email address.");
  }
  if (!/^[+()\d\s-]{8,24}$/.test(phone)) {
    errors.push("Enter a valid phone number.");
  }

  const notes = typeof payload.notes === "string" ? payload.notes.trim() : "";
  if (notes.length > 300) errors.push("Order notes must be 300 characters or less.");
  if (payload.pickupMethod !== "asap") {
    errors.push("Only ASAP pickup is available in this build.");
  }

  const paymentMethod =
    payload.paymentMethod === undefined ? "pay_at_pickup" : payload.paymentMethod;
  if (paymentMethod !== "pay_at_pickup") {
    errors.push("Only Pay on Pickup is available right now.");
  }

  const cartValues = Array.isArray(payload.cart) ? payload.cart : [];
  if (cartValues.length < 1 || cartValues.length > 50) {
    errors.push("Your order must contain between 1 and 50 items.");
  }
  const cart = cartValues.flatMap((line, index) => {
    const parsedLine = parseCartLine(line, index, errors);
    return parsedLine ? [parsedLine] : [];
  });

  const subtotal = calculateCartSubtotal(cart);
  if (
    cart.length === cartValues.length &&
    (typeof payload.clientSubtotal !== "number" ||
      !Number.isFinite(payload.clientSubtotal) ||
      Math.abs(payload.clientSubtotal - subtotal) > 0.01)
  ) {
    errors.push("The order total changed. Review the cart and try again.");
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    order: {
      requestId,
      customerId,
      dripMember,
      customer: { name, email, phone },
      notes,
      pickupMethod: "asap",
      paymentMethod: "pay_at_pickup",
      cart,
      subtotal,
    },
  };
}
