"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  adultDrinkChoices,
  comboUpgradePrice,
  kidsDrinkChoices,
  menuCategories,
  modifierChoices,
  pricingNotice,
  type DietaryTag,
  type MenuItem,
} from "../data/menu";
import {
  calculateCartSubtotal,
  calculateLineUnitPrice,
  type CartLine,
} from "../lib/order";

type OrderExperienceProps = {
  items: MenuItem[];
};

type CheckoutResult = {
  orderId: string;
  subtotal: number;
  message: string;
};

const CART_STORAGE_KEY = "nasty-burger-cart-v2";
const LEGACY_CART_STORAGE_KEY = "nasty-burger-phase-one-cart";
const LOYALTY_STORAGE_KEY = "nasty-burger-drip-signup";
const LOYALTY_DISMISSED_KEY = "nasty-burger-loyalty-dismissed";
const MONTHLY_SEEN_KEY = "nasty-burger-monthly-seen";

const money = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

function formatPrice(price: number) {
  return money.format(price);
}

function normaliseCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const line = entry as Partial<CartLine> & { modifiers?: unknown };
    if (
      typeof line.lineId !== "string" ||
      typeof line.itemId !== "string" ||
      typeof line.quantity !== "number"
    ) {
      return [];
    }

    const modifiers = Array.isArray(line.modifiers)
      ? line.modifiers.flatMap((modifier) => {
          if (
            modifier &&
            typeof modifier === "object" &&
            "id" in modifier &&
            "quantity" in modifier &&
            typeof modifier.id === "string" &&
            typeof modifier.quantity === "number"
          ) {
            return [{ id: modifier.id, quantity: modifier.quantity }];
          }
          return [];
        })
      : [];

    return [
      {
        lineId: line.lineId,
        itemId: line.itemId,
        quantity: Math.max(1, Math.floor(line.quantity)),
        combo: Boolean(line.combo),
        drink: typeof line.drink === "string" ? line.drink : undefined,
        modifiers,
        removedIngredients: Array.isArray(line.removedIngredients)
          ? line.removedIngredients.filter(
              (ingredient): ingredient is string => typeof ingredient === "string",
            )
          : [],
        boxBurgers: Array.isArray(line.boxBurgers)
          ? line.boxBurgers.filter(
              (burger): burger is string => typeof burger === "string",
            )
          : [],
        boxDrinks: Array.isArray(line.boxDrinks)
          ? line.boxDrinks.filter(
              (drink): drink is string => typeof drink === "string",
            )
          : [],
      },
    ];
  });
}

