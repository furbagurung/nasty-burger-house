"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Check,
  Minus,
  Plus,
  ShoppingBag,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  adultDrinkChoices,
  comboUpgradePrice,
  kidsDrinkChoices,
  menuItems,
  modifierChoices,
  type MenuItem,
} from "../data/menu";
import { findMenuPageCategory } from "../data/menu-pages";
import type { CartLine } from "../lib/order";
import CatalogueMobileMenu from "./catalogue-mobile-menu";
import MenuItemMedia from "./menu-item-media";
import MobileBottomNav from "./mobile-bottom-nav";

type ProductDetailPageProps = {
  item: MenuItem;
};

const CART_STORAGE_KEY = "nasty-burger-cart-v2";

const money = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const modifierThumbnails: Record<string, string> = {
  "chicken-patty": "/images/extras/chicken-patty.webp",
  bacon: "/images/extras/bacon.webp",
  cheese: "/images/extras/american-cheese.webp",
  "house-sauce": "/images/extras/sauce.webp",
};

const ingredientThumbnails: Record<string, string> = {
  "American cheese": "/images/extras/american-cheese.webp",
  "Crispy bacon": "/images/extras/bacon.webp",
  "Cabbage slaw": "/images/extras/cabbage-slaw.webp",
  "Creamy mayo": "/images/extras/mayo.webp",
  "Jalapeño mint mayo": "/images/extras/mayo.webp",
  "Garlic aioli": "/images/extras/mayo.webp",
  "Tartare sauce": "/images/extras/mayo.webp",
  "NBH Signature Sauce": "/images/extras/sauce.webp",
  "Bourbon BBQ sauce": "/images/extras/sauce.webp",
  "Buffalo Fury sauce": "/images/extras/sauce.webp",
  "Blue cheese sauce": "/images/extras/sauce.webp",
  "Tomato sauce": "/images/extras/sauce.webp",
};

function modifierThumbnail(id: string, item: MenuItem) {
  return modifierThumbnails[id] ?? item.image ?? "/images/extras/sauce.webp";
}

function ingredientThumbnail(ingredient: string, item: MenuItem) {
  return ingredientThumbnails[ingredient] ?? item.image ?? "/images/extras/sauce.webp";
}

function drinkThumbnail(choice: string) {
  return (
    menuItems.find(
      (entry) => entry.category === "drinks" && entry.name === choice,
    )?.image ?? "/images/menu/coke.webp"
  );
}

