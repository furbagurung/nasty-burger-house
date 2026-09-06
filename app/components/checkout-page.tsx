"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { menuItems } from "../data/menu";
import {
  calculateCartSubtotal,
  calculateLineUnitPrice,
  type CartLine,
} from "../lib/order";
import type { ServiceStatus } from "../lib/service";
import MobileBottomNav from "./mobile-bottom-nav";

const CART_STORAGE_KEY = "nasty-burger-cart-v2";
const CHECKOUT_CONTACT_KEY = "nasty-burger-checkout-contact";

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
        modifiers: Array.isArray(line.modifiers) ? line.modifiers : [],
        removedIngredients: Array.isArray(line.removedIngredients)
          ? line.removedIngredients.filter(
              (value): value is string => typeof value === "string",
            )
          : [],
        boxBurgers: Array.isArray(line.boxBurgers)
          ? line.boxBurgers.filter(
              (value): value is string => typeof value === "string",
            )
          : [],
        boxDrinks: Array.isArray(line.boxDrinks)
          ? line.boxDrinks.filter(
              (value): value is string => typeof value === "string",
            )
          : [],
      },
    ];
  });
}

type CheckoutPageProps = {
  serviceStatus: ServiceStatus;
};

export default function CheckoutPage({ serviceStatus }: CheckoutPageProps) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      setCart(raw ? normaliseCart(JSON.parse(raw)) : []);
    } catch {
      setCart([]);
    }

    try {
      const rawContact = window.localStorage.getItem(CHECKOUT_CONTACT_KEY);
      if (rawContact) {
        const contact = JSON.parse(rawContact) as {
          name?: unknown;
          email?: unknown;
          phone?: unknown;
        };
        if (typeof contact.name === "string") setName(contact.name);
        if (typeof contact.email === "string") setEmail(contact.email);
        if (typeof contact.phone === "string") setPhone(contact.phone);
      }
    } catch {
      // Saved contact details are only a convenience; ignore malformed local data.
    }

    setHydrated(true);
  }, []);

  const subtotal = useMemo(() => calculateCartSubtotal(cart), [cart]);
  const count = cart.reduce((total, line) => total + line.quantity, 0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || cart.length === 0) return;
    setSubmitting(true);
    setErrors([]);

    const requestId = crypto.randomUUID();
    try {
      window.localStorage.setItem(
        CHECKOUT_CONTACT_KEY,
        JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim() }),
      );

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          customer: { name, email, phone },
          notes,
          pickupMethod: "asap",
          paymentMethod: "square_checkout",
          cart,
          clientSubtotal: subtotal,
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        errors?: string[];
        orderId?: string;
        squareOrderId?: string;
        checkoutUrl?: string;
        subtotal?: number;
        storageMode?: "square";
      };

      if (
        !response.ok ||
        !result.ok ||
        !result.orderId ||
        !result.squareOrderId ||
        !result.checkoutUrl ||
        typeof result.subtotal !== "number"
      ) {
        setErrors(
          result.errors?.length
            ? result.errors
            : ["The secure checkout could not be started. Please try again."],
        );
        return;
      }

      // Keep the cart until Square confirms payment and redirects back to the site.
      window.sessionStorage.setItem("nasty-square-pending-order", result.orderId);
      window.location.assign(result.checkoutUrl);
    } catch {
      setErrors([
        "We could not reach the order service. Check your connection and try again.",
      ]);
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="standalone-page">
        <main className="standalone-main">
          <div className="cart-page-loading">Loading checkout…</div>
        </main>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="standalone-page checkout-page">
        <main className="standalone-main">
          <section className="cart-empty-state">
            <Image src="/images/bag.webp" alt="" width={140} height={140} />
            <p className="standalone-eyebrow">Checkout</p>
            <h2>Your cart is empty.</h2>
            <p>Add something from the menu before checking out.</p>
            <Link href="/menu/burgers">Explore the menu</Link>
          </section>
        </main>
        <MobileBottomNav active="cart" cartCount={0} />
      </div>
    );
  }

  return (
    <div className="standalone-page checkout-page">
      <main className="standalone-main checkout-page-main">
        <div className="standalone-page-heading">
          <p className="standalone-eyebrow">ASAP pickup · Secure Square checkout</p>
          <div>
            <h1>Checkout</h1>
            <span>
              {count} item{count === 1 ? "" : "s"}
            </span>
          </div>
          <p>
            Confirm your pickup details, then continue to Square for secure payment.
          </p>
        </div>

        <form className="checkout-page-layout" onSubmit={submit}>
          <div className="checkout-page-sections">
            <section className="account-card checkout-panel">
              <div className="checkout-panel__heading">
                <span>01</span>
                <div>
                  <h2>Pickup</h2>
                  <p>{serviceStatus.prepTimeLabel} estimated preparation.</p>
                </div>
              </div>
              <div className="checkout-location-card">
                <strong>{serviceStatus.locationName}</strong>
                <span>{serviceStatus.address}</span>
                <small>{serviceStatus.statusLabel}</small>
              </div>
            </section>

            <section className="account-card checkout-panel">
              <div className="checkout-panel__heading">
                <span>02</span>
                <div>
                  <h2>Contact details</h2>
                  <p>Used for your Square customer and pickup order.</p>
                </div>
              </div>
              <div className="account-form-grid">
                <label>
                  Pickup name
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    minLength={2}
                    maxLength={80}
                    autoComplete="name"
                    required
                  />
                </label>
                <label>
                  Email address
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    maxLength={160}
                    autoComplete="email"
                    required
                  />
                </label>
                <label>
                  Mobile number
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    minLength={8}
                    maxLength={24}
                    autoComplete="tel"
                    required
                  />
                </label>
                <label className="account-form-grid__full">
                  Order notes <small>Optional</small>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={3}
                    maxLength={300}
                  />
                </label>
              </div>
              <p className="checkout-member-note">
                Your contact details are matched to the Square Customer Directory to help the
                store identify your order.
              </p>
            </section>

            <section className="account-card checkout-panel">
              <div className="checkout-panel__heading">
                <span>03</span>
                <div>
                  <h2>Payment</h2>
                  <p>Card details are entered securely on Square.</p>
                </div>
              </div>
              <div className="checkout-payment-card">
                <strong>Secure checkout by Square</strong>
                <span>
                  You will continue to Square to complete payment, then return to Nasty Burger
                  House.
                </span>
              </div>
            </section>
          </div>

          <aside className="checkout-page-review">
            <div className="checkout-page-review__heading">
              <h2>Order summary</h2>
              <Link href="/cart">Edit cart</Link>
            </div>
            <div className="checkout-page-review__lines">
              {cart.map((line) => {
                const item = menuItems.find((entry) => entry.id === line.itemId);
                if (!item) return null;
                return (
                  <div key={line.lineId}>
                    <span>
                      {line.quantity}× {item.name}
                    </span>
                    <strong>
                      {money.format(calculateLineUnitPrice(line, item) * line.quantity)}
                    </strong>
                  </div>
                );
              })}
            </div>
            <div className="checkout-page-review__total">
              <span>Total</span>
              <strong>{money.format(subtotal)}</strong>
            </div>
            {errors.length > 0 && (
              <div className="checkout-errors" role="alert">
                <strong>Please check your order:</strong>
                <ul>
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              className="standalone-primary-button"
              type="submit"
              disabled={submitting || !serviceStatus.acceptingOrders}
            >
              {!serviceStatus.acceptingOrders
                ? "Ordering unavailable"
                : submitting
                  ? "Opening Square…"
                  : "Continue to secure payment"}
            </button>
            <small>
              Orders, customer details and payment are handled through Square. Nasty Burger House
              never receives your card details.
            </small>
          </aside>
        </form>
      </main>
      <MobileBottomNav active="cart" cartCount={count} />
    </div>
  );
}