export default function OrderExperience({ items }: OrderExperienceProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeDietary, setActiveDietary] = useState<DietaryTag | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modifierQuantities, setModifierQuantities] = useState<
    Record<string, number>
  >({});
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [isCombo, setIsCombo] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState("");
  const [boxBurgers, setBoxBurgers] = useState<string[]>([]);
  const [boxDrinks, setBoxDrinks] = useState<string[]>([]);
  const [productQuantity, setProductQuantity] = useState(1);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutState, setCheckoutState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [checkoutErrors, setCheckoutErrors] = useState<string[]>([]);
  const [checkoutResult, setCheckoutResult] =
    useState<CheckoutResult | null>(null);
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false);
  const [loyaltyComplete, setLoyaltyComplete] = useState(false);
  const [loyaltyDismissed, setLoyaltyDismissed] = useState(false);
  const [isMonthlyOpen, setIsMonthlyOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);
  const [selectionError, setSelectionError] = useState("");
  const [announcement, setAnnouncement] = useState("");

  const burgerItems = useMemo(
    () => items.filter((item) => item.category === "burgers"),
    [items],
  );

  const visibleItems = useMemo(() => {
    const categoryItems =
      activeCategory === "all"
        ? items
        : activeCategory === "featured"
          ? items.filter((item) => item.featured)
          : items.filter((item) => item.category === activeCategory);

    return activeDietary
      ? categoryItems.filter((item) =>
          item.dietaryTags?.includes(activeDietary),
        )
      : categoryItems;
  }, [activeCategory, activeDietary, items]);

  const selectedModifiers = useMemo(
    () =>
      modifierChoices.filter(
        (modifier) => (modifierQuantities[modifier.id] ?? 0) > 0,
      ),
    [modifierQuantities],
  );

  const selectedUnitPrice = useMemo(() => {
    if (!selectedItem) return 0;
    const modifiersTotal = selectedModifiers.reduce(
      (total, modifier) =>
        total + modifier.price * (modifierQuantities[modifier.id] ?? 0),
      0,
    );
    return selectedItem.price + modifiersTotal + (isCombo ? comboUpgradePrice : 0);
  }, [isCombo, modifierQuantities, selectedItem, selectedModifiers]);

  const cartCount = cart.reduce(
    (total, line) => total + line.quantity,
    0,
  );
  const cartSubtotal = calculateCartSubtotal(cart);

  useEffect(() => {
    const storedCart =
      window.localStorage.getItem(CART_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_CART_STORAGE_KEY);
    let parsedCart: CartLine[] = [];

    if (storedCart) {
      try {
        parsedCart = normaliseCart(JSON.parse(storedCart));
      } catch {
        window.localStorage.removeItem(CART_STORAGE_KEY);
        window.localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
      }
    }

    const storedLoyaltyComplete =
      window.localStorage.getItem(LOYALTY_STORAGE_KEY) === "complete";
    const storedLoyaltyDismissed =
      window.localStorage.getItem(LOYALTY_DISMISSED_KEY) === "1";

    queueMicrotask(() => {
      setCart(parsedCart);
      setLoyaltyComplete(storedLoyaltyComplete);
      setLoyaltyDismissed(storedLoyaltyDismissed);
      setCartHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!cartHydrated) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart, cartHydrated]);

  useEffect(() => {
    if (
      !cartHydrated ||
      loyaltyComplete ||
      loyaltyDismissed ||
      selectedItem ||
      isCartOpen ||
      isCheckoutOpen ||
      isMonthlyOpen
    ) {
      return;
    }

    const timer = window.setTimeout(() => setIsLoyaltyOpen(true), 1100);
    return () => window.clearTimeout(timer);
  }, [
    cartHydrated,
    isCartOpen,
    isCheckoutOpen,
    isMonthlyOpen,
    loyaltyComplete,
    loyaltyDismissed,
    selectedItem,
  ]);

  useEffect(() => {
    const overlayOpen =
      Boolean(selectedItem) ||
      isCartOpen ||
      isCheckoutOpen ||
      isLoyaltyOpen ||
      isMonthlyOpen;
    document.body.style.overflow = overlayOpen ? "hidden" : "";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setSelectedItem(null);
      setEditingLineId(null);
      setIsCartOpen(false);
      setIsCheckoutOpen(false);
      setIsLoyaltyOpen(false);
      setIsMonthlyOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [
    isCartOpen,
    isCheckoutOpen,
    isLoyaltyOpen,
    isMonthlyOpen,
    selectedItem,
  ]);

  function resetProductForm() {
    setModifierQuantities({});
    setRemovedIngredients([]);
    setIsCombo(false);
    setSelectedDrink("");
    setBoxBurgers([]);
    setBoxDrinks([]);
    setProductQuantity(1);
    setSelectionError("");
  }

  function beginProduct(item: MenuItem) {
    resetProductForm();
    setIsLoyaltyOpen(false);
    setIsCheckoutOpen(false);
    setSelectedItem(item);
  }

  function openItem(item: MenuItem) {
    setEditingLineId(null);
    setIsLoyaltyOpen(false);

    if (
      item.id !== "bbq-beast" &&
      window.sessionStorage.getItem(MONTHLY_SEEN_KEY) !== "1"
    ) {
      setPendingItem(item);
      setIsMonthlyOpen(true);
      window.sessionStorage.setItem(MONTHLY_SEEN_KEY, "1");
      return;
    }

    beginProduct(item);
  }

  function continueAfterMonthly(item: MenuItem | null) {
    setIsMonthlyOpen(false);
    setPendingItem(null);
    if (item) beginProduct(item);
  }

  function closeProduct() {
    setSelectedItem(null);
    setEditingLineId(null);
    setSelectionError("");
  }

  function changeModifier(modifierId: string, amount: number) {
    setModifierQuantities((current) => {
      const nextQuantity = Math.max(
        0,
        Math.min(10, (current[modifierId] ?? 0) + amount),
      );
      return { ...current, [modifierId]: nextQuantity };
    });
  }

  function toggleRemovedIngredient(ingredient: string) {
    setRemovedIngredients((current) =>
      current.includes(ingredient)
        ? current.filter((value) => value !== ingredient)
        : [...current, ingredient],
    );
  }

  function changeBoxSelection(
    type: "burger" | "drink",
    value: string,
    amount: number,
  ) {
    if (!selectedItem?.boxConfig) return;
    const values = type === "burger" ? boxBurgers : boxDrinks;
    const maximum =
      type === "burger"
        ? selectedItem.boxConfig.burgerCount
        : selectedItem.boxConfig.drinkCount;
    const next = [...values];

    if (amount > 0 && next.length < maximum) next.push(value);
    if (amount < 0) {
      const index = next.lastIndexOf(value);
      if (index >= 0) next.splice(index, 1);
    }

    if (type === "burger") setBoxBurgers(next);
    else setBoxDrinks(next);
    setSelectionError("");
  }

  function addSelectedItem() {
    if (!selectedItem) return;
    if (isCombo && !selectedDrink) {
      setSelectionError("Choose a drink before adding this combo.");
      return;
    }
    if (
      selectedItem.boxConfig &&
      boxBurgers.length !== selectedItem.boxConfig.burgerCount
    ) {
      setSelectionError(
        `Choose ${selectedItem.boxConfig.burgerCount} Beast Burger${
          selectedItem.boxConfig.burgerCount === 1 ? "" : "s"
        } for this box.`,
      );
      return;
    }
    if (
      selectedItem.boxConfig &&
      boxDrinks.length !== selectedItem.boxConfig.drinkCount
    ) {
      setSelectionError(
        `Choose ${selectedItem.boxConfig.drinkCount} drink${
          selectedItem.boxConfig.drinkCount === 1 ? "" : "s"
        } for this box.`,
      );
      return;
    }

    const line: CartLine = {
      lineId:
        editingLineId ??
        `${selectedItem.id}-${Date.now().toString(36)}-${cart.length}`,
      itemId: selectedItem.id,
      quantity: productQuantity,
      combo: isCombo,
      drink: isCombo ? selectedDrink : undefined,
      modifiers: selectedModifiers.map((modifier) => ({
        id: modifier.id,
        quantity: modifierQuantities[modifier.id] ?? 0,
      })),
      removedIngredients,
      boxBurgers,
      boxDrinks,
    };

    setCart((current) =>
      editingLineId
        ? current.map((entry) =>
            entry.lineId === editingLineId ? line : entry,
          )
        : [...current, line],
    );
    setAnnouncement(
      `${selectedItem.name} ${editingLineId ? "updated" : "added to your order"}.`,
    );
    setSelectedItem(null);
    setEditingLineId(null);
    setIsCartOpen(true);
  }

  function editCartLine(line: CartLine) {
    const item = items.find((entry) => entry.id === line.itemId);
    if (!item) return;

    setIsCartOpen(false);
    setEditingLineId(line.lineId);
    setModifierQuantities(
      Object.fromEntries(
        line.modifiers.map((modifier) => [modifier.id, modifier.quantity]),
      ),
    );
    setRemovedIngredients(line.removedIngredients);
    setIsCombo(line.combo);
    setSelectedDrink(line.drink ?? "");
    setBoxBurgers(line.boxBurgers);
    setBoxDrinks(line.boxDrinks);
    setProductQuantity(line.quantity);
    setSelectionError("");
    setSelectedItem(item);
  }

  function updateQuantity(lineId: string, amount: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.lineId === lineId
            ? { ...line, quantity: line.quantity + amount }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  function removeLine(lineId: string) {
    setCart((current) => current.filter((line) => line.lineId !== lineId));
    setAnnouncement("Item removed from your order.");
  }

  function lineDetails(line: CartLine) {
    const details: string[] = [];
    if (line.combo) details.push(`Combo · ${line.drink}`);
    if (line.boxBurgers.length > 0) {
      details.push(
        `Burgers: ${line.boxBurgers
          .map(
            (id) => items.find((item) => item.id === id)?.name ?? id,
          )
          .join(", ")}`,
      );
    }
    if (line.boxDrinks.length > 0) {
      details.push(`Drinks: ${line.boxDrinks.join(", ")}`);
    }
    if (line.modifiers.length > 0) {
      details.push(
        line.modifiers
          .map((selection) => {
            const name =
              modifierChoices.find(
                (modifier) => modifier.id === selection.id,
              )?.name ?? selection.id;
            return `${selection.quantity}× ${name}`;
          })
          .join(", "),
      );
    }
    if (line.removedIngredients.length > 0) {
      details.push(`Without: ${line.removedIngredients.join(", ")}`);
    }
    return details;
  }

  function submitLoyalty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.localStorage.setItem(LOYALTY_STORAGE_KEY, "complete");
    window.localStorage.setItem(LOYALTY_DISMISSED_KEY, "1");
    setLoyaltyComplete(true);
    setLoyaltyDismissed(true);
    setAnnouncement("Drip Points signup saved for this functional draft.");
  }

  function closeLoyalty() {
    window.localStorage.setItem(LOYALTY_DISMISSED_KEY, "1");
    setLoyaltyDismissed(true);
    setIsLoyaltyOpen(false);
  }

  function openLoyalty() {
    setSelectedItem(null);
    setEditingLineId(null);
    setIsCartOpen(false);
    setIsCheckoutOpen(false);
    setIsMonthlyOpen(false);
    setIsLoyaltyOpen(true);
  }

  function openCart() {
    setIsLoyaltyOpen(false);
    setIsCheckoutOpen(false);
    setIsMonthlyOpen(false);
    setSelectedItem(null);
    setEditingLineId(null);
    setIsCartOpen(true);
  }

  function openCheckout() {
    if (cart.length === 0) return;
    setCheckoutState("idle");
    setCheckoutErrors([]);
    setCheckoutResult(null);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (checkoutState === "submitting" || cart.length === 0) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    setCheckoutState("submitting");
    setCheckoutErrors([]);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: crypto.randomUUID(),
          customer: {
            name: data.get("name"),
            email: data.get("email"),
            phone: data.get("phone"),
          },
          notes: data.get("notes"),
          pickupMethod: "asap",
          cart,
          clientSubtotal: cartSubtotal,
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        errors?: string[];
        orderId?: string;
        subtotal?: number;
        message?: string;
      };

      if (
        !response.ok ||
        !result.ok ||
        !result.orderId ||
        typeof result.subtotal !== "number"
      ) {
        setCheckoutErrors(
          result.errors?.length
            ? result.errors
            : ["The order could not be validated. Please try again."],
        );
        setCheckoutState("error");
        return;
      }

      setCheckoutResult({
        orderId: result.orderId,
        subtotal: result.subtotal,
        message: result.message ?? "Order validated successfully.",
      });
      setCart([]);
      setCheckoutState("success");
      setAnnouncement(`Demo order ${result.orderId} validated successfully.`);
    } catch {
      setCheckoutErrors([
        "We could not reach the order service. Check your connection and try again.",
      ]);
      setCheckoutState("error");
    }
  }

  function filterAndScroll(category: string) {
    setActiveCategory(category);
    window.setTimeout(
      () => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" }),
      0,
    );
  }

  const drinksForSelectedItem = selectedItem?.isKidsItem
    ? kidsDrinkChoices
    : adultDrinkChoices;
  const allowedModifiers = modifierChoices.filter((modifier) =>
    selectedItem?.modifierIds?.includes(modifier.id),
  );
  const monthlyItem = items.find((item) => item.id === "bbq-beast");
  const soloBox = items.find((item) => item.id === "solo-beast-box");

  return (
    <div className="site-shell">
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <div className="service-bar" id="find-us">
        <div className="service-bar__status">
          <span className="status-dot" aria-hidden="true" />
          <strong>Draft service status</strong>
        </div>
        <p>Franklin Woolworths Carpark · 12 PM–10 PM</p>
        <p>Estimated prep: 10–15 min</p>
        <a href="#location">View location</a>
      </div>

      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Nasty Burger House home">
          <Image
            className="brand-logo brand-logo--header"
            src="/logo.webp"
            alt=""
            width={256}
            height={256}
            priority
          />
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#menu">Menu</a>
          <a href="#beast-month">Beast of the Month</a>
          <a href="#location">Find Us</a>
        </nav>
        <div className="header-actions">
          <button className="text-button" type="button" onClick={openLoyalty}>
            {loyaltyComplete ? "Drip Points joined" : "Join Drip Points"}
          </button>
          <button
            className="cart-button"
            type="button"
            onClick={openCart}
            aria-label={`Open order, ${cartCount} items`}
          >
            Order <span>{cartCount}</span>
          </button>
        </div>
      </header>

      <main id="top">
        <section className="order-hero" aria-labelledby="hero-title">
          <div className="order-hero__copy">
            <p className="eyebrow">Made for mobile pickup</p>
            <h1 id="hero-title">Choose it. Load it. Get nasty.</h1>
            <p>
              Browse the menu, customise every item, build a Beast Box and keep
              your order open while you explore.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#menu">
                Start an order
              </a>
              <a className="secondary-button" href="#location">
                Find today&apos;s truck
              </a>
            </div>
            <small>
              Function-first development build. Checkout and live truck data
              will connect after client platform access is supplied.
            </small>
          </div>
          <div className="order-hero__image">
            <Image
              src="/images/signature-beast.webp"
              alt="Double smash burger with cheese, pickles, onions and sauce"
              fill
              priority
              sizes="(max-width: 760px) 100vw, 50vw"
            />
          </div>
        </section>

        <section
          className="quick-promos"
          id="beast-month"
          aria-label="Featured offers"
        >
          <article className="promo-card promo-card--hot">
            <p className="eyebrow">Rotating feature</p>
            <h2>BBQ Beast</h2>
            <p>
              Beef, crispy bacon, American cheese and house-made Bourbon BBQ
              sauce.
            </p>
            <button
              type="button"
              onClick={() => monthlyItem && beginProduct(monthlyItem)}
            >
              Build yours · {monthlyItem ? formatPrice(monthlyItem.price) : ""}
            </button>
          </article>
          <article className="promo-card">
            <p className="eyebrow">Built for sharing</p>
            <h2>Beast Boxes</h2>
            <p>
              Choose the burgers and drinks for Solo, Duo or Family-sized feeds.
            </p>
            <button type="button" onClick={() => filterAndScroll("beast-boxes")}>
              Browse boxes
            </button>
          </article>
        </section>

        <section className="menu-section" id="menu" aria-labelledby="menu-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Build your pickup</p>
              <h2 id="menu-title">Explore the menu</h2>
            </div>
            <p>
              Halal and vegetarian labels follow the supplied menu. Gluten-free
              and allergen filters remain off until the client verifies them.
            </p>
          </div>

          <div className="category-tabs" aria-label="Menu categories">
            {menuCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={activeCategory === category.id ? "is-active" : ""}
                onClick={() => setActiveCategory(category.id)}
                aria-pressed={activeCategory === category.id}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="dietary-filters" aria-label="Dietary filters">
            <span>Quick filter</span>
            {(["Halal", "Vegetarian"] as DietaryTag[]).map((filter) => (
              <button
                key={filter}
                type="button"
                className={activeDietary === filter ? "is-active" : ""}
                onClick={() =>
                  setActiveDietary((current) =>
                    current === filter ? null : filter,
                  )
                }
                aria-pressed={activeDietary === filter}
              >
                {filter}
              </button>
            ))}
          </div>

          {visibleItems.length === 0 ? (
            <div className="menu-empty">
              <h3>No matching items.</h3>
              <p>Clear the dietary filter to view this category.</p>
              <button type="button" onClick={() => setActiveDietary(null)}>
                Clear filter
              </button>
            </div>
          ) : (
            <div className="menu-grid">
              {visibleItems.map((item) => (
                <article className="menu-card" key={item.id}>
                  {item.image ? (
                    <div className="menu-card__image">
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="(max-width: 680px) 100vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="menu-card__placeholder" aria-hidden="true">
                      <span>{item.name.slice(0, 1)}</span>
                    </div>
                  )}
                  <div className="menu-card__content">
                    <div className="menu-card__title">
                      <h3>{item.name}</h3>
                      {item.featured && <span>Featured</span>}
                    </div>
                    {item.dietaryTags && (
                      <p className="menu-card__tags">
                        {item.dietaryTags.join(" · ")}
                      </p>
                    )}
                    <p>{item.description}</p>
                    <div className="menu-card__action">
                      <strong>{formatPrice(item.price)}</strong>
                      <button type="button" onClick={() => openItem(item)}>
                        {item.boxConfig || item.canUpgrade || item.modifierIds
                          ? "Customise"
                          : "Add"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          <p className="pricing-notice">{pricingNotice}</p>
        </section>

        <section
          className="location-section"
          id="location"
          aria-labelledby="location-title"
        >
          <div>
            <p className="eyebrow">Today&apos;s service</p>
            <h2 id="location-title">Know where the truck is before ordering.</h2>
          </div>
          <dl>
            <div>
              <dt>Status</dt>
              <dd>Draft location data</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>Franklin Woolworths Carpark</dd>
            </div>
            <div>
              <dt>Trading hours</dt>
              <dd>12 PM–10 PM</dd>
            </div>
            <div>
              <dt>Preparation</dt>
              <dd>Approximately 10–15 min</dd>
            </div>
          </dl>
          <p className="location-note">
            The final Google Maps link and daily update method are still required.
          </p>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand">
          <Image
            className="brand-logo brand-logo--footer"
            src="/logo.webp"
            alt="Nasty Burger House"
            width={256}
            height={256}
          />
          <p>Function-first ordering website by Brahmanda Tech.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="#menu">Menu</a>
          <a href="#location">Find Us</a>
          <button type="button" onClick={openLoyalty}>
            Drip Points
          </button>
        </nav>
      </footer>

      <div className="mobile-order-bar" aria-label="Mobile ordering actions">
        <a href="#location">Find Us</a>
        <button type="button" onClick={openCart}>
          {cartCount > 0
            ? `View Order · ${formatPrice(cartSubtotal)}`
            : "Order Now"}
        </button>
      </div>

      {selectedItem && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
          >
            <button
              className="close-button"
              type="button"
              onClick={closeProduct}
              aria-label="Close product customisation"
            >
              ×
            </button>
            <p className="eyebrow">
              {editingLineId ? "Edit your item" : "Customise your item"}
            </p>
            <h2 id="product-modal-title">{selectedItem.name}</h2>
            <p>{selectedItem.description}</p>
            <p className="pending-price">{formatPrice(selectedItem.price)}</p>

            {selectedItem.boxConfig && (
              <>
                <fieldset>
                  <legend>
                    Choose {selectedItem.boxConfig.burgerCount} Beast Burger
                    {selectedItem.boxConfig.burgerCount === 1 ? "" : "s"}
                    <span>
                      {boxBurgers.length}/{selectedItem.boxConfig.burgerCount}
                    </span>
                  </legend>
                  <div className="stepper-list">
                    {burgerItems.map((burger) => {
                      const count = boxBurgers.filter(
                        (id) => id === burger.id,
                      ).length;
                      return (
                        <div className="stepper-row" key={burger.id}>
                          <span>{burger.name}</span>
                          <div className="quantity-control">
                            <button
                              type="button"
                              onClick={() =>
                                changeBoxSelection("burger", burger.id, -1)
                              }
                              aria-label={`Remove ${burger.name}`}
                              disabled={count === 0}
                            >
                              −
                            </button>
                            <span>{count}</span>
                            <button
                              type="button"
                              onClick={() =>
                                changeBoxSelection("burger", burger.id, 1)
                              }
                              aria-label={`Add ${burger.name}`}
                              disabled={
                                boxBurgers.length >=
                                selectedItem.boxConfig!.burgerCount
                              }
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </fieldset>

                <fieldset>
                  <legend>
                    Choose {selectedItem.boxConfig.drinkCount} drink
                    {selectedItem.boxConfig.drinkCount === 1 ? "" : "s"}
                    <span>
                      {boxDrinks.length}/{selectedItem.boxConfig.drinkCount}
                    </span>
                  </legend>
                  <div className="stepper-list">
                    {adultDrinkChoices.map((drink) => {
                      const count = boxDrinks.filter(
                        (value) => value === drink,
                      ).length;
                      return (
                        <div className="stepper-row" key={drink}>
                          <span>{drink}</span>
                          <div className="quantity-control">
                            <button
                              type="button"
                              onClick={() =>
                                changeBoxSelection("drink", drink, -1)
                              }
                              aria-label={`Remove ${drink}`}
                              disabled={count === 0}
                            >
                              −
                            </button>
                            <span>{count}</span>
                            <button
                              type="button"
                              onClick={() =>
                                changeBoxSelection("drink", drink, 1)
                              }
                              aria-label={`Add ${drink}`}
                              disabled={
                                boxDrinks.length >=
                                selectedItem.boxConfig!.drinkCount
                              }
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </fieldset>
              </>
            )}

            {selectedItem.canUpgrade && (
              <fieldset>
                <legend>Upgrade</legend>
                <label className="option-row">
                  <input
                    type="checkbox"
                    checked={isCombo}
                    onChange={(event) => {
                      setIsCombo(event.target.checked);
                      setSelectedDrink("");
                      setSelectionError("");
                    }}
                  />
                  <span>
                    Make it a combo · +{formatPrice(comboUpgradePrice)}
                    <small>Nasty Fries plus your choice of drink.</small>
                  </span>
                </label>
              </fieldset>
            )}

            {isCombo && (
              <fieldset>
                <legend>Choose your drink</legend>
                <div className="choice-grid">
                  {drinksForSelectedItem.map((drink) => (
                    <button
                      key={drink}
                      type="button"
                      className={selectedDrink === drink ? "is-selected" : ""}
                      onClick={() => {
                        setSelectedDrink(drink);
                        setSelectionError("");
                      }}
                      aria-pressed={selectedDrink === drink}
                    >
                      {drink}
                    </button>
                  ))}
                </div>
                {selectedItem.isKidsItem && (
                  <small className="field-note">
                    Kids&apos; juice choices remain provisional until client approval.
                  </small>
                )}
              </fieldset>
            )}

            {allowedModifiers.length > 0 && (
              <fieldset>
                <legend>One-tap extras</legend>
                <div className="stepper-list">
                  {allowedModifiers.map((modifier) => (
                    <div className="stepper-row" key={modifier.id}>
                      <span>
                        {modifier.name}
                        <small>+{formatPrice(modifier.price)} each</small>
                      </span>
                      <div
                        className="quantity-control"
                        aria-label={`Quantity for ${modifier.name}`}
                      >
                        <button
                          type="button"
                          onClick={() => changeModifier(modifier.id, -1)}
                          disabled={(modifierQuantities[modifier.id] ?? 0) === 0}
                        >
                          −
                        </button>
                        <span>{modifierQuantities[modifier.id] ?? 0}</span>
                        <button
                          type="button"
                          onClick={() => changeModifier(modifier.id, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>
            )}

            {selectedItem.removableIngredients &&
              selectedItem.removableIngredients.length > 0 && (
                <fieldset>
                  <legend>Remove ingredients</legend>
                  <div className="choice-grid">
                    {selectedItem.removableIngredients.map((ingredient) => (
                      <button
                        key={ingredient}
                        type="button"
                        className={
                          removedIngredients.includes(ingredient)
                            ? "is-selected"
                            : ""
                        }
                        onClick={() => toggleRemovedIngredient(ingredient)}
                        aria-pressed={removedIngredients.includes(ingredient)}
                      >
                        No {ingredient}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

            <div className="product-total-row">
              <div className="quantity-control" aria-label="Product quantity">
                <button
                  type="button"
                  onClick={() =>
                    setProductQuantity((current) => Math.max(1, current - 1))
                  }
                  disabled={productQuantity === 1}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span>{productQuantity}</span>
                <button
                  type="button"
                  onClick={() => setProductQuantity((current) => current + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <strong>{formatPrice(selectedUnitPrice * productQuantity)}</strong>
            </div>

            {selectionError && (
              <p className="selection-error" role="alert">
                {selectionError}
              </p>
            )}
            <button
              className="primary-button full-width"
              type="button"
              onClick={addSelectedItem}
            >
              {editingLineId ? "Save changes" : "Add to order"}
            </button>
          </section>
        </div>
      )}

      {isMonthlyOpen && monthlyItem && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="monthly-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="monthly-modal-title"
          >
            <button
              className="close-button"
              type="button"
              onClick={() => continueAfterMonthly(pendingItem)}
              aria-label="Close monthly offer"
            >
              ×
            </button>
            <p className="eyebrow">Before you choose</p>
            <h2 id="monthly-modal-title">Meet this month&apos;s beast.</h2>
            <h3>BBQ Beast · {formatPrice(monthlyItem.price)}</h3>
            <p>{monthlyItem.description}</p>
            <div className="modal-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => continueAfterMonthly(pendingItem)}
              >
                Keep my choice
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={() => continueAfterMonthly(monthlyItem)}
              >
                Try BBQ Beast
              </button>
            </div>
          </section>
        </div>
      )}

      {isCartOpen && (
        <div className="drawer-backdrop" role="presentation">
          <aside
            className="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
          >
            <div className="drawer-heading">
              <div>
                <p className="eyebrow">Pickup order</p>
                <h2 id="cart-title">Your order</h2>
              </div>
              <button
                className="close-button"
                type="button"
                onClick={() => setIsCartOpen(false)}
                aria-label="Close order drawer"
              >
                ×
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart">
                <h3>Your order is empty.</h3>
                <p>Choose an item from the menu to begin.</p>
                <button type="button" onClick={() => setIsCartOpen(false)}>
                  Browse menu
                </button>
              </div>
            ) : (
              <div className="cart-lines">
                {cart.map((line) => {
                  const item = items.find((entry) => entry.id === line.itemId);
                  if (!item) return null;
                  const details = lineDetails(line);
                  const lineTotal =
                    calculateLineUnitPrice(line, item) * line.quantity;

                  return (
                    <article className="cart-line" key={line.lineId}>
                      <div className="cart-line__main">
                        <h3>{item.name}</h3>
                        {details.map((detail) => (
                          <p key={detail}>{detail}</p>
                        ))}
                        <strong>{formatPrice(lineTotal)}</strong>
                        <div className="cart-line__actions">
                          <button type="button" onClick={() => editCartLine(line)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeLine(line.lineId)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div
                        className="quantity-control"
                        aria-label={`Quantity for ${item.name}`}
                      >
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.lineId, -1)}
                        >
                          −
                        </button>
                        <span>{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.lineId, 1)}
                        >
                          +
                        </button>
                      </div>
                    </article>
                  );
                })}

                {!cart.some((line) => line.itemId.includes("beast-box")) &&
                  soloBox && (
                    <button
                      className="cart-upsell"
                      type="button"
                      onClick={() => {
                        setIsCartOpen(false);
                        beginProduct(soloBox);
                      }}
                    >
                      <span>Ordering for a crew?</span>
                      Build a Solo Beast Box · {formatPrice(soloBox.price)}
                    </button>
                  )}

                <div className="pickup-summary">
                  <strong>Pickup details</strong>
                  <p>Franklin Woolworths Carpark</p>
                  <p>Estimated preparation: 10–15 minutes</p>
                </div>

                <div className="checkout-summary">
                  <div className="checkout-total">
                    <span>Subtotal</span>
                    <strong>{formatPrice(cartSubtotal)}</strong>
                  </div>
                  <p>{pricingNotice}</p>
                  <button type="button" onClick={openCheckout}>
                    Continue to checkout
                  </button>
                  <div className="wallet-labels" aria-label="Planned express payments">
                    <span>Apple Pay</span>
                    <span>Google Pay</span>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {isCheckoutOpen && (
        <div className="modal-backdrop checkout-backdrop" role="presentation">
          <section
            className="checkout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
          >
            <button
              className="close-button"
              type="button"
              onClick={() => setIsCheckoutOpen(false)}
              aria-label="Close checkout"
            >
              ×
            </button>

            {checkoutState === "success" && checkoutResult ? (
              <div className="checkout-success">
                <span className="checkout-success__mark" aria-hidden="true">
                  ✓
                </span>
                <p className="eyebrow">Demo order validated</p>
                <h2 id="checkout-title">Your checkout flow works.</h2>
                <p className="checkout-reference">{checkoutResult.orderId}</p>
                <p>
                  The server recalculated and accepted the order for
                  {" "}{formatPrice(checkoutResult.subtotal)}.
                </p>
                <div className="demo-warning">
                  <strong>No payment was taken.</strong>
                  <p>
                    This demo order was not saved or sent to the kitchen. Live
                    submission will activate after Square, Stripe or another
                    order platform is connected.
                  </p>
                </div>
                <button
                  className="primary-button full-width"
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                >
                  Return to menu
                </button>
              </div>
            ) : (
              <form className="checkout-form" onSubmit={submitOrder}>
                <div className="checkout-heading">
                  <Image
                    className="brand-logo brand-logo--checkout"
                    src="/logo.webp"
                    alt="Nasty Burger House"
                    width={256}
                    height={256}
                  />
                  <div>
                    <p className="eyebrow">ASAP pickup · Demo mode</p>
                    <h2 id="checkout-title">Checkout</h2>
                    <p>
                      Review your pickup, add contact details and validate the
                      complete order before payment is connected.
                    </p>
                  </div>
                </div>

                <div className="checkout-layout">
                  <div className="checkout-fields">
                    <section className="checkout-section" aria-labelledby="pickup-heading">
                      <div className="checkout-section__heading">
                        <span>1</span>
                        <div>
                          <h3 id="pickup-heading">Pickup</h3>
                          <p>ASAP · Estimated preparation 10–15 minutes</p>
                        </div>
                      </div>
                      <div className="checkout-location-card">
                        <strong>Franklin Woolworths Carpark</strong>
                        <span>Draft location · final map link pending</span>
                      </div>
                    </section>

                    <section className="checkout-section" aria-labelledby="contact-heading">
                      <div className="checkout-section__heading">
                        <span>2</span>
                        <div>
                          <h3 id="contact-heading">Contact details</h3>
                          <p>Used to identify your pickup order.</p>
                        </div>
                      </div>
                      <div className="checkout-inputs">
                        <label>
                          Pickup name
                          <input
                            name="name"
                            type="text"
                            autoComplete="name"
                            minLength={2}
                            maxLength={80}
                            required
                          />
                        </label>
                        <label>
                          Email address
                          <input
                            name="email"
                            type="email"
                            autoComplete="email"
                            maxLength={160}
                            required
                          />
                        </label>
                        <label>
                          Mobile number
                          <input
                            name="phone"
                            type="tel"
                            autoComplete="tel"
                            minLength={8}
                            maxLength={24}
                            placeholder="04xx xxx xxx"
                            required
                          />
                        </label>
                        <label>
                          Order notes <span>Optional</span>
                          <textarea
                            name="notes"
                            rows={3}
                            maxLength={300}
                            placeholder="Pickup or preparation notes"
                          />
                        </label>
                      </div>
                    </section>

                    <section className="checkout-section" aria-labelledby="payment-heading">
                      <div className="checkout-section__heading">
                        <span>3</span>
                        <div>
                          <h3 id="payment-heading">Payment</h3>
                          <p>Payment provider connection is still required.</p>
                        </div>
                      </div>
                      <div className="payment-placeholder">
                        <div>
                          <strong>Demo validation only</strong>
                          <span>No card or wallet details will be requested.</span>
                        </div>
                        <div className="wallet-labels" aria-label="Planned express payments">
                          <span>Apple Pay</span>
                          <span>Google Pay</span>
                        </div>
                      </div>
                    </section>
                  </div>

                  <aside className="checkout-review" aria-labelledby="review-heading">
                    <div className="checkout-review__heading">
                      <h3 id="review-heading">Order review</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCheckoutOpen(false);
                          setIsCartOpen(true);
                        }}
                      >
                        Edit order
                      </button>
                    </div>
                    <div className="checkout-review__lines">
                      {cart.map((line) => {
                        const item = items.find(
                          (entry) => entry.id === line.itemId,
                        );
                        if (!item) return null;
                        return (
                          <div key={line.lineId}>
                            <span>
                              {line.quantity}× {item.name}
                            </span>
                            <strong>
                              {formatPrice(
                                calculateLineUnitPrice(line, item) * line.quantity,
                              )}
                            </strong>
                          </div>
                        );
                      })}
                    </div>
                    <div className="checkout-review__total">
                      <span>Subtotal</span>
                      <strong>{formatPrice(cartSubtotal)}</strong>
                    </div>
                    <p className="allergen-note">
                      Tell the truck team about allergies before ordering.
                      Gluten-free and cross-contamination information is awaiting
                      client verification.
                    </p>

                    {checkoutErrors.length > 0 && (
                      <div className="checkout-errors" role="alert">
                        <strong>Please check your order:</strong>
                        <ul>
                          {checkoutErrors.map((error) => (
                            <li key={error}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      className="primary-button full-width"
                      type="submit"
                      disabled={checkoutState === "submitting"}
                    >
                      {checkoutState === "submitting"
                        ? "Validating order…"
                        : "Submit demo order"}
                    </button>
                    <small>
                      Demo mode does not charge, save or send this order.
                    </small>
                  </aside>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {isLoyaltyOpen && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="loyalty-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="loyalty-title"
          >
            <button
              className="close-button"
              type="button"
              onClick={closeLoyalty}
              aria-label="Close Drip Points signup"
            >
              ×
            </button>
            <p className="eyebrow">500 instant Drip Points</p>
            <h2 id="loyalty-title">Get Nasty. Earn Drip Points. Eat Free.</h2>
            <p>
              Sign up with your email and phone number to start 25% of the way
              to a free Beast Burger Meal.
            </p>

            {loyaltyComplete ? (
              <div className="loyalty-success">
                <strong>You&apos;ve got 500 Drip Points.</strong>
                <p>
                  Purchase earning and redemption will connect with the client&apos;s
                  loyalty platform.
                </p>
                <button
                  className="primary-button full-width"
                  type="button"
                  onClick={() => setIsLoyaltyOpen(false)}
                >
                  Start ordering
                </button>
              </div>
            ) : (
              <form onSubmit={submitLoyalty}>
                <label>
                  Email
                  <input type="email" name="email" autoComplete="email" required />
                </label>
                <label>
                  Phone number
                  <input type="tel" name="phone" autoComplete="tel" required />
                </label>
                <button className="primary-button full-width" type="submit">
                  Get 500 Drip Points
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
