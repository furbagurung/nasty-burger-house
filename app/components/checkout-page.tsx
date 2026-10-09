"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, ShieldCheck } from "lucide-react";
import { menuItems } from "../data/menu";
import {
  calculateCartSubtotal,
  calculateLineUnitPrice,
  type CartLine,
} from "../lib/order";
import { getServiceStatus, type ServiceStatus } from "../lib/service";
import { mergeIdenticalCartLines } from "../lib/cart-lines";
import ButtonWithIcon from "@/components/ui/button-witn-icon";
import MobilePageHeader from "./mobile-page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SiSquare } from "react-icons/si";
import { Skeleton } from "@/components/ui/skeleton";

const CART_STORAGE_KEY = "nasty-burger-cart-v2";
const CHECKOUT_CONTACT_KEY = "nasty-burger-checkout-contact";
const PENDING_ORDER_KEY = "nasty-square-pending-order";

type ContactField = "name" | "email" | "phone";
type ContactErrors = Partial<Record<ContactField, string>>;
type CheckoutStep = 1 | 2;

const checkoutStepNames = ["Your details", "Review & pay"] as const;

function validateContact(name: string, email: string, phone: string): ContactErrors {
  const errors: ContactErrors = {};
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedPhone = phone.trim();

  // Match the rules enforced on /api/orders so validation is consistent.
  if (trimmedName.length < 2 || trimmedName.length > 80) {
    errors.name = "Enter your name (2–80 characters).";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) || trimmedEmail.length > 160) {
    errors.email = "Enter a valid email address.";
  }
  if (!/^[+()\d\s-]{8,24}$/.test(trimmedPhone)) {
    errors.phone = "Enter a valid phone number (8–24 characters).";
  }
  return errors;
}

function serverContactErrors(messages: string[]): ContactErrors {
  const fields: ContactErrors = {};
  for (const message of messages) {
    if (/pickup name/i.test(message)) fields.name = message;
    if (/email address/i.test(message)) fields.email = message;
    if (/phone number/i.test(message)) fields.phone = message;
  }
  return fields;
}

