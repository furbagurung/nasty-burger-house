"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { menuItems, modifierChoices } from "../data/menu";
import {
  calculateCartSubtotal,
  calculateLineUnitPrice,
  type CartLine,
} from "../lib/order";
import MobileBottomNav from "./mobile-bottom-nav";

const CART_STORAGE_KEY = "nasty-burger-cart-v2";

const money = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

function normaliseCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const line = entry as Partial<CartLine>;
    if (
      typeof line.lineId !== "string" ||
      typeof line.itemId !== "string" ||
      typeof line.quantity !== "number"
    ) {
      return [];
    }

    return [
      {
        lineId: line.lineId,
        itemId: line.itemId,
        quantity: Math.max(1, Math.min(20, Math.floor(line.quantity))),
        combo: Boolean(line.combo),
        drink: typeof line.drink === "string" ? line.drink : undefined,
        modifiers: Array.isArray(line.modifiers)
          ? line.modifiers.filter(
              (selection): selection is CartLine["modifiers"][number] =>
                Boolean(selection) &&
                typeof selection === "object" &&
                typeof selection.id === "string" &&
                typeof selection.quantity === "number",
            )
          : [],
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

function lineDetails(line: CartLine) {
  const details: string[] = [];

  if (line.combo) {
    details.push(`Beast Combo${line.drink ? ` · ${line.drink}` : ""}`);
  }

  if (line.modifiers.length > 0) {
    details.push(
      line.modifiers
        .map((selection) => {
          const modifier = modifierChoices.find((entry) => entry.id === selection.id);
          return `${selection.quantity}× ${modifier?.name ?? selection.id}`;
        })
        .join(", "),
    );
  }

  if (line.removedIngredients.length > 0) {
    details.push(`Without ${line.removedIngredients.join(", ")}`);
  }

  if (line.boxBurgers.length > 0) {
    details.push(
      `Burgers: ${line.boxBurgers
        .map((id) => menuItems.find((entry) => entry.id === id)?.name ?? id)
        .join(", ")}`,
    );
  }

  if (line.boxDrinks.length > 0) {
    details.push(`Drinks: ${line.boxDrinks.join(", ")}`);
  }

  return details;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CART_STORAGE_KEY);
      setCart(stored ? normaliseCart(JSON.parse(stored)) : []);
    } catch {
      setCart([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("nasty-cart-updated"));
  }, [cart, hydrated]);

  const subtotal = useMemo(() => calculateCartSubtotal(cart), [cart]);
  const cartCount = cart.reduce((total, line) => total + line.quantity, 0);

  const changeQuantity = (lineId: string, amount: number) => {
    setCart((current) =>
      current.map((line) =>
        line.lineId === lineId
          ? {
              ...line,
              quantity: Math.max(1, Math.min(20, line.quantity + amount)),
            }
          : line,
      ),
    );
  };

  const removeLine = (lineId: string) => {
    setCart((current) => current.filter((line) => line.lineId !== lineId));
  };

  return (
    <div className="standalone-page standalone-cart-page">
      <main className="standalone-main cart-page-main">
        <div className="standalone-page-heading cart-page-heading">
          <p className="standalone-eyebrow">Your pickup order</p>
          <div>
            <h1>Cart</h1>
            <span>{cartCount} item{cartCount === 1 ? "" : "s"}</span>
          </div>
          <p>Review your Nasty Burger House order before checkout.</p>
        </div>

        {!hydrated ? (
          <div className="cart-page-loading">Loading your cart…</div>
        ) : cart.length === 0 ? (
          <section className="cart-empty-state">
            <Image src="/images/bag.webp" alt="" width={140} height={140} />
            <p className="standalone-eyebrow">Nothing nasty yet</p>
            <h2>Your cart is empty.</h2>
            <p>Pick a Beast Burger, Beast Box, side or drink to get started.</p>
            <Link href="/menu/burgers">Explore the menu</Link>
          </section>
        ) : (
          <div className="cart-page-layout">
            <section className="cart-page-lines" aria-label="Cart items">
              {cart.map((line) => {
                const item = menuItems.find((entry) => entry.id === line.itemId);
                if (!item) return null;
                const details = lineDetails(line);
                const lineTotal = calculateLineUnitPrice(line, item) * line.quantity;

                return (
                  <article className="cart-page-line" key={line.lineId}>
                    <Link className="cart-page-line__media" href={`/product/${item.id}`}>
                      <Image
                        src={item.image ?? "/logo.webp"}
                        alt={item.name}
                        width={180}
                        height={180}
                      />
                    </Link>

                    <div className="cart-page-line__copy">
                      <div className="cart-page-line__title">
                        <div>
                          <Link href={`/product/${item.id}`}>{item.name}</Link>
                          <span>{money.format(calculateLineUnitPrice(line, item))} each</span>
                        </div>
                        <strong>{money.format(lineTotal)}</strong>
                      </div>

                      {details.length > 0 && (
                        <div className="cart-page-line__details">
                          {details.map((detail) => (
                            <span key={detail}>{detail}</span>
                          ))}
                        </div>
                      )}

                      <div className="cart-page-line__actions">
                        <div className="cart-page-quantity" aria-label={`Quantity for ${item.name}`}>
                          <button
                            type="button"
                            onClick={() => changeQuantity(line.lineId, -1)}
                            disabled={line.quantity === 1}
                            aria-label={`Decrease ${item.name} quantity`}
                          >
                            −
                          </button>
                          <strong>{line.quantity}</strong>
                          <button
                            type="button"
                            onClick={() => changeQuantity(line.lineId, 1)}
                            disabled={line.quantity === 20}
                            aria-label={`Increase ${item.name} quantity`}
                          >
                            +
                          </button>
                        </div>
                        <button
                          className="cart-page-remove"
                          type="button"
                          onClick={() => removeLine(line.lineId)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <aside className="cart-page-summary">
              <p className="standalone-eyebrow">Order summary</p>
              <div className="cart-page-summary__row">
                <span>Subtotal</span>
                <strong>{money.format(subtotal)}</strong>
              </div>
              <p className="cart-page-summary__note">
                Pickup only. You&apos;ll pay when you collect your order.
              </p>
              <Link className="standalone-primary-button" href="/?cart=1">
                Continue to checkout
              </Link>
              <Link className="standalone-secondary-link" href="/menu/burgers">
                Add more items
              </Link>
            </aside>
          </div>
        )}
      </main>

      <MobileBottomNav active="cart" cartCount={cartCount} />
    </div>
  );
}
