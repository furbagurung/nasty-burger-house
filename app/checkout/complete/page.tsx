"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import MobileBottomNav from "../../components/mobile-bottom-nav";

const CART_STORAGE_KEY = "nasty-burger-cart-v2";
const LEGACY_CART_STORAGE_KEY = "nasty-burger-phase-one-cart";
const PENDING_ORDER_KEY = "nasty-square-pending-order";
const MAX_VERIFICATION_ATTEMPTS = 30;
const VERIFICATION_DELAY_MS = 2000;

type VerificationState = "checking" | "paid" | "pending" | "error";

type PendingOrder = {
  orderId?: string;
  squareOrderId?: string;
};

function readPendingOrder(): PendingOrder {
  const raw = window.sessionStorage.getItem(PENDING_ORDER_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      const value = parsed as PendingOrder;
      return {
        orderId: typeof value.orderId === "string" ? value.orderId : undefined,
        squareOrderId:
          typeof value.squareOrderId === "string" ? value.squareOrderId : undefined,
      };
    }
  } catch {
    // Older checkout builds stored only the Nasty Burger order ID as plain text.
    return { orderId: raw };
  }

  return {};
}

export default function CheckoutCompletePage() {
  const [orderId, setOrderId] = useState("");
  const [verificationState, setVerificationState] =
    useState<VerificationState>("checking");

  useEffect(() => {
    let attempts = 0;
    let timer: number | undefined;
    let cancelled = false;

    const params = new URLSearchParams(window.location.search);
    const returnedOrderId = params.get("nbhOrderId")?.trim() ?? "";
    // Square production checkout appends its own orderId to redirect_url.
    const redirectedSquareOrderId = params.get("orderId")?.trim() ?? "";
    const pendingOrder = readPendingOrder();
    const squareOrderId =
      redirectedSquareOrderId || pendingOrder.squareOrderId?.trim() || "";
    const displayOrderId = returnedOrderId || pendingOrder.orderId?.trim() || "";

    setOrderId(displayOrderId);

    function scheduleRetry() {
      if (cancelled) return;
      if (attempts >= MAX_VERIFICATION_ATTEMPTS) {
        setVerificationState("error");
        return;
      }

      attempts += 1;
      setVerificationState("pending");
      timer = window.setTimeout(() => {
        void verifyPayment();
      }, VERIFICATION_DELAY_MS);
    }

    async function verifyPayment() {
      if (!squareOrderId) {
        setVerificationState("error");
        return;
      }

      try {
        const response = await fetch(
          `/api/square/order-status?squareOrderId=${encodeURIComponent(
            squareOrderId,
          )}`,
          { cache: "no-store" },
        );

        const result = (await response.json()) as {
          ok?: boolean;
          paid?: boolean;
          status?: string;
        };

        if (cancelled) return;

        if (!response.ok || !result.ok) {
          scheduleRetry();
          return;
        }

        if (!result.paid) {
          const terminalFailure = ["CANCELED", "FAILED"].includes(
            result.status?.toUpperCase() ?? "",
          );

          if (terminalFailure) {
            setVerificationState("error");
            return;
          }

          scheduleRetry();
          return;
        }

        // Only clear the cart after Square confirms the payment as COMPLETED.
        window.localStorage.setItem(CART_STORAGE_KEY, "[]");
        window.localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
        window.sessionStorage.removeItem(PENDING_ORDER_KEY);
        window.dispatchEvent(new Event("nasty-cart-updated"));

        setVerificationState("paid");
      } catch {
        if (!cancelled) scheduleRetry();
      }
    }

    void verifyPayment();

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="standalone-page checkout-page">
      <main className="standalone-main">
        <section className="cart-empty-state">
          <Image
            src="/images/bag.webp"
            alt=""
            width={150}
            height={150}
            priority
          />

          {verificationState === "checking" && (
            <>
              <p className="standalone-eyebrow">Checking payment</p>
              <h1>Confirming your order...</h1>
              <p>Please wait while we verify your payment with Square.</p>
            </>
          )}

          {verificationState === "paid" && (
            <>
              <p className="standalone-eyebrow">Payment confirmed</p>
              <h1>Your order is in.</h1>
              <p>
                Thanks for getting Nasty. Your payment has been confirmed and
                your pickup order is now with Nasty Burger House.
              </p>

              {orderId && <strong>Order reference: {orderId}</strong>}
            </>
          )}

          {verificationState === "pending" && (
            <>
              <p className="standalone-eyebrow">Finalising payment</p>
              <h1>Your payment is being confirmed.</h1>
              <p>
                Square is finishing the confirmation. Please keep this page open
                and do not place the order again.
              </p>
            </>
          )}

          {verificationState === "error" && (
            <>
              <p className="standalone-eyebrow">Payment confirmation delayed</p>
              <h1>Please don&apos;t pay again.</h1>
              <p>
                If Square showed your payment as successful, your order may
                already be paid. Please keep your Square confirmation and contact
                Nasty Burger House if you need help.
              </p>
            </>
          )}

          <div className="standalone-actions">
            <Link href="/">Back to home</Link>
            {verificationState === "paid" && (
              <Link href="/menu/burgers">Order more</Link>
            )}
          </div>
        </section>
      </main>

      <MobileBottomNav
        active="home"
        cartCount={verificationState === "paid" ? 0 : undefined}
      />
    </div>
  );
}
