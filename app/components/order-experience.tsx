"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  adultDrinkChoices,
  comboUpgradePrice,
  kidsDrinkChoices,
  modifierChoices,
  pricingNotice,
  type MenuItem,
} from "../data/menu";
import {
  calculateCartSubtotal,
  calculateLineUnitPrice,
  type CartLine,
} from "../lib/order";
import type { ServiceStatus } from "../lib/service";
import MobileBottomNav from "./mobile-bottom-nav";

type OrderExperienceProps = {
  items: MenuItem[];
  initialServiceStatus: ServiceStatus;
};

type CheckoutResult = {
  orderId: string;
  subtotal: number;
  message: string;
};

const CART_STORAGE_KEY = "nasty-burger-cart-v2";
const LEGACY_CART_STORAGE_KEY = "nasty-burger-phase-one-cart";
const LOYALTY_STORAGE_KEY = "nasty-burger-drip-signup";
const MONTHLY_SEEN_KEY = "nasty-burger-monthly-seen";

type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  ctaLabel: string;
  href?: string;
  action?: "loyalty" | "monthly";
};

const heroSlides: HeroSlide[] = [
  {
    id: "drip-points",
    eyebrow: "Nasty rewards",
    title: "Get Drip Points",
    description:
      "Join Drip Points, get 500 points to start and unlock rewards made for hungry regulars.",
    image: "/images/signature-beast.webp",
    imageAlt: "Nasty Burger House signature burger beside a Drip Points promotion",
    ctaLabel: "Join Drip Points",
    action: "loyalty",
  },
  {
    id: "monthly",
    eyebrow: "Limited-time drop",
    title: "Beast of the Month",
    description:
      "Meet the BBQ Beast: flame-grilled beef, crispy bacon, American cheese and house-made Bourbon BBQ sauce.",
    image: "/images/bbq-beast-hero.webp",
    imageAlt: "BBQ burger with beef patties, bacon, cheese and smoky sauce",
    ctaLabel: "Order the BBQ Beast",
    action: "monthly",
  },
  {
    id: "beast-burgers",
    eyebrow: "Flame-grilled favourites",
    title: "Beast Burgers",
    description:
      "From the OG Nasty to the Peri Beast, explore the full lineup and build your pickup order.",
    image: "/images/signature-beast.webp",
    imageAlt: "Nasty Burger House signature burger with cheese, pickles and sauce",
    ctaLabel: "Explore burgers",
    href: "/menu/burgers",
  },
  {
    id: "save-more",
    eyebrow: "Beast Boxes · From $34.99",
    title: "Get More. Save Money.",
    description:
      "Go Solo, Duo or Family and get burgers, Nasty Fries, bites, drinks and dessert together in one Beast Box.",
    image: "/images/beast-box-hero.webp",
    imageAlt: "Beast Box with burger, fries, wings, eggplant bites and dessert",
    ctaLabel: "Explore Beast Boxes",
    href: "/menu/beast-boxes",
  },
];

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

