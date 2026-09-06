"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import MobileBottomNav from "../../components/mobile-bottom-nav";

const CART_STORAGE_KEY = "nasty-burger-cart-v2";

export default function CheckoutCompletePage() {
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOrderId(params.get("nbhOrderId") ?? "");
    window.localStorage.setItem(CART_STORAGE_KEY, "[]");
    window.sessionStorage.removeItem("nasty-square-pending-order");
    window.dispatchEvent(new Event("nasty-cart-updated"));
  }, []);

  return (
    <div className="standalone-page checkout-page">
      <main className="standalone-main">
        <section className="cart-empty-state">
          <Image src="/images/bag.webp" alt="" width={150} height={150} priority />
          <p className="standalone-eyebrow">Square checkout complete</p>
          <h1>Your order is in.</h1>
          <p>
            Thanks for getting Nasty. Square has processed the checkout and the pickup order is
            now in the Square order flow.
          </p>
          {orderId && <strong>Order reference: {orderId}</strong>}
          <div className="standalone-actions">
            <Link href="/">Back to home</Link>
            <Link href="/menu/burgers">Order more</Link>
          </div>
        </section>
      </main>
      <MobileBottomNav active="home" cartCount={0} />
    </div>
  );
}