function readStoredCart(): CartLine[] {
  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

export default function ProductDetailPage({ item }: ProductDetailPageProps) {
  const category = findMenuPageCategory(item.category);
  const [quantity, setQuantity] = useState(1);
  const [isCombo, setIsCombo] = useState(false);
  const [drink, setDrink] = useState("");
  const [isDrinkDrawerOpen, setIsDrinkDrawerOpen] = useState(false);
  const [isExtrasDrawerOpen, setIsExtrasDrawerOpen] = useState(false);
  const [modifierQuantities, setModifierQuantities] = useState<Record<string, number>>({});
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [boxBurgers, setBoxBurgers] = useState<string[]>([]);
  const [boxDrinks, setBoxDrinks] = useState<string[]>([]);
  const [selectionError, setSelectionError] = useState("");
  const [addedToCart, setAddedToCart] = useState(false);

  const availableModifiers = modifierChoices.filter((modifier) =>
    item.modifierIds?.includes(modifier.id),
  );
  const removableIngredients = item.removableIngredients ?? [];
  const drinks = item.isKidsItem ? kidsDrinkChoices : adultDrinkChoices;
  const burgerChoices = menuItems.filter((entry) => entry.category === "burgers");

  useEffect(() => {
    if (!isDrinkDrawerOpen && !isExtrasDrawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDrinkDrawerOpen(false);
        setIsExtrasDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isDrinkDrawerOpen, isExtrasDrawerOpen]);

  const unitPrice = useMemo(() => {
    const extras = availableModifiers.reduce(
      (total, modifier) => total + modifier.price * (modifierQuantities[modifier.id] ?? 0),
      0,
    );
    return item.price + extras + (isCombo ? comboUpgradePrice : 0);
  }, [availableModifiers, isCombo, item.price, modifierQuantities]);

  const totalPrice = unitPrice * quantity;
  const selectedExtrasCount = availableModifiers.reduce(
    (total, modifier) => total + (modifierQuantities[modifier.id] ?? 0),
    0,
  );
  const selectedExtrasPrice = availableModifiers.reduce(
    (total, modifier) => total + modifier.price * (modifierQuantities[modifier.id] ?? 0),
    0,
  );
  const removedIngredientsCount = removedIngredients.length;
  const hasDrawerOptions = availableModifiers.length > 0 || removableIngredients.length > 0;

  function changeModifier(id: string, amount: number) {
    setModifierQuantities((current) => ({
      ...current,
      [id]: Math.max(0, Math.min(10, (current[id] ?? 0) + amount)),
    }));
    setAddedToCart(false);
  }

  function toggleIngredient(ingredient: string) {
    setRemovedIngredients((current) =>
      current.includes(ingredient)
        ? current.filter((entry) => entry !== ingredient)
        : [...current, ingredient],
    );
    setAddedToCart(false);
  }

  function changeBoxSelection(type: "burger" | "drink", value: string, amount: number) {
    if (!item.boxConfig) return;
    const source = type === "burger" ? boxBurgers : boxDrinks;
    const maximum = type === "burger" ? item.boxConfig.burgerCount : item.boxConfig.drinkCount;
    const next = [...source];

    if (amount > 0 && next.length < maximum) next.push(value);
    if (amount < 0) {
      const index = next.lastIndexOf(value);
      if (index >= 0) next.splice(index, 1);
    }

    if (type === "burger") setBoxBurgers(next);
    else setBoxDrinks(next);
    setSelectionError("");
    setAddedToCart(false);
  }

  function countSelection(values: string[], value: string) {
    return values.filter((entry) => entry === value).length;
  }

  function toggleCombo() {
    if (isCombo) {
      setIsCombo(false);
      setDrink("");
      setIsDrinkDrawerOpen(false);
    } else {
      setIsCombo(true);
      setIsExtrasDrawerOpen(false);
      setIsDrinkDrawerOpen(true);
    }
    setSelectionError("");
    setAddedToCart(false);
  }

  function chooseDrink(choice: string) {
    setDrink(choice);
    setSelectionError("");
    setAddedToCart(false);
    setIsDrinkDrawerOpen(false);
  }

  function openExtrasDrawer() {
    setIsDrinkDrawerOpen(false);
    setIsExtrasDrawerOpen(true);
  }

  function addToCart() {
    if (isCombo && !drink) {
      setSelectionError("Choose a drink for your Beast Combo before adding it to the cart.");
      setIsExtrasDrawerOpen(false);
      setIsDrinkDrawerOpen(true);
      return;
    }

    if (item.boxConfig && boxBurgers.length !== item.boxConfig.burgerCount) {
      setSelectionError(`Choose ${item.boxConfig.burgerCount} burger${item.boxConfig.burgerCount === 1 ? "" : "s"} for this Beast Box.`);
      return;
    }

    if (item.boxConfig && boxDrinks.length !== item.boxConfig.drinkCount) {
      setSelectionError(`Choose ${item.boxConfig.drinkCount} drink${item.boxConfig.drinkCount === 1 ? "" : "s"} for this Beast Box.`);
      return;
    }

    const line: CartLine = {
      lineId: crypto.randomUUID(),
      itemId: item.id,
      quantity,
      combo: isCombo,
      drink: isCombo ? drink : undefined,
      modifiers: Object.entries(modifierQuantities)
        .filter(([, selectedQuantity]) => selectedQuantity > 0)
        .map(([id, selectedQuantity]) => ({ id, quantity: selectedQuantity })),
      removedIngredients,
      boxBurgers,
      boxDrinks,
    };

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([...readStoredCart(), line]));
    setSelectionError("");
    setAddedToCart(true);
  }

  return (
    <div className="catalogue-shell product-page-shell product-page-premium">
      <header className="catalogue-header product-page-header">
        <CatalogueMobileMenu />
        <Link className="catalogue-logo" href="/" aria-label="Nasty Burger House home">
          <Image src="/logo.webp" alt="" width={256} height={256} priority />
        </Link>

        <nav className="catalogue-desktop-nav" aria-label="Primary navigation">
          <Link href="/">Home</Link>
          <Link className="is-active" href="/menu/burgers">Menu</Link>
          <Link href="/#beast-month">What&apos;s New</Link>
          <Link href="/?loyalty=1">Drip Points</Link>
        </nav>

        <div className="catalogue-header-actions">
          <Link className="product-cart-link" href="/?cart=1">
            <ShoppingBag size={18} strokeWidth={1.8} aria-hidden="true" />
            Cart
          </Link>
        </div>
      </header>

      <main className="product-detail product-detail--premium">
        <nav className="product-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/menu/burgers">Menu</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/menu/${item.category}`}>{category?.label ?? "Menu"}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{item.name}</span>
        </nav>

        <div className="product-detail__layout product-detail__layout--premium">
          <section className="product-detail__visual" aria-label={`${item.name} image`}>
            <div className="product-detail__media product-detail__media--premium">
              <MenuItemMedia item={item} sizes="(max-width: 900px) 100vw, 54vw" priority />
            </div>
            <div className="product-detail__visual-note">
              <span>{category?.label ?? "Nasty Burger House"}</span>
              <strong>Made nasty. Served fresh.</strong>
            </div>
          </section>

          <section className="product-detail__content product-detail__content--premium" aria-labelledby="product-title">
            <div className="product-detail__heading-row">
              <div>
                <p className="eyebrow">{category?.label ?? "Nasty Burger House menu"}</p>
                <h1 id="product-title">{item.name}</h1>
                <p className="product-detail__price">
                  {money.format(item.price)}
                  {item.priceConfirmed === false && <small>Provisional</small>}
                </p>
              </div>
            </div>

            <p className="product-detail__description">{item.description}</p>

            {item.dietaryTags && item.dietaryTags.length > 0 && (
              <div className="product-detail__tags" aria-label="Dietary information">
                {item.dietaryTags.map((tag) => (
                  <span key={tag}><Check size={14} aria-hidden="true" />{tag}</span>
                ))}
              </div>
            )}

            {item.canUpgrade && (
              <section className="product-custom-section">
                <div className="product-custom-section__heading">
                  <div><span>01</span><h2>Make it the Beast Combo</h2></div>
                  <strong>+{money.format(comboUpgradePrice)}</strong>
                </div>
                <button
                  className={`product-choice-card${isCombo ? " is-selected" : ""}`}
                  type="button"
                  onClick={toggleCombo}
                >
                  <span className="product-choice-card__bag" aria-hidden="true">
                    <ShoppingBag className="product-choice-card__bag-fallback" size={19} strokeWidth={1.8} />
                    <Image
                      src="/images/bag.webp"
                      alt=""
                      width={48}
                      height={48}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  </span>
                  <span><strong>Add Nasty Fries + drink</strong><small>Turn this item into a Beast Combo.</small></span>
                </button>

                {isCombo && (
                  <button
                    className={`product-combo-drink-trigger${drink ? " has-selection" : ""}`}
                    type="button"
                    onClick={() => {
                      setIsExtrasDrawerOpen(false);
                      setIsDrinkDrawerOpen(true);
                    }}
                  >
                    <span className="product-combo-drink-trigger__thumb" aria-hidden="true">
                      {drink ? (
                        <Image src={drinkThumbnail(drink)} alt="" width={52} height={52} />
                      ) : (
                        <ShoppingBag size={20} strokeWidth={1.7} />
                      )}
                    </span>
                    <span className="product-combo-drink-trigger__copy">
                      <small>Beast Combo drink</small>
                      <strong>{drink || "Choose your drink"}</strong>
                    </span>
                    <span className="product-combo-drink-trigger__action">
                      {drink ? "Change" : "Choose"} →
                    </span>
                  </button>
                )}
              </section>
            )}

            {item.boxConfig && (
              <section className="product-custom-section">
                <div className="product-custom-section__heading">
                  <div><span>01</span><h2>Build your Beast Box</h2></div>
                </div>

                <p className="product-custom-help">Choose {item.boxConfig.burgerCount} burger{item.boxConfig.burgerCount === 1 ? "" : "s"}.</p>
                <div className="product-stepper-list">
                  {burgerChoices.map((burger) => {
                    const selected = countSelection(boxBurgers, burger.id);
                    return (
                      <div className="product-stepper-row" key={burger.id}>
                        <span><strong>{burger.name}</strong><small>{money.format(burger.price)}</small></span>
                        <div className="product-stepper">
                          <button type="button" onClick={() => changeBoxSelection("burger", burger.id, -1)} disabled={selected === 0} aria-label={`Remove ${burger.name}`}><Minus size={15} /></button>
                          <strong>{selected}</strong>
                          <button type="button" onClick={() => changeBoxSelection("burger", burger.id, 1)} disabled={boxBurgers.length >= item.boxConfig!.burgerCount} aria-label={`Add ${burger.name}`}><Plus size={15} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="product-custom-help">Choose {item.boxConfig.drinkCount} drink{item.boxConfig.drinkCount === 1 ? "" : "s"}.</p>
                <div className="product-stepper-list">
                  {adultDrinkChoices.map((choice) => {
                    const selected = countSelection(boxDrinks, choice);
                    return (
                      <div className="product-stepper-row" key={choice}>
                        <span><strong>{choice}</strong></span>
                        <div className="product-stepper">
                          <button type="button" onClick={() => changeBoxSelection("drink", choice, -1)} disabled={selected === 0} aria-label={`Remove ${choice}`}><Minus size={15} /></button>
                          <strong>{selected}</strong>
                          <button type="button" onClick={() => changeBoxSelection("drink", choice, 1)} disabled={boxDrinks.length >= item.boxConfig!.drinkCount} aria-label={`Add ${choice}`}><Plus size={15} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {hasDrawerOptions && (
              <section className="product-custom-section product-custom-section--extras">
                <button
                  className="product-extras-trigger"
                  type="button"
                  onClick={openExtrasDrawer}
                >
                  Add more
                </button>
              </section>
            )}

            <div className="product-purchase-panel">
              <div className="product-quantity" aria-label="Quantity selector">
                <button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} disabled={quantity === 1} aria-label="Decrease quantity"><Minus size={17} /></button>
                <strong>{quantity}</strong>
                <button type="button" onClick={() => setQuantity((current) => Math.min(20, current + 1))} disabled={quantity === 20} aria-label="Increase quantity"><Plus size={17} /></button>
              </div>

              <button className={`product-add-button${addedToCart ? " is-added" : ""}`} type="button" onClick={addToCart}>
                {addedToCart ? <Check size={19} /> : <ShoppingBag size={19} />}
                <span>{addedToCart ? "Added to cart" : "Add to cart"}</span>
                <strong>{money.format(totalPrice)}</strong>
              </button>
            </div>

            {selectionError && <p className="product-selection-error" role="alert">{selectionError}</p>}

            {addedToCart && (
              <div className="product-added-actions">
                <span><Check size={16} /> Your item is in the cart.</span>
                <Link href="/?cart=1">View cart</Link>
              </div>
            )}

            <p className="product-detail__notice">Pickup ordering. Final availability and preparation details are confirmed with your order.</p>
          </section>
        </div>
      </main>

      {isDrinkDrawerOpen && (
        <div
          className="product-drink-drawer-backdrop"
          role="presentation"
          onMouseDown={() => setIsDrinkDrawerOpen(false)}
        >
          <aside
            className="product-drink-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-drink-drawer-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="product-drink-drawer__header">
              <div>
                <p>Beast Combo</p>
                <h2 id="product-drink-drawer-title">Choose your drink</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsDrinkDrawerOpen(false)}
                aria-label="Close drink selection"
              >
                <X size={22} />
              </button>
            </div>

            <div className="product-drink-drawer__options">
              {drinks.map((choice) => {
                const selected = drink === choice;
                return (
                  <button
                    className={`product-drink-drawer__option${selected ? " is-selected" : ""}`}
                    type="button"
                    key={choice}
                    onClick={() => chooseDrink(choice)}
                    aria-pressed={selected}
                  >
                    <span className="product-drink-drawer__thumb" aria-hidden="true">
                      <Image
                        src={drinkThumbnail(choice)}
                        alt=""
                        width={68}
                        height={68}
                      />
                    </span>
                    <span className="product-drink-drawer__copy">
                      <strong>{choice}</strong>
                      <small>Included with Beast Combo</small>
                    </span>
                    {selected && <Check size={19} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      )}

      {isExtrasDrawerOpen && (
        <div
          className="product-drink-drawer-backdrop"
          role="presentation"
          onMouseDown={() => setIsExtrasDrawerOpen(false)}
        >
          <aside
            className="product-drink-drawer product-extras-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-extras-drawer-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="product-drink-drawer__header">
              <div>
                <p>Customise</p>
                <h2 id="product-extras-drawer-title">Customise your item</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsExtrasDrawerOpen(false)}
                aria-label="Close customisation drawer"
              >
                <X size={22} />
              </button>
            </div>

            <div className="product-drink-drawer__options product-extras-drawer__options">
              {availableModifiers.length > 0 && (
                <section className="product-drawer-group" aria-labelledby="product-extra-group-title">
                  <div className="product-drawer-group__heading">
                    <h3 id="product-extra-group-title">Add extras</h3>
                    <p>Add more of your favourites.</p>
                  </div>
                  <div className="product-drawer-group__list">
                    {availableModifiers.map((modifier) => {
                      const selectedQuantity = modifierQuantities[modifier.id] ?? 0;
                      return (
                        <div
                          className={`product-extra-drawer__option${selectedQuantity > 0 ? " is-selected" : ""}`}
                          key={modifier.id}
                        >
                          <span className="product-drink-drawer__thumb" aria-hidden="true">
                            <Image
                              src={modifierThumbnail(modifier.id, item)}
                              alt=""
                              width={68}
                              height={68}
                            />
                          </span>
                          <span className="product-drink-drawer__copy">
                            <strong>{modifier.name}</strong>
                            <small>+{money.format(modifier.price)} each</small>
                          </span>
                          <div className="product-stepper product-extra-drawer__stepper">
                            <button
                              type="button"
                              onClick={() => changeModifier(modifier.id, -1)}
                              disabled={selectedQuantity === 0}
                              aria-label={`Remove ${modifier.name}`}
                            >
                              <Minus size={15} />
                            </button>
                            <strong>{selectedQuantity}</strong>
                            <button
                              type="button"
                              onClick={() => changeModifier(modifier.id, 1)}
                              aria-label={`Add ${modifier.name}`}
                            >
                              <Plus size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {removableIngredients.length > 0 && (
                <section className="product-drawer-group product-drawer-group--ingredients" aria-labelledby="product-ingredients-group-title">
                  <div className="product-drawer-group__heading">
                    <h3 id="product-ingredients-group-title">Add it on</h3>
                    <p>Uncheck an ingredient to remove it.</p>
                  </div>
                  <div className="product-drawer-group__list">
                    {removableIngredients.map((ingredient) => {
                      const removed = removedIngredients.includes(ingredient);
                      return (
                        <label
                          className={`product-ingredient-drawer__option${removed ? " is-removed" : ""}`}
                          key={ingredient}
                        >
                          <span className="product-drink-drawer__thumb" aria-hidden="true">
                            <Image
                              src={ingredientThumbnail(ingredient, item)}
                              alt=""
                              width={68}
                              height={68}
                            />
                          </span>
                          <span className="product-drink-drawer__copy">
                            <strong>{ingredient}</strong>
                          </span>
                          <input
                            className="product-ingredient-drawer__checkbox"
                            type="checkbox"
                            checked={!removed}
                            onChange={() => toggleIngredient(ingredient)}
                            aria-label={`Include ${ingredient}`}
                          />
                        </label>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            <div className="product-extras-drawer__footer">
              <span>
                <small>
                  {selectedExtrasCount} extra{selectedExtrasCount === 1 ? "" : "s"}
                  {removedIngredientsCount > 0 ? ` · ${removedIngredientsCount} removed` : ""}
                </small>
                <strong>+{money.format(selectedExtrasPrice)}</strong>
              </span>
              <button type="button" onClick={() => setIsExtrasDrawerOpen(false)}>
                Done
              </button>
            </div>
          </aside>
        </div>
      )}

      <footer className="catalogue-footer product-detail__footer">
        <div>
          <Image src="/logo.webp" alt="Nasty Burger House" width={256} height={256} />
          <p>Big flavour. Zero apologies.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/">Home</Link>
          <Link href={`/menu/${item.category}`}>Back to {category?.label ?? "menu"}</Link>
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/terms-and-conditions">Terms &amp; Conditions</Link>
        </nav>
      </footer>

      <MobileBottomNav active="menu" />
    </div>
  );
}
