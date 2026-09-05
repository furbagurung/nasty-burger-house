"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { menuItems, modifierChoices } from "../data/menu";
import {
  customerBackendMode,
  loadCurrentCustomer,
} from "../lib/customer-backend";
import {
  awardOrderDripPoints,
  ensureSignupBonus,
  saveCustomerOrder,
  saveCustomerProfile,
  type CustomerOrderLine,
  type CustomerProfile,
} from "../lib/customer-store";
import { DRIP_POINTS_PER_AUD } from "../lib/loyalty";
import {
  calculateCartSubtotal,
  calculateLineUnitPrice,
  type CartLine,
} from "../lib/order";
import type { ServiceStatus } from "../lib/service";
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
    return [{
      lineId: line.lineId,
      itemId: line.itemId,
      quantity: Math.max(1, Math.min(20, Math.floor(line.quantity))),
      combo: Boolean(line.combo),
      drink: typeof line.drink === "string" ? line.drink : undefined,
      modifiers: Array.isArray(line.modifiers) ? line.modifiers : [],
      removedIngredients: Array.isArray(line.removedIngredients) ? line.removedIngredients.filter((value): value is string => typeof value === "string") : [],
      boxBurgers: Array.isArray(line.boxBurgers) ? line.boxBurgers.filter((value): value is string => typeof value === "string") : [],
      boxDrinks: Array.isArray(line.boxDrinks) ? line.boxDrinks.filter((value): value is string => typeof value === "string") : [],
    }];
  });
}

function detailsForLine(line: CartLine) {
  const details: string[] = [];
  if (line.combo) details.push(`Beast Combo${line.drink ? ` · ${line.drink}` : ""}`);
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
  if (line.removedIngredients.length > 0) details.push(`Without ${line.removedIngredients.join(", ")}`);
  if (line.boxBurgers.length > 0) {
    details.push(
      `Burgers: ${line.boxBurgers.map((id) => menuItems.find((item) => item.id === id)?.name ?? id).join(", ")}`,
    );
  }
  if (line.boxDrinks.length > 0) details.push(`Drinks: ${line.boxDrinks.join(", ")}`);
  return details;
}

function snapshotLines(cart: CartLine[]): CustomerOrderLine[] {
  return cart.flatMap((line) => {
    const item = menuItems.find((entry) => entry.id === line.itemId);
    if (!item) return [];
    const unitPrice = calculateLineUnitPrice(line, item);
    return [{
      itemId: item.id,
      name: item.name,
      image: item.image,
      quantity: line.quantity,
      unitPrice,
      lineTotal: unitPrice * line.quantity,
      details: detailsForLine(line),
    }];
  });
}

type CheckoutPageProps = {
  serviceStatus: ServiceStatus;
};

