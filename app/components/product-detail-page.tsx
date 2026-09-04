"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Minus,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { useMemo, useState } from "react";
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
  const [modifierQuantities, setModifierQuantities] = useState<Record<string, number>>({});
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [boxBurgers, setBoxBurgers] = useState<string[]>([]);
  const [boxDrinks, setBoxDrinks] = useState<string[]>([]);
  const [selectionError, setSelectionError] = useState("");
  const [addedToCart, setAddedToCart] = useState(false);

  const availableModifiers = modifierChoices.filter((modifier) =>
    item.modifierIds?.includes(modifier.id),
  );
  const drinks = item.isKidsItem ? kidsDrinkChoices : adultDrinkChoices;
  const burgerChoices = menuItems.filter((entry) => entry.category === "burgers");

  const unitPrice = useMemo(() => {
    const extras = availableModifiers.reduce(
      (total, modifier) => total + modifier.price * (modifierQuantities[modifier.id] ?? 0),
      0,
    );
    return item.price + extras + (isCombo ? comboUpgradePrice : 0);
  }, [availableModifiers, isCombo, item.price, modifierQuantities]);

  const totalPrice = unitPrice * quantity;

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

  function addToCart() {
    if (isCombo && !drink) {
      setSelectionError("Choose a drink for your meal before adding it to the cart.");
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
        <Link className="product-back-link" href={`/menu/${item.category}`}>
          <ArrowLeft size={17} aria-hidden="true" />
          Back to {category?.label ?? "menu"}
        </Link>

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
              </div>
              <p className="product-detail__price">
                {money.format(item.price)}
                {item.priceConfirmed === false && <small>Provisional</small>}
              </p>
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
                  <div><span>01</span><h2>Make it a meal</h2></div>
                  <strong>+{money.format(comboUpgradePrice)}</strong>
                </div>
                <button
                  className={`product-choice-card${isCombo ? " is-selected" : ""}`}
                  type="button"
                  onClick={() => {
                    setIsCombo((current) => !current);
                    if (isCombo) setDrink("");
                    setAddedToCart(false);
                  }}
                >
                  <span className="product-choice-card__check"><Check size={16} /></span>
                  <span><strong>Add Nasty Fries + drink</strong><small>Turn this item into a full meal.</small></span>
                </button>

                {isCombo && (
                  <div className="product-select-grid" aria-label="Choose a drink">
                    {drinks.map((choice) => (
                      <button
                        className={drink === choice ? "is-selected" : ""}
                        type="button"
                        key={choice}
                        onClick={() => { setDrink(choice); setSelectionError(""); setAddedToCart(false); }}
                      >
                        {choice}
                        {drink === choice && <Check size={15} aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
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

            {availableModifiers.length > 0 && (
              <section className="product-custom-section">
                <div className="product-custom-section__heading">
                  <div><span>{item.canUpgrade ? "02" : "01"}</span><h2>Add extras</h2></div>
                </div>
                <div className="product-stepper-list">
                  {availableModifiers.map((modifier) => (
                    <div className="product-stepper-row" key={modifier.id}>
                      <span><strong>{modifier.name}</strong><small>+{money.format(modifier.price)}</small></span>
                      <div className="product-stepper">
                        <button type="button" onClick={() => changeModifier(modifier.id, -1)} disabled={(modifierQuantities[modifier.id] ?? 0) === 0} aria-label={`Remove ${modifier.name}`}><Minus size={15} /></button>
                        <strong>{modifierQuantities[modifier.id] ?? 0}</strong>
                        <button type="button" onClick={() => changeModifier(modifier.id, 1)} aria-label={`Add ${modifier.name}`}><Plus size={15} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {item.removableIngredients && item.removableIngredients.length > 0 && (
              <section className="product-custom-section">
                <div className="product-custom-section__heading">
                  <div><span>{item.canUpgrade ? "03" : "02"}</span><h2>Make it yours</h2></div>
                </div>
                <p className="product-custom-help">Tap an ingredient to remove it.</p>
                <div className="product-remove-grid">
                  {item.removableIngredients.map((ingredient) => {
                    const removed = removedIngredients.includes(ingredient);
                    return (
                      <button
                        className={removed ? "is-removed" : ""}
                        type="button"
                        key={ingredient}
                        onClick={() => toggleIngredient(ingredient)}
                      >
                        <span>{removed ? "Removed" : "Included"}</span>
                        <strong>{ingredient}</strong>
                      </button>
                    );
                  })}
                </div>
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