const money = new Intl.NumberFormat("en-US", {
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

export default function CheckoutPage({ serviceStatus: initialServiceStatus }: CheckoutPageProps) {
  const [serviceStatus, setServiceStatus] = useState(initialServiceStatus);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<ContactErrors>({});
  const [hydrated, setHydrated] = useState(false);
  const [activeStep, setActiveStep] = useState<CheckoutStep>(1);
  const stepAnnouncementRef = useRef<HTMLHeadingElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  // Reuse the Square idempotency key on a retry of the same exact checkout
  // payload. This avoids duplicate Square payment links after a lost response.
  const checkoutAttemptRef = useRef<{ signature: string; requestId: string } | null>(null);

  useEffect(() => {
    const syncServiceStatus = () => setServiceStatus(getServiceStatus());

    syncServiceStatus();
    const interval = window.setInterval(syncServiceStatus, 30_000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      setCart(raw ? mergeIdenticalCartLines(normaliseCart(JSON.parse(raw))) : []);
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
  const itemCount = useMemo(() => cart.reduce((total, line) => total + line.quantity, 0), [cart]);

  function changeStep(nextStep: CheckoutStep) {
    setErrors([]);
    setFieldErrors({});
    setActiveStep(nextStep);
  }

  function continueToReview() {
    const validation = validateContact(name, email, phone);
    if (Object.keys(validation).length > 0) {
      setFieldErrors(validation);
      setErrors(["Please correct the highlighted contact details."]);
      return;
    }
    changeStep(2);
  }

  useEffect(() => {
    if (!hydrated) return;
    stepAnnouncementRef.current?.focus({ preventScroll: true });
    if (activeStep !== 1) {
      stepAnnouncementRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    }
  }, [activeStep, hydrated]);

  function updateContactField(field: ContactField, value: string) {
    if (field === "name") setName(value);
    if (field === "email") setEmail(value);
    if (field === "phone") setPhone(value);
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setErrors([]);
  }

  useEffect(() => {
    if (errors.length === 0) return;
    const frame = window.requestAnimationFrame(() => {
      const firstInvalid = fieldErrors.name ? nameInputRef.current
        : fieldErrors.email ? emailInputRef.current
          : fieldErrors.phone ? phoneInputRef.current : null;
      if (firstInvalid) firstInvalid.focus({ preventScroll: true });
      errorSummaryRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [errors, fieldErrors]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || cart.length === 0 || activeStep !== 2) return;
    setErrors([]);
    setFieldErrors({});

    const validation = validateContact(name, email, phone);
    if (Object.keys(validation).length > 0) {
      setActiveStep(1);
      setFieldErrors(validation);
      setErrors(["Please correct the highlighted contact details."]);
      return;
    }

    if (!serviceStatus.acceptingOrders) {
      setErrors([serviceStatus.notice]);
      return;
    }

    setSubmitting(true);
    const customer = { name: name.trim(), email: email.trim(), phone: phone.trim() };
    const signature = JSON.stringify({ customer, notes, cart, subtotal });
    if (checkoutAttemptRef.current?.signature !== signature) {
      checkoutAttemptRef.current = { signature, requestId: crypto.randomUUID() };
    }
    const requestId = checkoutAttemptRef.current.requestId;
    try {
      try {
        window.localStorage.setItem(CHECKOUT_CONTACT_KEY, JSON.stringify(customer));
      } catch {
        // Optional contact autofill should never prevent order placement.
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          customer,
          notes,
          pickupMethod: "asap",
          paymentMethod: "square_checkout",
          cart,
          clientSubtotal: subtotal,
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        ok?: boolean;
        errors?: string[];
        orderId?: string;
        squareOrderId?: string;
        checkoutUrl?: string;
        subtotal?: number;
        storageMode?: "square";
      } | null;

      if (
        !response.ok ||
        !result?.ok ||
        !result.orderId ||
        !result.squareOrderId ||
        !result.checkoutUrl ||
        typeof result.subtotal !== "number"
      ) {
        const messages = Array.isArray(result?.errors)
          ? result.errors.filter((message): message is string => typeof message === "string").slice(0, 6)
          : [];
        const fallback = response.status === 429
          ? "Too many checkout attempts. Please wait a few minutes before trying again."
          : response.status === 409
            ? "Ordering is unavailable right now. Please try again when online ordering reopens."
            : response.status === 422
              ? "Some order details are invalid. Check your information and cart."
              : "We couldn't start Square checkout. Please try again.";
        setErrors(messages.length ? messages : [fallback]);
        const rejectedFields = serverContactErrors(messages);
        setFieldErrors(rejectedFields);
        if (Object.keys(rejectedFields).length > 0) setActiveStep(1);
        if (response.status === 409) setServiceStatus(getServiceStatus());
        return;
      }

      // Keep the cart until Square confirms payment and redirects back to the site.
      // Store both IDs so the confirmation page can verify the Square payment.
      try {
        window.sessionStorage.setItem(
          PENDING_ORDER_KEY,
          JSON.stringify({
            orderId: result.orderId,
            squareOrderId: result.squareOrderId,
            createdAt: Date.now(),
          }),
        );
      } catch {
        setErrors(["We couldn't save your checkout details in this browser. Please allow site storage and try again. No payment has been made on this page."]);
        return;
      }
      window.location.assign(result.checkoutUrl);
    } catch {
      setErrors([
        "We couldn't connect to Square checkout. Check your internet connection and try again. Your cart is still saved.",
      ]);
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="standalone-page checkout-page">
        <MobilePageHeader
          title="Checkout"
          backHref="/cart"
          backLabel="Back to cart"
        />
        <main className="standalone-main checkout-page-main">
          <Card className="checkout-loading-card" role="status" aria-label="Loading checkout">
            <CardContent className="checkout-loading-content">
              <Skeleton className="checkout-loading-title" />
              <Skeleton className="checkout-loading-line" />
              <Skeleton className="checkout-loading-panel" />
              <Skeleton className="checkout-loading-panel" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="standalone-page checkout-page">
        <MobilePageHeader
          title="Checkout"
          backHref="/cart"
          backLabel="Back to cart"
        />
        <main className="standalone-main checkout-page-main">
          <section className="cart-empty-state">
            <Image src="/images/bag.webp" alt="" width={140} height={140} />
            <p className="standalone-eyebrow">Checkout</p>
            <h2>Your cart is empty.</h2>
            <p>Add something from the menu before checking out.</p>
            <Link href="/menu/burgers">Explore the menu</Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="standalone-page checkout-page">
      <MobilePageHeader
        title="Checkout"
        backHref="/cart"
        backLabel="Back to cart"
      />
      <main className="standalone-main checkout-page-main">
        <header className="checkout-intro checkout-desktop-header cart-redesign-header">
          <Link className="cart-redesign-back" href="/cart" aria-label="Back to cart">
            <ChevronLeft size={24} strokeWidth={2.3} aria-hidden="true" />
          </Link>
          <div className="cart-redesign-title-wrap">
            <div className="cart-redesign-title-row">
              <h1>Checkout</h1>
            </div>
          </div>
        </header>

        <nav
          className={`checkout-wizard-progress${activeStep === 2 ? " is-review-step" : ""}`}
          aria-label="Checkout progress"
        >
          <ol>
            {checkoutStepNames.map((label, index) => {
              const position = (index + 1) as CheckoutStep;
              const isComplete = position < activeStep;
              const isCurrent = position === activeStep;
              return (
                <li key={label} className={isCurrent ? "is-current" : isComplete ? "is-complete" : "is-upcoming"}>
                  <button
                    type="button"
                    aria-label={`Step ${position}: ${label}${isComplete ? ", completed" : isCurrent ? ", current" : ", upcoming"}`}
                    aria-current={isCurrent ? "step" : undefined}
                    disabled={submitting || !isComplete}
                    onClick={() => changeStep(position)}
                  >
                    <span className="checkout-wizard-progress__number" aria-hidden="true">
                      {isComplete ? <CheckCircle2 size={20} strokeWidth={2.4} /> : position}
                    </span>
                    <span className="checkout-wizard-progress__step" aria-hidden="true">Step {position}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
        <h2 className="checkout-wizard__current-step" tabIndex={-1} ref={stepAnnouncementRef} aria-live="polite">
          Step {activeStep} of 2 · {checkoutStepNames[activeStep - 1]}
        </h2>

        <form className={`checkout-page-layout${activeStep === 2 ? " is-review-step" : ""}`} onSubmit={submit} noValidate>
          {errors.length > 0 && (
            <div className="checkout-errors checkout-errors--top" role="alert" ref={errorSummaryRef} tabIndex={-1}>
              <AlertCircle size={19} aria-hidden="true" />
              <div>
                <strong>We couldn&apos;t continue to payment.</strong>
                <ul>{errors.map((error, index) => <li key={index}>{error}</li>)}</ul>
              </div>
            </div>
          )}

          <div className="checkout-page-sections">
            <Card className="checkout-panel ring-0" hidden={activeStep !== 1}>
              <CardHeader className="checkout-panel__heading">
                <div>
                  <h2>Your details</h2>
                </div>
              </CardHeader>
              <CardContent className="checkout-panel__content">
                <div className="account-form-grid">
                  <div className="checkout-field">
                    <Label htmlFor="checkout-name">Full name</Label>
                    <Input
                      id="checkout-name"
                      ref={nameInputRef}
                      value={name}
                      onChange={(event) => updateContactField("name", event.target.value)}
                      minLength={2}
                      maxLength={80}
                      autoComplete="name"
                      placeholder="Your full name"
                      aria-invalid={Boolean(fieldErrors.name)}
                      aria-describedby={fieldErrors.name ? "checkout-name-error" : undefined}
                      disabled={submitting}
                      required
                    />
                    {fieldErrors.name && <span id="checkout-name-error" className="checkout-field-error">{fieldErrors.name}</span>}
                  </div>
                  <div className="checkout-field">
                    <Label htmlFor="checkout-email">Email address</Label>
                    <Input
                      id="checkout-email"
                      ref={emailInputRef}
                      type="email"
                      inputMode="email"
                      value={email}
                      onChange={(event) => updateContactField("email", event.target.value)}
                      maxLength={160}
                      autoComplete="email"
                      placeholder="you@example.com"
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? "checkout-email-error" : undefined}
                      disabled={submitting}
                      required
                    />
                    {fieldErrors.email && <span id="checkout-email-error" className="checkout-field-error">{fieldErrors.email}</span>}
                  </div>
                  <div className="checkout-field">
                    <Label htmlFor="checkout-phone">Mobile number</Label>
                    <Input
                      id="checkout-phone"
                      ref={phoneInputRef}
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(event) => updateContactField("phone", event.target.value)}
                      minLength={8}
                      maxLength={24}
                      autoComplete="tel"
                      placeholder="04XX XXX XXX"
                      aria-invalid={Boolean(fieldErrors.phone)}
                      aria-describedby={fieldErrors.phone ? "checkout-phone-error" : undefined}
                      disabled={submitting}
                      required
                    />
                    {fieldErrors.phone && <span id="checkout-phone-error" className="checkout-field-error">{fieldErrors.phone}</span>}
                  </div>
                  <details className="checkout-notes-disclosure account-form-grid__full">
                    <summary>
                      <span>Add a note for the kitchen <span className="checkout-optional">Optional</span></span>
                      <span className="checkout-notes-disclosure__chevron" aria-hidden="true" />
                    </summary>
                    <div className="checkout-field">
                      <Label htmlFor="checkout-notes">Kitchen instructions</Label>
                      <textarea
                        id="checkout-notes"
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="e.g. any special preparation instructions"
                        rows={2}
                        maxLength={300}
                        disabled={submitting}
                      />
                    </div>
                  </details>
                </div>
              </CardContent>
            </Card>

            <Card className="checkout-panel ring-0" hidden={activeStep !== 2}>
              <CardHeader className="checkout-panel__heading">
                <div>
                  <h2>Secure payment</h2>
                  <p>Complete payment after reviewing your order.</p>
                </div>
              </CardHeader>
              <CardContent className="checkout-panel__content">
                <div className="checkout-payment-card" role="group" aria-label="Selected payment method: Square">
                  <div className="checkout-payment-card__top">
                    <span className="checkout-payment-card__icon" aria-hidden="true">
                      <SiSquare size={27} />
                    </span>
                    <div className="checkout-payment-card__details">
                      <strong>Pay securely with Square</strong>
                      <span>Credit/debit cards and eligible digital wallets</span>
                    </div>
                    <Badge variant="secondary" className="checkout-payment-card__selected">
                      <CheckCircle2 size={14} aria-hidden="true" />
                      Selected
                    </Badge>
                  </div>
                  <p className="checkout-payment-card__note">
                    <ShieldCheck size={15} aria-hidden="true" />
                    <span>You&apos;ll complete payment securely on Square.</span>
                  </p>
                </div>
              </CardContent>
            </Card>
            {activeStep === 1 && (
              <div className="checkout-wizard-actions">
                <ButtonWithIcon
                  tone="red"
                  fullWidth
                  type="button"
                  className="checkout-flow-cta"
                  onClick={continueToReview}
                  disabled={submitting}
                >
                  Review order
                </ButtonWithIcon>
              </div>
            )}
          </div>

          <Card className="checkout-page-review ring-0" hidden={activeStep !== 2}>
            <CardHeader className="checkout-page-review__heading">
              <div className="checkout-summary-heading">
                <p>Order summary</p>
                <h2>{itemCount} {itemCount === 1 ? "item" : "items"} in your order</h2>
              </div>
              <Link href="/cart">Edit cart</Link>
            </CardHeader>
            <CardContent className="checkout-review-content">
              <div className="checkout-wizard-review-details">
                <div>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span className="checkout-review-contact">
                    <strong>{name.trim()}</strong>
                    <small>{email.trim()} · {phone.trim()}</small>
                  </span>
                </div>
                <button type="button" onClick={() => changeStep(1)}>Edit details</button>
              </div>
              <Separator />
              <div className="checkout-page-review__lines">
                {cart.map((line) => {
                  const item = menuItems.find((entry) => entry.id === line.itemId);
                  if (!item) return null;
                  return (
                    <div key={line.lineId}>
                      <span>{line.quantity}× {item.name}</span>
                      <strong>{money.format(calculateLineUnitPrice(line, item) * line.quantity)}</strong>
                    </div>
                  );
                })}
              </div>
              <Separator />
              <div className="checkout-page-review__total">
                <span>Total</span>
                <strong>{money.format(subtotal)}</strong>
              </div>
              {!serviceStatus.acceptingOrders && (
                <div className="checkout-service-notice is-closed" role="status">
                  <AlertCircle size={17} aria-hidden="true" />
                  <div>
                    <strong>Ordering unavailable</strong>
                    <p>{serviceStatus.notice}</p>
                  </div>
                </div>
              )}
              <ButtonWithIcon
                tone="red"
                fullWidth
                className="checkout-flow-cta"
                type="submit"
                disabled={submitting || !serviceStatus.acceptingOrders}
              >
                {!serviceStatus.acceptingOrders
                  ? "Ordering unavailable"
                  : submitting
                    ? "Opening Square…"
                    : `Continue to payment · ${money.format(subtotal)}`}
              </ButtonWithIcon>
              <small className="checkout-secure-note">
                <ShieldCheck size={15} aria-hidden="true" /> You&apos;ll pay securely on Square. No charge on this page.
              </small>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
}