export default function CheckoutPage({ serviceStatus }: CheckoutPageProps) {
  const router = useRouter();
  const backendMode = customerBackendMode();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [createLocalAccount, setCreateLocalAccount] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      let storedCart: CartLine[] = [];
      try {
        const raw = window.localStorage.getItem(CART_STORAGE_KEY);
        storedCart = raw ? normaliseCart(JSON.parse(raw)) : [];
      } catch {
        storedCart = [];
      }

      try {
        const customer = await loadCurrentCustomer();
        if (!active) return;
        setCart(storedCart);
        setProfile(customer);
        if (customer) {
          setName(customer.name);
          setEmail(customer.email);
          setPhone(customer.phone);
          setCreateLocalAccount(false);
        }
      } catch (loadError) {
        if (!active) return;
        setCart(storedCart);
        setErrors([
          loadError instanceof Error
            ? loadError.message
            : "We could not load your account details.",
        ]);
      } finally {
        if (active) setHydrated(true);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const subtotal = useMemo(() => calculateCartSubtotal(cart), [cart]);
  const count = cart.reduce((total, line) => total + line.quantity, 0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || cart.length === 0) return;
    setSubmitting(true);
    setErrors([]);

    let activeProfile = profile;
    if (!activeProfile && backendMode === "local-fallback" && createLocalAccount) {
      activeProfile = saveCustomerProfile({ name, email, phone });
      ensureSignupBonus();
      setProfile(activeProfile);
    }

    const requestId = crypto.randomUUID();
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          customer: { name, email, phone },
          notes,
          pickupMethod: "asap",
          paymentMethod: "pay_at_pickup",
          cart,
          clientSubtotal: subtotal,
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        errors?: string[];
        orderId?: string;
        subtotal?: number;
        earnedDripPoints?: number;
        dripPointsStatus?: "pending" | "available" | null;
        adminNotification?: "sent" | "not-configured" | "failed";
        storageMode?: "supabase" | "local-fallback";
      };

      if (!response.ok || !result.ok || !result.orderId || typeof result.subtotal !== "number") {
        setErrors(result.errors?.length ? result.errors : ["The order could not be submitted. Please try again."]);
        return;
      }

      // Local persistence is only the preview fallback, plus a same-device guest
      // receipt when a Supabase order was submitted without an authenticated user.
      if (result.storageMode !== "supabase" || !activeProfile) {
        const earnedPoints =
          activeProfile && result.storageMode !== "supabase"
            ? awardOrderDripPoints(result.orderId, result.subtotal)
            : result.earnedDripPoints ?? 0;

        saveCustomerOrder({
          orderId: result.orderId,
          submittedAt: new Date().toISOString(),
          status: "received",
          subtotal: result.subtotal,
          earnedDripPoints: earnedPoints,
          dripPointsStatus: result.dripPointsStatus ?? undefined,
          adminNotification: result.adminNotification,
          customerId: activeProfile?.id,
          customerName: name.trim(),
          customerEmail: email.trim().toLowerCase(),
          customerPhone: phone.trim(),
          pickupLabel: `${serviceStatus.locationName} · ASAP pickup`,
          lines: snapshotLines(cart),
        });
      }

      window.localStorage.setItem(CART_STORAGE_KEY, "[]");
      window.dispatchEvent(new Event("nasty-cart-updated"));
      router.push(`/account/orders/${encodeURIComponent(result.orderId)}?new=1`);
    } catch {
      setErrors(["We could not reach the order service. Check your connection and try again."]);
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return <div className="standalone-page"><main className="standalone-main"><div className="cart-page-loading">Loading checkout…</div></main></div>;
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
          <p className="standalone-eyebrow">ASAP pickup · Pay at pickup</p>
          <div><h1>Checkout</h1><span>{count} item{count === 1 ? "" : "s"}</span></div>
          <p>Confirm your pickup details and send the order to Nasty Burger House.</p>
        </div>

        <form className="checkout-page-layout" onSubmit={submit}>
          <div className="checkout-page-sections">
            <section className="account-card checkout-panel">
              <div className="checkout-panel__heading">
                <span>01</span>
                <div><h2>Pickup</h2><p>{serviceStatus.prepTimeLabel} estimated preparation.</p></div>
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
                <div><h2>Contact details</h2><p>Used to identify your pickup order.</p></div>
              </div>
              <div className="account-form-grid">
                <label>Pickup name<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required /></label>
                <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={160} required /></label>
                <label>Mobile number<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} minLength={8} maxLength={24} required /></label>
                <label className="account-form-grid__full">Order notes <small>Optional</small><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} maxLength={300} /></label>
              </div>

              {!profile && backendMode === "supabase" && (
                <div className="checkout-account-prompt">
                  <div>
                    <strong>Want Drip Points on this order?</strong>
                    <small>Sign in before placing it. Points are linked to the verified account session, not an email typed at checkout.</small>
                  </div>
                  <div>
                    <Link href="/account/sign-in?return=/checkout">Sign in</Link>
                    <Link href="/account/create?return=/checkout">Create account</Link>
                  </div>
                </div>
              )}

              {!profile && backendMode === "local-fallback" && (
                <label className="checkout-account-toggle">
                  <input type="checkbox" checked={createLocalAccount} onChange={(event) => setCreateLocalAccount(event.target.checked)} />
                  <span><strong>Create my preview account</strong><small>Local fallback only. Production accounts use Supabase Auth.</small></span>
                </label>
              )}

              {profile && <p className="checkout-member-note">Ordering as <strong>{profile.name}</strong> · Drip Points will be pending until this order is completed.</p>}
            </section>

            <section className="account-card checkout-panel">
              <div className="checkout-panel__heading">
                <span>03</span>
                <div><h2>Payment</h2><p>Online payment will be connected later.</p></div>
              </div>
              <div className="checkout-payment-card"><strong>Pay when you collect</strong><span>No card details are required online.</span></div>
            </section>
          </div>

          <aside className="checkout-page-review">
            <div className="checkout-page-review__heading"><h2>Order summary</h2><Link href="/cart">Edit cart</Link></div>
            <div className="checkout-page-review__lines">
              {cart.map((line) => {
                const item = menuItems.find((entry) => entry.id === line.itemId);
                if (!item) return null;
                return <div key={line.lineId}><span>{line.quantity}× {item.name}</span><strong>{money.format(calculateLineUnitPrice(line, item) * line.quantity)}</strong></div>;
              })}
            </div>
            <div className="checkout-page-review__total"><span>Subtotal</span><strong>{money.format(subtotal)}</strong></div>
            {profile && <p className="checkout-points-preview">Earn <strong>{Math.floor(subtotal * DRIP_POINTS_PER_AUD)} pending Drip Points</strong>. They become available when the order is completed.</p>}
            {errors.length > 0 && <div className="checkout-errors" role="alert"><strong>Please check your order:</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
            <button className="standalone-primary-button" type="submit" disabled={submitting || !serviceStatus.acceptingOrders}>
              {!serviceStatus.acceptingOrders ? "Ordering unavailable" : submitting ? "Sending order…" : "Place pickup order"}
            </button>
            <small>The database is the production source of truth. External admin/kitchen notifications run after the order is safely stored.</small>
          </aside>
        </form>
      </main>
      <MobileBottomNav active="cart" cartCount={count} />
    </div>
  );
}
