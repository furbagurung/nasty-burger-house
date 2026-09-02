"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  adultDrinkChoices,
  kidsDrinkChoices,
  menuCategories,
  modifierChoices,
  type MenuItem,
} from "../data/menu";

type CartLine = {
  lineId: string;
  itemId: string;
  quantity: number;
  combo: boolean;
  drink?: string;
  modifiers: string[];
};

type OrderExperienceProps = {
  items: MenuItem[];
};

const CART_STORAGE_KEY = "nasty-burger-phase-one-cart";
const LOYALTY_STORAGE_KEY = "nasty-burger-drip-signup";

function formatPrice(price: number | null) {
  return price === null ? "Price pending" : `$${price.toFixed(2)}`;
}

export default function OrderExperience({ items }: OrderExperienceProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [isCombo, setIsCombo] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false);
  const [loyaltyComplete, setLoyaltyComplete] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const visibleItems = useMemo(() => {
    if (activeCategory === "all") return items;
    if (activeCategory === "featured") {
      return items.filter((item) => item.featured);
    }
    return items.filter((item) => item.category === activeCategory);
  }, [activeCategory, items]);

  const cartCount = cart.reduce(
    (total, line) => total + line.quantity,
    0,
  );

  useEffect(() => {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    let parsedCart: CartLine[] = [];

    if (storedCart) {
      try {
        parsedCart = JSON.parse(storedCart) as CartLine[];
      } catch {
        window.localStorage.removeItem(CART_STORAGE_KEY);
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
    const overlayOpen = Boolean(selectedItem) || isCartOpen || isLoyaltyOpen;
    document.body.style.overflow = overlayOpen ? "hidden" : "";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setSelectedItem(null);
      setIsCartOpen(false);
      setIsLoyaltyOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isCartOpen, isLoyaltyOpen, selectedItem]);

  function openItem(item: MenuItem) {
    setSelectedItem(item);
    setSelectedModifiers([]);
    setIsCombo(false);
    setSelectedDrink("");
  }

  function toggleModifier(modifier: string) {
    setSelectedModifiers((current) =>
      current.includes(modifier)
        ? current.filter((value) => value !== modifier)
        : [...current, modifier],
    );
  }

  function addSelectedItem() {
    if (!selectedItem) return;
    if (isCombo && !selectedDrink) {
      setAnnouncement("Choose a drink before adding this combo.");
      return;
    }

    const line: CartLine = {
      lineId:
        selectedItem.id + "-" + Date.now().toString(36) + "-" + cart.length,
      itemId: selectedItem.id,
      quantity: 1,
      combo: isCombo,
      drink: isCombo ? selectedDrink : undefined,
      modifiers: selectedModifiers,
    };

    setCart((current) => [...current, line]);
    setAnnouncement(selectedItem.name + " added to your order.");
    setSelectedItem(null);
    setIsCartOpen(true);
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

  function submitLoyalty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.localStorage.setItem(LOYALTY_STORAGE_KEY, "complete");
    setLoyaltyComplete(true);
    setAnnouncement("Drip Points signup saved for this functional draft.");
  }

  const drinksForSelectedItem = selectedItem?.isKidsItem
    ? kidsDrinkChoices
    : adultDrinkChoices;

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
          <span>NASTY</span>
          <small>BURGER HOUSE</small>
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#menu">Menu</a>
          <a href="#beast-month">Beast of the Month</a>
          <a href="#location">Find Us</a>
        </nav>
        <div className="header-actions">
          <button
            className="text-button"
            type="button"
            onClick={() => setIsLoyaltyOpen(true)}
          >
            {loyaltyComplete ? "Drip Points joined" : "Join Drip Points"}
          </button>
          <button
            className="cart-button"
            type="button"
            onClick={() => setIsCartOpen(true)}
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
              Start with the menu, customise your item, choose a drink when you
              upgrade, and keep browsing without leaving the page.
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
              Phase 1 functional draft. Product copy, pricing and operating
              details remain subject to client approval.
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
            <h2>Beast of the Month</h2>
            <p>
              BBQ Beast is temporary draft content until the first feature is confirmed.
            </p>
            <button
              type="button"
              onClick={() =>
                openItem(
                  items.find((item) => item.id === "bbq-beast") ?? items[0],
                )
              }
            >
              View feature
            </button>
          </article>
          <article className="promo-card">
            <p className="eyebrow">Built for sharing</p>
            <h2>Beast Boxes</h2>
            <p>
              Box sizes, inclusions and upgrade rules will plug into the same order flow.
            </p>
            <button type="button" onClick={() => setActiveCategory("beast-boxes")}>
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
              Dietary filters will be activated only after Halal, gluten-free
              and allergen information is verified by the client.
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
                  <p>{item.description}</p>
                  <div className="menu-card__action">
                    <strong>{formatPrice(item.price)}</strong>
                    <button type="button" onClick={() => openItem(item)}>
                      {item.canUpgrade ? "Customise" : "Add"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
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
        <div>
          <strong>Nasty Burger House</strong>
          <p>Function-first ordering website by Brahmanda Tech.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="#menu">Menu</a>
          <a href="#location">Find Us</a>
          <button type="button" onClick={() => setIsLoyaltyOpen(true)}>
            Drip Points
          </button>
        </nav>
      </footer>

      <div className="mobile-order-bar" aria-label="Mobile ordering actions">
        <a href="#location">Find Us</a>
        <button type="button" onClick={() => setIsCartOpen(true)}>
          Order Now <span>{cartCount}</span>
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
              onClick={() => setSelectedItem(null)}
              aria-label="Close product customisation"
            >
              ×
            </button>
            <p className="eyebrow">Customise your item</p>
            <h2 id="product-modal-title">{selectedItem.name}</h2>
            <p>{selectedItem.description}</p>
            <p className="pending-price">{formatPrice(selectedItem.price)}</p>

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
                    }}
                  />
                  <span>
                    Make it a combo
                    <small>Final inclusions and upgrade price pending.</small>
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
                      onClick={() => setSelectedDrink(drink)}
                      aria-pressed={selectedDrink === drink}
                    >
                      {drink}
                    </button>
                  ))}
                </div>
                {selectedItem.isKidsItem && (
                  <small className="field-note">
                    Water is the temporary option until the kids&apos; drink list is confirmed.
                  </small>
                )}
              </fieldset>
            )}

            {selectedItem.category !== "drinks" && (
              <fieldset>
                <legend>One-tap extras</legend>
                <div className="choice-grid">
                  {modifierChoices.map((modifier) => (
                    <button
                      key={modifier}
                      type="button"
                      className={
                        selectedModifiers.includes(modifier) ? "is-selected" : ""
                      }
                      onClick={() => toggleModifier(modifier)}
                      aria-pressed={selectedModifiers.includes(modifier)}
                    >
                      {modifier}
                    </button>
                  ))}
                </div>
                <small className="field-note">Modifier prices are pending approval.</small>
              </fieldset>
            )}

            <button
              className="primary-button full-width"
              type="button"
              onClick={addSelectedItem}
            >
              Add to order
            </button>
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

                  return (
                    <article className="cart-line" key={line.lineId}>
                      <div>
                        <h3>{item.name}</h3>
                        {line.combo && <p>Combo · {line.drink}</p>}
                        {line.modifiers.length > 0 && (
                          <p>{line.modifiers.join(" · ")}</p>
                        )}
                        <strong>{formatPrice(item.price)}</strong>
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

                {!cart.some((line) => line.itemId === "beast-box") && (
                  <button
                    className="cart-upsell"
                    type="button"
                    onClick={() => {
                      setIsCartOpen(false);
                      setActiveCategory("beast-boxes");
                      document.getElementById("menu")?.scrollIntoView();
                    }}
                  >
                    <span>Ordering for a crew?</span>
                    Browse Beast Boxes
                  </button>
                )}

                <div className="checkout-summary">
                  <p>
                    Final totals and payment will activate when approved pricing
                    and the payment provider are connected.
                  </p>
                  <button type="button" disabled>
                    Checkout integration pending
                  </button>
                </div>
              </div>
            )}
          </aside>
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
              onClick={() => setIsLoyaltyOpen(false)}
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
                <strong>Signup saved on this device.</strong>
                <p>The production version will connect this form to the loyalty system.</p>
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