export default function OrderExperience({
  items,
  initialServiceStatus,
}: OrderExperienceProps) {
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
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
  const [isOrderTypeOpen, setIsOrderTypeOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutState, setCheckoutState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [checkoutErrors, setCheckoutErrors] = useState<string[]>([]);
  const [checkoutResult, setCheckoutResult] =
    useState<CheckoutResult | null>(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState("");
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false);
  const [loyaltyComplete, setLoyaltyComplete] = useState(false);
  const [isMonthlyOpen, setIsMonthlyOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);
  const [selectionError, setSelectionError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [serviceStatus] = useState(initialServiceStatus);

  const burgerItems = useMemo(
    () => items.filter((item) => item.category === "burgers"),
    [items],
  );

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
    queueMicrotask(() => {
      setCart(parsedCart);
      setLoyaltyComplete(storedLoyaltyComplete);
      setCartHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!cartHydrated) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart, cartHydrated]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedItem = items.find((item) => item.id === params.get("item"));
    const shouldOpenCart = params.get("cart") === "1";
    const shouldOpenLoyalty = params.get("loyalty") === "1";
    const shouldOpenOrderType = params.get("order") === "1";

    if (
      !requestedItem &&
      !shouldOpenCart &&
      !shouldOpenLoyalty &&
      !shouldOpenOrderType
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (requestedItem) {
        setIsCartOpen(false);
        setIsLoyaltyOpen(false);
        if (
          requestedItem.id !== "bbq-beast" &&
          window.sessionStorage.getItem(MONTHLY_SEEN_KEY) !== "1"
        ) {
          setPendingItem(requestedItem);
          setIsMonthlyOpen(true);
          window.sessionStorage.setItem(MONTHLY_SEEN_KEY, "1");
        } else {
          setSelectedItem(requestedItem);
          setIsMonthlyOpen(false);
        }
      } else if (shouldOpenCart) {
        setIsCartOpen(true);
      } else if (shouldOpenLoyalty) {
        setIsLoyaltyOpen(true);
      } else if (shouldOpenOrderType) {
        setIsOrderTypeOpen(true);
      }
    }, 0);

    params.delete("item");
    params.delete("cart");
    params.delete("loyalty");
    params.delete("order");
    const remainingQuery = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${remainingQuery ? `?${remainingQuery}` : ""}${window.location.hash}`,
    );

    return () => window.clearTimeout(timer);
  }, [items]);

  useEffect(() => {
    if (
      isHeroPaused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % heroSlides.length);
    }, 6500);

    return () => window.clearInterval(interval);
  }, [isHeroPaused]);

  useEffect(() => {
    const overlayOpen =
      Boolean(selectedItem) ||
      isCartOpen ||
      isOrderTypeOpen ||
      isCheckoutOpen ||
      isLoyaltyOpen ||
      isMonthlyOpen ||
      isMobileNavOpen;
    document.body.style.overflow = overlayOpen ? "hidden" : "";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setSelectedItem(null);
      setEditingLineId(null);
      setIsCartOpen(false);
      setIsOrderTypeOpen(false);
      setIsCheckoutOpen(false);
      setIsLoyaltyOpen(false);
      setIsMonthlyOpen(false);
      setIsMobileNavOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [
    isCartOpen,
    isOrderTypeOpen,
    isCheckoutOpen,
    isLoyaltyOpen,
    isMobileNavOpen,
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
    setIsMobileNavOpen(false);
    setIsOrderTypeOpen(false);
    setIsLoyaltyOpen(false);
    setIsCheckoutOpen(false);
    setSelectedItem(item);
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
    setLoyaltyComplete(true);
    setAnnouncement("Drip Points signup saved for this functional draft.");
  }

  function closeLoyalty() {
    setIsLoyaltyOpen(false);
  }

  function openLoyalty() {
    setIsMobileNavOpen(false);
    setIsOrderTypeOpen(false);
    setSelectedItem(null);
    setEditingLineId(null);
    setIsCartOpen(false);
    setIsCheckoutOpen(false);
    setIsMonthlyOpen(false);
    setIsLoyaltyOpen(true);
  }

  function openCart() {
    setIsMobileNavOpen(false);
    setIsOrderTypeOpen(false);
    setIsLoyaltyOpen(false);
    setIsCheckoutOpen(false);
    setIsMonthlyOpen(false);
    setSelectedItem(null);
    setEditingLineId(null);
    setIsCartOpen(true);
  }

  function openOrderType() {
    setIsMobileNavOpen(false);
    setSelectedItem(null);
    setEditingLineId(null);
    setIsCartOpen(false);
    setIsCheckoutOpen(false);
    setIsLoyaltyOpen(false);
    setIsMonthlyOpen(false);
    setIsOrderTypeOpen(true);
  }

  function openCheckout() {
    if (cart.length === 0) return;
    setCheckoutState("idle");
    setCheckoutErrors([]);
    setCheckoutResult(null);
    setCheckoutRequestId(crypto.randomUUID());
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
          requestId: checkoutRequestId || crypto.randomUUID(),
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
            : ["The order could not be submitted. Please try again."],
        );
        setCheckoutState("error");
        return;
      }

      setCheckoutResult({
        orderId: result.orderId,
        subtotal: result.subtotal,
        message: result.message ?? "Pickup order submitted successfully.",
      });
      setCart([]);
      setCheckoutState("success");
      setAnnouncement(`Pickup order ${result.orderId} submitted successfully.`);
    } catch {
      setCheckoutErrors([
        "We could not reach the order service. Check your connection and try again.",
      ]);
      setCheckoutState("error");
    }
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
          <button className="nav-button" type="button" onClick={openLoyalty}>
            Drip Points
          </button>
        </nav>
        <div className="header-actions">
          <button
            className="mobile-menu-button"
            type="button"
            aria-label="Open navigation"
            aria-expanded={isMobileNavOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMobileNavOpen(true)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
          <button
            className="cart-button"
            type="button"
            onClick={cartCount > 0 ? openCart : openOrderType}
            aria-label={
              cartCount > 0
                ? `View order, ${cartCount} items`
                : "Choose an order type"
            }
          >
            {cartCount > 0 ? "View order" : "Order now"}
            {cartCount > 0 && <span>{cartCount}</span>}
          </button>
        </div>
      </header>

      {isMobileNavOpen && (
        <div className="drawer-backdrop mobile-nav-backdrop" role="presentation">
          <aside
            className="mobile-nav-drawer"
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-navigation-title"
          >
            <div className="drawer-heading">
              <div className="mobile-nav-brand">
                <Image
                  src="/logo.webp"
                  alt="Nasty Burger House"
                  width={256}
                  height={256}
                />
                <div>
                  <p className="eyebrow">Nasty Burger House</p>
                  <h2 id="mobile-navigation-title">Choose your feed.</h2>
                </div>
              </div>
              <button
                className="close-button"
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                aria-label="Close navigation"
              >
                ×
              </button>
            </div>
            <nav className="mobile-nav-links" aria-label="Mobile navigation">
              <Link
                href="/menu/burgers"
                onClick={() => setIsMobileNavOpen(false)}
              >
                Explore menu <span aria-hidden="true">→</span>
              </Link>
              <a
                href="#beast-month"
                onClick={() => setIsMobileNavOpen(false)}
              >
                Beast of the Month <span aria-hidden="true">→</span>
              </a>
              <button type="button" onClick={openLoyalty}>
                Join Drip Points <span aria-hidden="true">→</span>
              </button>
            </nav>
            <button
              className="primary-button full-width"
              type="button"
              onClick={cartCount > 0 ? openCart : openOrderType}
            >
              {cartCount > 0
                ? `View order · ${formatPrice(cartSubtotal)}`
                : "Order now"}
            </button>
          </aside>
        </div>
      )}

      <main className="home-main" id="top">
        <section
          className="hero-carousel"
          id="beast-month"
          aria-label="Featured Nasty Burger House offers"
          aria-roledescription="carousel"
        >
          <div className="hero-carousel__slides" aria-live="off">
            {heroSlides.map((slide, index) => (
              <article
                className={`hero-slide ${
                  activeHeroSlide === index ? "is-active" : ""
                }`}
                aria-hidden={activeHeroSlide !== index}
                key={slide.id}
              >
                <Image
                  className="hero-slide__image"
                  src={slide.image}
                  alt={slide.imageAlt}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                />
                <div className="hero-slide__shade" aria-hidden="true" />
                <div className="hero-slide__copy">
                  <p className="eyebrow">{slide.eyebrow}</p>
                  {index === 0 ? (
                    <h1>{slide.title}</h1>
                  ) : (
                    <h2>{slide.title}</h2>
                  )}
                  <p>{slide.description}</p>
                  <div className="hero-actions">
                    {slide.href ? (
                      <Link className="hero-card__cta" href={slide.href}>
                        {slide.ctaLabel}
                      </Link>
                    ) : (
                      <button
                        className="hero-card__cta"
                        type="button"
                        onClick={
                          slide.action === "loyalty"
                            ? openLoyalty
                            : () =>
                                monthlyItem
                                  ? beginProduct(monthlyItem)
                                  : openOrderType()
                        }
                      >
                        {slide.ctaLabel}
                      </button>
                    )}
                  </div>
                  <div className="hero-carousel__controls">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveHeroSlide(
                          (current) =>
                            (current - 1 + heroSlides.length) % heroSlides.length,
                        )
                      }
                      aria-label="Show previous promotion"
                    >
                      ←
                    </button>
                    <div
                      className="hero-carousel__dots"
                      aria-label="Choose promotion"
                    >
                      {heroSlides.map((dotSlide, dotIndex) => (
                        <button
                          className={
                            activeHeroSlide === dotIndex ? "is-active" : ""
                          }
                          type="button"
                          onClick={() => setActiveHeroSlide(dotIndex)}
                          aria-label={`Show promotion ${dotIndex + 1}: ${dotSlide.title}`}
                          aria-current={
                            activeHeroSlide === dotIndex ? "true" : undefined
                          }
                          key={dotSlide.id}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveHeroSlide(
                          (current) => (current + 1) % heroSlides.length,
                        )
                      }
                      aria-label="Show next promotion"
                    >
                      →
                    </button>
                    <span
                      className="hero-carousel__control-divider"
                      aria-hidden="true"
                    />
                    <button
                      className="hero-carousel__playback"
                      type="button"
                      onClick={() => setIsHeroPaused((current) => !current)}
                      aria-label={
                        isHeroPaused ? "Play carousel" : "Pause carousel"
                      }
                    >
                      <span aria-hidden="true">{isHeroPaused ? "▶" : "Ⅱ"}</span>
                      {isHeroPaused ? "Play" : "Pause"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="menu-preview" id="menu" aria-labelledby="menu-preview-title">
          <div className="menu-preview__heading">
            <p className="eyebrow">Find your favourite</p>
            <h2 id="menu-preview-title">Explore our menu</h2>
            <Link className="outline-button" href="/menu/burgers">View menu</Link>
          </div>
          <div className="menu-preview__grid">
            <div className="menu-preview-card menu-preview-card--featured is-disabled" aria-disabled="true">
              <span>01</span>
              <strong>Beast of the Month</strong>
            </div>
            <Link className="menu-preview-card menu-preview-card--burgers" href="/menu/burgers">
              <span>02</span>
              <strong>Beast Burgers</strong>
            </Link>
            <Link className="menu-preview-card menu-preview-card--sides" href="/menu/loaded-sides">
              <span>03</span>
              <strong>Loaded Sides</strong>
            </Link>
            <Link className="menu-preview-card menu-preview-card--boxes" href="/menu/beast-boxes">
              <span>04</span>
              <strong>Beast Boxes</strong>
            </Link>
            <Link className="menu-preview-card menu-preview-card--drinks" href="/menu/drinks">
              <span>05</span>
              <strong>Drinks</strong>
            </Link>
          </div>
        </section>

        <section className="home-features" aria-label="Popular Nasty Burger House picks">
          <article className="home-feature home-feature--bbq">
            <div className="home-feature__image">
              <Image
                src="/images/bbq-beast-hero.webp"
                alt="BBQ Beast burger with bacon, cheese and smoky sauce"
                fill
                sizes="(max-width: 760px) 100vw, 50vw"
              />
            </div>
            <div className="home-feature__copy">
              <p className="eyebrow">Beast of the Month</p>
              <h2>Meet the BBQ Beast.</h2>
              <p>Smoky Bourbon BBQ, crispy bacon and American cheese stacked for serious appetite.</p>
              <button type="button" onClick={openOrderType}>Order now</button>
            </div>
          </article>
          <article className="home-feature home-feature--boxes">
            <div className="home-feature__image">
              <Image
                src="/images/beast-box-hero.webp"
                alt="Beast Box with burger, fries, wings and sides"
                fill
                sizes="(max-width: 760px) 100vw, 50vw"
              />
            </div>
            <div className="home-feature__copy">
              <p className="eyebrow">Built for sharing</p>
              <h2>Bring the whole crew.</h2>
              <p>Solo, Duo and Family boxes loaded with burgers, wings, fries and more.</p>
              <button type="button" onClick={openOrderType}>Order now</button>
            </div>
          </article>
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
          <p>Big flavour. Zero apologies.</p>
        </div>
        <div className="footer-links">
          <nav aria-label="Menu links">
            <h2>Our menu</h2>
            <Link href="/menu/featured">Featured</Link>
            <Link href="/menu/burgers">Beast Burgers</Link>
            <Link href="/menu/loaded-sides">Loaded Sides</Link>
            <Link href="/menu/beast-boxes">Beast Boxes</Link>
          </nav>
          <nav aria-label="Ordering links">
            <h2>Order</h2>
            <button type="button" onClick={openOrderType}>Order now</button>
            <span>Pickup available</span>
            <span>Uber Eats delivery — coming soon</span>
          </nav>
          <nav aria-label="Nasty Burger House links">
            <h2>Nasty Burger House</h2>
            <a href="#beast-month">Beast of the Month</a>
            <button type="button" onClick={openLoyalty}>
              {loyaltyComplete ? "Drip Points joined" : "Join Drip Points"}
            </button>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Nasty Burger House</span>
          <span>Pickup ordering only</span>
        </div>
      </footer>

      <MobileBottomNav
        active={
          isCartOpen
            ? "cart"
            : isLoyaltyOpen
              ? "profile"
              : isOrderTypeOpen || Boolean(selectedItem) || isCheckoutOpen
                ? "order"
                : "home"
        }
        cartCount={cartCount}
        onOrder={openOrderType}
        onCart={openCart}
        onProfile={openLoyalty}
      />

      {isOrderTypeOpen && (
        <div className="modal-backdrop order-type-backdrop" role="presentation">
          <section
            className="order-type-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-type-title"
          >
            <button
              className="close-button"
              type="button"
              onClick={() => setIsOrderTypeOpen(false)}
              aria-label="Close order type selection"
            >
              ×
            </button>
            <p className="eyebrow">Let&apos;s get started</p>
            <h2 id="order-type-title">Choose your order type</h2>
            <p className="order-type-intro">
              How would you like to get your Nasty Burger House order?
            </p>
            <div className="order-type-options">
              <Link className="order-type-option" href="/menu/burgers">
                <span className="order-type-option__icon" aria-hidden="true">P</span>
                <span>
                  <strong>Pickup</strong>
                  <small>Order ahead and collect</small>
                </span>
                <span className="order-type-option__arrow" aria-hidden="true">→</span>
              </Link>
              <div className="order-type-option order-type-option--disabled" aria-disabled="true">
                <span className="order-type-option__icon order-type-option__icon--uber" aria-hidden="true">U</span>
                <span>
                  <strong>Delivery with Uber Eats</strong>
                  <small>Coming soon</small>
                </span>
                <span className="coming-soon-pill">Soon</span>
              </div>
            </div>
            <p className="order-type-note">
              Pickup is the only available order type right now.
            </p>
          </section>
        </div>
      )}

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
            <p className="pending-price">
              {formatPrice(selectedItem.price)}
              {selectedItem.priceConfirmed === false && (
                <small>Provisional price</small>
              )}
            </p>

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
                    Choose any listed soft drink or water with the meal upgrade.
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
                <Link
                  href="/menu/burgers"
                  onClick={() => setIsCartOpen(false)}
                >
                  Browse menu
                </Link>
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
                  <p>{serviceStatus.locationName}</p>
                  <p>
                    Estimated preparation: {serviceStatus.prepTimeLabel}
                  </p>
                </div>

                <div className="checkout-summary">
                  <div className="checkout-total">
                    <span>Subtotal</span>
                    <strong>{formatPrice(cartSubtotal)}</strong>
                  </div>
                  <p>
                    {serviceStatus.acceptingOrders
                      ? pricingNotice
                      : serviceStatus.notice}
                  </p>
                  <button
                    type="button"
                    onClick={openCheckout}
                    disabled={!serviceStatus.acceptingOrders}
                  >
                    {serviceStatus.acceptingOrders
                      ? "Continue to checkout"
                      : "Ordering unavailable"}
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
                <p className="eyebrow">Pickup order received</p>
                <h2 id="checkout-title">Your order is in.</h2>
                <p className="checkout-reference">{checkoutResult.orderId}</p>
                <p>
                  Your pickup order for {formatPrice(checkoutResult.subtotal)}
                  {" "}has been sent to Nasty Burger House.
                </p>
                <div className="demo-warning">
                  <strong>Pay when you collect.</strong>
                  <p>
                    No online payment has been taken. Keep your order number and
                    present it when collecting your food.
                  </p>
                </div>
                <Link
                  className="primary-button full-width"
                  href="/menu/burgers"
                  onClick={() => setIsCheckoutOpen(false)}
                >
                  Return to menu
                </Link>
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
                    <p className="eyebrow">ASAP pickup · Pay at pickup</p>
                    <h2 id="checkout-title">Checkout</h2>
                    <p>
                      Review your pickup order and add the contact details the
                      team will use to identify it.
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
                          <p>
                            ASAP · Estimated preparation {serviceStatus.prepTimeLabel}
                          </p>
                        </div>
                      </div>
                      <div className="checkout-location-card">
                        <strong>{serviceStatus.locationName}</strong>
                        <span>
                          {serviceStatus.address} · Fixed pickup location
                        </span>
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
                          <h3 id="payment-heading">Payment at pickup</h3>
                          <p>Online payment will be added after Square is connected.</p>
                        </div>
                      </div>
                      <div className="payment-placeholder">
                        <div>
                          <strong>Pay when you collect</strong>
                          <span>No card or wallet details are required online.</span>
                        </div>
                        <div className="wallet-labels" aria-label="Future payment provider">
                          <span>Square coming later</span>
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
                      Tell the kitchen team about allergies before ordering.
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
                      disabled={
                        checkoutState === "submitting" ||
                        !serviceStatus.acceptingOrders
                      }
                    >
                      {!serviceStatus.acceptingOrders
                        ? "Ordering unavailable"
                        : checkoutState === "submitting"
                          ? "Sending order…"
                          : "Place pickup order"}
                    </button>
                    <small>
                      No online payment is required. You&apos;ll pay at pickup.
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
