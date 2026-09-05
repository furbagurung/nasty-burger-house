import type { Metadata } from "next";
import CartPage from "../components/cart-page";

export const metadata: Metadata = {
  title: "Cart | Nasty Burger House",
  description: "Review your Nasty Burger House pickup order.",
};

export default function CartRoute() {
  return <CartPage />;
}
