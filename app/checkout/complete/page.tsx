"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import MobileBottomNav from "../../components/mobile-bottom-nav";

const CART_STORAGE_KEY = "nasty-burger-cart-v2";
const PENDING_ORDER_KEY = "nasty-square-pending-order";

type VerificationState = "checking" | "paid" | "pending" | "error";

export default function CheckoutCompletePage() {
  const [orderId, setOrderId] = useState("");
  const [verificationState, setVerificationState] =
    useState<VerificationState>("checking");

  useEffect(() => {
    async function verifyPayment() {
      const params = new URLSearchParams(window.location.search);
      const returnedOrderId = params.get("nbhOrderId") ?? "";
      setOrderId(returnedOrderId);

      const storedPendingOrder =
        window.sessionStorage.getItem(PENDING_ORDER_KEY);

      if (!storedPendingOrder) {
        setVerificationState("error");
        return;
      }

      try {
        const pendingOrder = JSON.parse(storedPendingOrder) as {
          orderId?: string;
          squareOrderId?: string;
        };

        if (
          !pendingOrder.squareOrderId ||
          !pendingOrder.orderId ||
          pendingOrder.orderId !== returnedOrderId
        ) {
          setVerificationState("error");
          return;
        }

        const response = await fetch(
          `/api/square/order-status?squareOrderId=${encodeURIComponent(
            pendingOrder.squareOrderId,
          )}`,
          { cache: "no-store" },
        );

        const result = (await response.json()) as {
          ok?: boolean;
          paid?: boolean;
          status?: string;
        };

        if (!response.ok || !result.ok) {
          setVerificationState("error");
          return;
        }

        if (!result.paid) {
          setVerificationState("pending");
          return;
        }

        window.localStorage.setItem(CART_STORAGE_KEY, "[]");
        window.sessionStorage.removeItem(PENDING_ORDER_KEY);
        window.dispatchEvent(new Event("nasty-cart-updated"));

        setVerificationState("paid");
      } catch {
        setVerificationState("error");
      }
    }

    void verifyPayment();
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
              <p className="standalone-eyebrow">Payment processing</p>
              <h1>We&apos;re checking your payment.</h1>
              <p>
                Your payment has not been confirmed yet. Please do not place
                another order.
              </p>
            </>
          )}

          {verificationState === "error" && (
            <>
              <p className="standalone-eyebrow">Verification unavailable</p>
              <h1>We couldn&apos;t confirm your payment.</h1>
              <p>
                Please check your Square payment confirmation before trying
                again.
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